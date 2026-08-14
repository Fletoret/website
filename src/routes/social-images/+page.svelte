<script lang="ts">
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';

  import { tick } from 'svelte';
  import slugify from 'slugify';
  import { toCanvas } from 'html-to-image';
  import {
    IconDownload,
    IconUpload,
    IconPhoto,
    IconX,
    IconSparkles,
    IconCopy,
    IconCheck,
  } from '@tabler/icons-svelte';

  import { downloadImage } from '$lib/utils';
  import { getAndLoadTheme } from '$lib/theme';
  import CONFIG from '$lib/config';

  import Header from '$lib/components/Header.svelte';

  void getAndLoadTheme();

  // ---------------------------------------------------------------------------
  // Platform presets. Each carries the exact pixel dimensions the network wants;
  // the preview is rendered at a fitted CSS size and scaled up to these on export.
  // ---------------------------------------------------------------------------
  type Preset = {
    id: string;
    name: string;
    hint: string;
    w: number;
    h: number;
  };

  const presets: Preset[] = [
    { id: 'og', name: 'Facebook · OG', hint: '1200×630', w: 1200, h: 630 },
    { id: 'x', name: 'X · Twitter', hint: '1600×900', w: 1600, h: 900 },
    { id: 'ig', name: 'Instagram', hint: '1080×1080', w: 1080, h: 1080 },
    { id: 'story', name: 'Story · Reels', hint: '1080×1920', w: 1080, h: 1920 },
    { id: 'in', name: 'LinkedIn', hint: '1200×627', w: 1200, h: 627 },
    { id: 'reddit', name: 'Reddit', hint: '1200×628', w: 1200, h: 628 },
    { id: 'pin', name: 'Pinterest', hint: '1000×1500', w: 1000, h: 1500 },
  ];

  type BackgroundStyle = 'blur' | 'gradient' | 'mesh' | 'solid';

  const backgroundStyles: { id: BackgroundStyle; name: string }[] = [
    { id: 'blur', name: 'I turbullt' },
    { id: 'gradient', name: 'Kalim ngjyrash' },
    { id: 'mesh', name: 'Rrjetë ngjyrash' },
    { id: 'solid', name: 'Një ngjyrë' },
  ];

  type Palette = {
    colors: string[];
    dominant: string;
    dark: boolean;
  };

  // ---------------------------------------------------------------------------
  // Colour maths
  // ---------------------------------------------------------------------------
  type Rgb = { r: number; g: number; b: number };

  function rgbToHex({ r, g, b }: Rgb): string {
    return (
      '#' +
      [r, g, b]
        .map((v) =>
          Math.max(0, Math.min(255, Math.round(v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  }

  function colorDistance(a: Rgb, b: Rgb): number {
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
  }

  function luminance({ r, g, b }: Rgb): number {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  /**
   * Sample the uploaded bitmap down to a tiny canvas, bucket the pixels by a
   * coarse quantisation of each channel, then hand back the most common —
   * yet visually distinct — colours. These feed the gradient / mesh / solid
   * backgrounds so the frame always harmonises with the artwork.
   */
  function extractPalette(src: string): Promise<Palette> {
    return new Promise((resolve) => {
      const fallback: Palette = {
        colors: ['#3b3a37', '#22201b', '#54514a', '#171512'],
        dominant: '#3b3a37',
        dark: true,
      };

      const img = new Image();
      img.onload = () => {
        try {
          const size = 64;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(fallback);

          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);

          const buckets = new Map<
            string,
            { count: number; r: number; g: number; b: number }
          >();

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 125) continue; // skip transparent pixels
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
            const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
            entry.count += 1;
            entry.r += r;
            entry.g += g;
            entry.b += b;
            buckets.set(key, entry);
          }

          const ranked = [...buckets.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((e) => ({
              r: e.r / e.count,
              g: e.g / e.count,
              b: e.b / e.count,
            }));

          if (ranked.length === 0) return resolve(fallback);

          // Keep colours that differ enough from ones already chosen, so a
          // gradient reads as two hues rather than two near-identical greys.
          const chosen: Rgb[] = [];
          for (const color of ranked) {
            if (chosen.every((c) => colorDistance(c, color) > 42)) {
              chosen.push(color);
            }
            if (chosen.length >= 4) break;
          }
          while (chosen.length < 4) {
            chosen.push(ranked[chosen.length % ranked.length]);
          }

          resolve({
            colors: chosen.map(rgbToHex),
            dominant: rgbToHex(chosen[0]),
            dark: luminance(chosen[0]) < 0.5,
          });
        } catch {
          resolve(fallback);
        }
      };
      img.onerror = () => resolve(fallback);
      img.src = src;
    });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let imageSrc = $state<string | null>(null);
  let imageName = $state('pamje');
  let imageVersion = $state(0); // bumps on every intake; keys the render cache
  let palette = $state<Palette | null>(null);

  let preset = $state<Preset>(presets[0]);
  let backgroundStyle = $state<BackgroundStyle>('blur');

  let padding = $state(12); // % of the shorter frame edge around the artwork
  let radius = $state(18); // px on the display frame; scales with export
  let backgroundBlur = $state(60); // px on the display frame; scales with export
  let backgroundZoom = $state(120); // % — how far the blurred copy is scaled up
  let shadow = $state(false);

  // The colour that sits *behind* the blurred copy. Left on auto it follows the
  // artwork's own palette; picked by hand it shows through as the blur fades.
  let blurColor = $state('#1a1712');
  let blurColorAuto = $state(true);
  let blurOpacity = $state(100); // % — how visible the blurred copy is

  // 100 keeps the export lossless (PNG); anything below re-encodes as JPG,
  // which is what actually makes the file small enough to post comfortably.
  let quality = $state(90);

  let showText = $state(false);
  let title = $state('');
  let handle = $state(CONFIG.social.twitter.handle);

  let dragging = $state(false);
  let exporting = $state(false);
  let extracting = $state(false);
  let copying = $state(false);
  let copied = $state(false);
  let canCopy = $state(false);

  let sizeBytes = $state<number | null>(null);
  let measuring = $state(false);

  let fileInput = $state<HTMLInputElement | null>(null);

  // Fit the preview into whatever room the stage has, keeping the preset's
  // aspect ratio. The export then scales this by exactly (preset.w / rendered).
  let stageWidth = $state(0);
  let viewportHeight = $state(900);

  const FRAME_MAX_W = 720;
  const FRAME_MAX_H = 520;
  const STAGE_CHROME = 34; // stage-inner padding + border, both sides
  // Sticky header + the offset below it, plus the caption and the action bar
  // that now sit under the frame. Keeps the whole stage inside one screenful.
  const VIEWPORT_CHROME = 260;

  const displayWidth = $derived.by(() => {
    const roomW = Math.min(
      FRAME_MAX_W,
      Math.max(240, (stageWidth || FRAME_MAX_W + STAGE_CHROME) - STAGE_CHROME),
    );
    const roomH = Math.min(
      FRAME_MAX_H,
      Math.max(240, viewportHeight - VIEWPORT_CHROME),
    );
    return Math.round(Math.min(roomW, (roomH * preset.w) / preset.h));
  });

  // One percent of the frame width, so captions keep their proportions at any
  // preview size and survive the scale-up on export.
  const frameUnit = $derived(displayWidth / 100);

  /** A tiny outline in the preset chips that mirrors the real aspect ratio. */
  function ratioGlyph(p: Preset): string {
    const box = 22;
    const w = p.w >= p.h ? box : Math.round((box * p.w) / p.h);
    const h = p.h >= p.w ? box : Math.round((box * p.h) / p.w);
    return `width: ${w}px; height: ${h}px`;
  }

  // Colours as inline custom properties consumed by the background layers.
  const paletteVars = $derived.by(() => {
    const c = palette?.colors ?? ['#2b2a27', '#1a1712', '#3a3833', '#141210'];
    return [
      `--c0: ${c[0]}`,
      `--c1: ${c[1] ?? c[0]}`,
      `--c2: ${c[2] ?? c[0]}`,
      `--c3: ${c[3] ?? c[1] ?? c[0]}`,
    ].join('; ');
  });

  const overlayDark = $derived(palette?.dark ?? true);

  const blurBackground = $derived(
    blurColorAuto
      ? (palette?.colors[1] ?? palette?.dominant ?? '#1a1712')
      : blurColor,
  );

  function pickBlurColor(color: string) {
    blurColor = color;
    blurColorAuto = false;
  }

  // ---------------------------------------------------------------------------
  // File intake
  // ---------------------------------------------------------------------------
  async function loadFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return;

    // Pasted bitmaps arrive as “image.png” and friends — not worth a filename.
    const base = file.name.replace(/\.[^.]+$/, '').trim();
    imageName = /^(image|untitled)?$/i.test(base) ? 'pamje' : base;
    blurColorAuto = true;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    imageSrc = dataUrl;
    imageVersion += 1;
    extracting = true;
    palette = await extractPalette(dataUrl);
    extracting = false;
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    void loadFile(input.files?.[0]);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    void loadFile(event.dataTransfer?.files?.[0]);
  }

  function onDragOver(event: DragEvent) {
    // Anywhere on the stage accepts a drop, so an image can be swapped for
    // another without clearing the current one first.
    if (
      !Array.from(event.dataTransfer?.items ?? []).some(
        (i) => i.kind === 'file',
      )
    )
      return;
    event.preventDefault();
    dragging = true;
  }

  /**
   * Anywhere on the page, ⌘/Ctrl+V with an image on the clipboard loads it —
   * except while the caption fields have focus, where paste means text.
   */
  function onPaste(event: ClipboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input:not([type="file"]), textarea')) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (!file) continue;
      event.preventDefault();
      void loadFile(file);
      return;
    }
  }

  function clearImage() {
    imageSrc = null;
    palette = null;
    copied = false;
    sizeBytes = null;
    frameCanvas = null;
    frameCanvasKey = '';
    if (fileInput) fileInput.value = '';
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  // Clipboard image writing is still patchy — only offer it where it exists.
  $effect(() => {
    canCopy =
      typeof ClipboardItem !== 'undefined' &&
      typeof navigator.clipboard?.write === 'function';
  });

  const lossless = $derived(quality >= 100);

  /**
   * Every input that changes what the frame looks like. Rendering the DOM to a
   * canvas is the slow half of an export, so it is cached against this key and
   * only the (cheap) encode re-runs when the quality slider moves.
   */
  const frameKey = $derived(
    [
      imageVersion,
      preset.id,
      backgroundStyle,
      padding,
      radius,
      backgroundBlur,
      backgroundZoom,
      blurBackground,
      blurOpacity,
      shadow,
      showText,
      showText ? title : '',
      showText ? handle : '',
      displayWidth,
      paletteVars,
    ].join('|'),
  );

  let frameCanvas: HTMLCanvasElement | null = null;
  let frameCanvasKey = '';

  async function renderFrameCanvas(key: string) {
    if (frameCanvas && frameCanvasKey === key) return frameCanvas;

    const node = document.getElementById('og-frame');
    if (!node) return null;

    // Render at the preview's CSS size, then let the library blow the canvas up
    // to the preset's exact pixels — scaling by a ratio instead leaves the odd
    // axis a pixel short whenever the preview width divides unevenly.
    const rect = node.getBoundingClientRect();
    const canvas = await toCanvas(node, {
      width: rect.width,
      height: rect.height,
      canvasWidth: preset.w,
      canvasHeight: preset.h,
      pixelRatio: 1,
      style: { position: 'static', transform: 'none', opacity: '1' },
    });

    frameCanvas = canvas;
    frameCanvasKey = key;
    return canvas;
  }

  function encodeFrame(
    canvas: HTMLCanvasElement,
    q: number,
  ): Promise<Blob | null> {
    return new Promise((resolve) =>
      canvas.toBlob(
        resolve,
        q >= 100 ? 'image/png' : 'image/jpeg',
        Math.min(q, 99) / 100,
      ),
    );
  }

  function formatBytes(bytes: number): string {
    return bytes < 950_000
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // The size shown next to the slider is the real encoded size, not a guess —
  // debounced so dragging a slider doesn't queue up a render per step.
  $effect(() => {
    const key = frameKey;
    const q = quality;
    const busy = exporting || copying;

    if (!imageSrc) {
      sizeBytes = null;
      measuring = false;
      return;
    }
    if (busy) return;

    let cancelled = false;
    measuring = true;

    const timer = setTimeout(async () => {
      try {
        const canvas = await renderFrameCanvas(key);
        if (cancelled || !canvas) return;
        const blob = await encodeFrame(canvas, q);
        if (!cancelled) sizeBytes = blob?.size ?? null;
      } catch {
        if (!cancelled) sizeBytes = null;
      } finally {
        if (!cancelled) measuring = false;
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  async function handleDownload() {
    if (!imageSrc) return;

    (document.activeElement as HTMLElement | null)?.blur?.();
    exporting = true;
    await tick();

    const filename =
      slugify(`${imageName} ${preset.id}`, { lower: true, strict: true }) ||
      'pamje';

    try {
      const canvas = await renderFrameCanvas(frameKey);
      const blob = canvas && (await encodeFrame(canvas, quality));
      if (!blob) return;
      sizeBytes = blob.size;
      await downloadImage(blob, filename, lossless ? 'png' : 'jpg');
    } finally {
      exporting = false;
    }
  }

  /** Same render, straight onto the clipboard — handy for a quick post. */
  async function handleCopy() {
    if (!imageSrc) return;

    (document.activeElement as HTMLElement | null)?.blur?.();
    copying = true;
    copied = false;
    await tick();

    try {
      const canvas = await renderFrameCanvas(frameKey);
      // Clipboards only take PNG dependably, so this one ignores the slider.
      const blob = canvas && (await encodeFrame(canvas, 100));
      if (!blob) throw new Error('nuk u përgatit dot pamja');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      copied = true;
      setTimeout(() => (copied = false), 2400);
    } catch {
      canCopy = false;
    } finally {
      copying = false;
    }
  }
</script>

<svelte:head>
  <title>Pamje — bëj imazhe të gatshme për rrjetet sociale | Fletoret</title>
  <link rel="canonical" href="https://fletoret.com/pamje/" />
  <meta
    name="description"
    content="Ngarko një foto dhe merre gati për rrjetet sociale: sfondi merr ngjyrat e vetë fotos, ose zgjidh vetë ngjyrën, dhe përmasat i bëjmë tamam si i duan Facebook, X, Instagram, LinkedIn, Reddit e të tjerët."
  />
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<svelte:window onpaste={onPaste} bind:innerHeight={viewportHeight} />

<Header />

<main>
  <header class="intro">
    <p class="eyebrow">Fletoret · Vegla</p>
    <h1>Pamje për rrjetet sociale</h1>
    <p class="lede">
      Ngarko një foto dhe merre gati për ta ndarë&nbsp;— me ngjyra dhe përmasa
      të optimizuara për çdo faqe.
    </p>
  </header>

  <div class="workbench">
    <!-- Preview stage -->
    <div class="stage" bind:clientWidth={stageWidth}>
      <div class="stage-inner">
        {#if imageSrc}
          <div
            id="og-frame"
            class="frame"
            class:is-exporting={exporting}
            class:dark={overlayDark}
            style="width: {displayWidth}px; aspect-ratio: {preset.w} / {preset.h}; --radius: {radius}px; --pad: {padding}%; --blur: {backgroundBlur}px; --zoom: {backgroundZoom /
              100}; --blur-bg: {blurBackground}; --blur-opacity: {blurOpacity /
              100}; {paletteVars}"
          >
            <!-- Background -->
            {#if backgroundStyle === 'blur'}
              <div class="bg-behind"></div>
              <img class="bg-blur" src={imageSrc} alt="" aria-hidden="true" />
              <div class="bg-tint"></div>
            {:else if backgroundStyle === 'gradient'}
              <div class="bg-gradient"></div>
            {:else if backgroundStyle === 'mesh'}
              <div class="bg-mesh"></div>
            {:else}
              <div class="bg-solid"></div>
            {/if}

            <!-- Soft top light so flat fills never look digital -->
            <div class="bg-sheen"></div>

            <!-- Foreground artwork -->
            <div class="art-wrap">
              <img
                class="art"
                class:shadow
                src={imageSrc}
                alt="Pamja e ngarkuar"
              />
            </div>

            <!-- Optional caption -->
            {#if showText && (title.trim() || handle.trim())}
              <div class="caption">
                {#if title.trim()}
                  <p class="caption-title">{title}</p>
                {/if}
                {#if handle.trim()}
                  <p class="caption-handle">{handle}</p>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Dropzone -->
          <button
            type="button"
            class="dropzone"
            class:dragging
            style="width: {displayWidth}px; aspect-ratio: {preset.w} / {preset.h};"
            ondragover={onDragOver}
            ondragleave={() => (dragging = false)}
            ondrop={onDrop}
            onclick={() => fileInput?.click()}
          >
            <IconPhoto size={40} stroke={1.4} />
            <p class="dz-title">Ngarko foton</p>
            <p class="dz-hint">ose kliko për ta zgjedhur nga kompjuteri</p>
            <p class="dz-paste">
              Mund ta ngjitësh edhe nga kujtesa: <kbd>⌘V</kbd> /
              <kbd>Ctrl+V</kbd>
            </p>
          </button>
        {/if}
      </div>

      <!-- Everything that goes in or comes out of the frame lives here, right
           under the preview it acts on. -->
      <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        onchange={onFileChange}
        hidden
      />

      <div class="stage-bar">
        <p class="stage-hint">
          {#if extracting}
            <IconSparkles size={14} /> Po i lexoj ngjyrat…
          {:else}
            {preset.name} · {preset.w}×{preset.h}px
            {#if imageSrc}
              <!-- Kept on screen while a new measurement runs, only dimmed, so
                   the line doesn't jump every time a slider moves. -->
              <span class="size" class:stale={measuring}>
                · {lossless ? 'PNG' : 'JPG'}
                {sizeBytes ? formatBytes(sizeBytes) : ''}
              </span>
            {/if}
          {/if}
        </p>

        <div class="stage-actions">
          <button
            type="button"
            class="btn upload"
            onclick={() => fileInput?.click()}
          >
            <IconUpload size={18} />
            {imageSrc ? 'Ndryshoje foton' : 'Ngarko foton'}
          </button>

          {#if canCopy}
            <button
              type="button"
              class="btn"
              onclick={handleCopy}
              disabled={!imageSrc || copying}
            >
              {#if copied}
                <IconCheck size={18} /> U kopjua
              {:else}
                <IconCopy size={18} />
                {copying ? 'Po e kopjoj…' : 'Kopjoje'}
              {/if}
            </button>
          {/if}

          <button
            type="button"
            class="btn download"
            onclick={handleDownload}
            disabled={!imageSrc || exporting}
          >
            <IconDownload size={20} />
            {exporting
              ? 'Po e ruaj…'
              : `Shkarkoje si ${lossless ? 'PNG' : 'JPG'}`}
          </button>

          {#if imageSrc}
            <button type="button" class="ghost" onclick={clearImage}>
              <IconX size={16} /> Hiqe
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div class="editor">
      <div class="section">
        <div class="heading">Ku do ta ndash</div>
        <div class="chips">
          {#each presets as option (option.id)}
            <button
              type="button"
              class="chip"
              class:active={preset.id === option.id}
              onclick={() => (preset = option)}
            >
              <span class="chip-name">{option.name}</span>
              <span class="chip-hint">{option.hint}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="section">
        <div class="heading">Si t’i dalë sfondi</div>
        <div class="chips tight">
          {#each backgroundStyles as option (option.id)}
            <button
              type="button"
              class="chip pill"
              class:active={backgroundStyle === option.id}
              onclick={() => (backgroundStyle = option.id)}
            >
              {option.name}
            </button>
          {/each}
        </div>
        {#if palette && backgroundStyle !== 'blur'}
          <div class="swatches" aria-label="Ngjyrat e marra nga fotoja">
            {#each palette.colors as color (color)}
              <span class="swatch" style="background: {color}" title={color}
              ></span>
            {/each}
          </div>
        {/if}
      </div>

      {#if backgroundStyle === 'blur'}
        <div class="section">
          <div class="row-between">
            <div class="heading">Ngjyra pas turbullimit</div>
            {#if !blurColorAuto}
              <button
                type="button"
                class="ghost"
                onclick={() => (blurColorAuto = true)}
              >
                <IconSparkles size={16} /> Nga fotoja
              </button>
            {/if}
          </div>

          <div class="color-row">
            <label class="color-pick">
              <input
                type="color"
                value={blurBackground}
                oninput={(event) => pickBlurColor(event.currentTarget.value)}
              />
              <span>Zgjidhe vetë</span>
            </label>
            {#if palette}
              <div class="swatches">
                {#each palette.colors as color (color)}
                  <button
                    type="button"
                    class="swatch pickable"
                    class:active={!blurColorAuto && blurColor === color}
                    style="background: {color}"
                    title={color}
                    aria-label="Ngjyra {color}"
                    onclick={() => pickBlurColor(color)}
                  ></button>
                {/each}
              </div>
            {/if}
          </div>

          <p class="micro">
            {blurColorAuto
              ? 'Ngjyrën po e merr vetë nga fotoja. Po të duash, zgjidh një tjetër më sipër.'
              : 'Ule "Dukshmërinë e sfondit" më poshtë dhe ngjyra do të duket më shumë.'}
          </p>
        </div>
      {/if}

      <div class="section">
        <div class="heading">Rregulloje</div>
        <div class="sliders">
          <label class="slider-item">
            <span>Hapësira anash <b>{padding}%</b></span>
            <input
              type="range"
              min="0"
              max="28"
              step="1"
              bind:value={padding}
            />
          </label>
          <label class="slider-item">
            <span>Qoshe të rrumbullakosura <b>{radius}px</b></span>
            <input type="range" min="0" max="48" step="1" bind:value={radius} />
          </label>
          {#if backgroundStyle === 'blur'}
            <label class="slider-item">
              <span>Sa turbull <b>{backgroundBlur}px</b></span>
              <input
                type="range"
                min="0"
                max="120"
                step="2"
                bind:value={backgroundBlur}
              />
            </label>
            <label class="slider-item">
              <span>Sa i zmadhuar sfondi <b>{backgroundZoom}%</b></span>
              <input
                type="range"
                min="100"
                max="200"
                step="5"
                bind:value={backgroundZoom}
              />
            </label>
            <label class="slider-item">
              <span>Dukshmëria e sfondit <b>{blurOpacity}%</b></span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                bind:value={blurOpacity}
              />
            </label>
          {/if}
        </div>
        <label class="toggle">
          <input type="checkbox" bind:checked={shadow} />
          <span>Hije nën foto</span>
        </label>
      </div>

      <div class="section">
        <label class="toggle">
          <input type="checkbox" bind:checked={showText} />
          <span>Shto tekst mbi pamje</span>
        </label>
        {#if showText}
          <div class="text-fields">
            <input
              type="text"
              class="text-input"
              placeholder="Titulli"
              bind:value={title}
            />
            <input
              type="text"
              class="text-input"
              placeholder="@emri_yt"
              bind:value={handle}
            />
          </div>
        {/if}
      </div>

      <div class="section">
        <div class="heading">Cilësia e imazhit</div>
        <div class="sliders">
          <label class="slider-item">
            <span>
              Cilësia <b>{quality}%</b>
              {#if imageSrc}
                <span class="size">
                  {#if measuring}
                    · po e mas…
                  {:else if sizeBytes}
                    · <b>{formatBytes(sizeBytes)}</b>
                  {/if}
                </span>
              {/if}
            </span>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              bind:value={quality}
            />
          </label>
        </div>
        <p class="micro">
          {lossless
            ? 'Në 100% del PNG — pa asnjë humbje, por i rëndë. Ule pak dhe bëhet JPG shumë më i lehtë.'
            : 'Nën 100% del JPG. Sa më poshtë, aq më e lehtë foto — dhe aq më shumë humbet nga cilësia.'}
        </p>
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--spacing-2xxl) var(--spacing-xxl) var(--spacing-3xxl);
  }

  .intro {
    max-width: 42rem;
    margin-bottom: var(--spacing-2xxl);

    h1 {
      font-family: var(--serif-display);
      font-size: clamp(2.4rem, 1.8rem + 2.6vw, 3.4rem);
      line-height: 1.02;
      letter-spacing: -0.02em;
      margin: 0 0 var(--spacing-lg);
      text-wrap: balance;
    }

    .lede {
      font-family: var(--serif);
      font-size: var(--text-lg);
      line-height: 1.55;
      color: var(--text-secondary);
      margin: 0;
      max-width: 34rem;
      text-wrap: pretty;
    }
  }

  .eyebrow {
    font-family: var(--sans-serif);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--link-primary);
    margin: 0 0 var(--spacing-md);
  }

  .workbench {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: var(--spacing-2xxl);
    align-items: start;
  }

  /* -------------------------------------------------------------- Stage --- */
  .stage {
    /* The site header is sticky too, so the stage has to park below it —
       otherwise scrolling slides the preview under the header bar. */
    --header-h: 68px;
    position: sticky;
    top: calc(var(--header-h) + var(--spacing-xl));
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    min-width: 0;
  }

  .stage-inner {
    display: flex;
    justify-content: center;
    padding: var(--spacing-xl);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    min-height: 300px;
    align-items: center;
    /* A quiet checkerboard so transparent PNGs read clearly. */
    background-image:
      linear-gradient(
        45deg,
        color-mix(in srgb, var(--border-color) 55%, transparent) 25%,
        transparent 25%
      ),
      linear-gradient(
        -45deg,
        color-mix(in srgb, var(--border-color) 55%, transparent) 25%,
        transparent 25%
      ),
      linear-gradient(
        45deg,
        transparent 75%,
        color-mix(in srgb, var(--border-color) 55%, transparent) 75%
      ),
      linear-gradient(
        -45deg,
        transparent 75%,
        color-mix(in srgb, var(--border-color) 55%, transparent) 75%
      );
    background-size: 20px 20px;
    background-position:
      0 0,
      0 10px,
      10px -10px,
      -10px 0;
  }

  .stage-bar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .stage-hint {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);

    .size {
      transition: opacity 0.15s ease;
    }

    .size.stale {
      opacity: 0.45;
    }
  }

  .stage-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);

    .btn.download {
      /* The one thing the page is for — let it take the room that is left. */
      flex: 1 1 auto;
      min-width: 14rem;
    }
  }

  /* --------------------------------------------------------- The frame --- */
  .frame {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    max-width: 100%;
    background: var(--c1, #1a1712);

    .bg-behind {
      position: absolute;
      inset: 0;
      background: var(--blur-bg, #1a1712);
      pointer-events: none;
    }

    .bg-blur {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(var(--blur)) saturate(1.35);
      transform: scale(var(--zoom));
      opacity: var(--blur-opacity, 1);
      pointer-events: none;
    }

    .bg-tint {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        120% 120% at 50% 40%,
        transparent 40%,
        rgba(0, 0, 0, 0.22) 100%
      );
      pointer-events: none;
    }

    .bg-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        145deg,
        var(--c0) 0%,
        var(--c1) 55%,
        var(--c3) 100%
      );
      pointer-events: none;
    }

    .bg-mesh {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(60% 70% at 12% 18%, var(--c0) 0%, transparent 60%),
        radial-gradient(55% 65% at 88% 10%, var(--c2) 0%, transparent 58%),
        radial-gradient(65% 75% at 82% 88%, var(--c3) 0%, transparent 60%),
        radial-gradient(70% 80% at 18% 92%, var(--c0) 0%, transparent 62%),
        var(--c1);
      pointer-events: none;
    }

    .bg-solid {
      position: absolute;
      inset: 0;
      background: var(--c0);
      pointer-events: none;
    }

    .bg-sheen {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        90% 55% at 50% -10%,
        rgba(255, 255, 255, 0.16) 0%,
        transparent 65%
      );
      pointer-events: none;
    }

    .art-wrap {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--pad);
    }

    .art {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: var(--radius);
    }

    .art.shadow {
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.18),
        0 24px 60px rgba(0, 0, 0, 0.42);
    }

    .caption {
      position: absolute;
      left: 6%;
      bottom: 6%;
      right: 6%;
      z-index: 2;
      color: #fff;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
    }

    &:not(.dark) .caption {
      color: #14100b;
      text-shadow: 0 1px 12px rgba(255, 255, 255, 0.55);
    }

    .caption-title {
      margin: 0;
      font-family: var(--serif-display);
      font-size: 2rem;
      line-height: 1.05;
      letter-spacing: -0.02em;
      text-wrap: balance;
    }

    .caption-handle {
      margin: 0.3em 0 0;
      font-family: var(--sans-serif);
      font-size: 0.95rem;
      font-weight: 500;
      opacity: 0.85;
    }
  }

  /* ---------------------------------------------------------- Dropzone --- */
  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    max-width: 100%;
    padding: var(--spacing-xl);
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
      background 0.15s ease;

    &:hover,
    &.dragging {
      border-color: var(--link-primary);
      color: var(--text-primary);
      background: var(--bg-secondary);
    }

    .dz-title {
      margin: 0;
      font-family: var(--sans-serif);
      font-weight: 600;
      color: var(--text-primary);
    }

    .dz-hint {
      margin: 0;
      font-family: var(--sans-serif);
      font-size: var(--text-sm);
    }

    .dz-paste {
      margin: var(--spacing-sm) 0 0;
      font-family: var(--sans-serif);
      font-size: var(--text-sm);
      opacity: 0.75;

      kbd {
        font-family: var(--mono-font, monospace);
        font-size: 0.85em;
        padding: 1px 5px;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        background: var(--bg-secondary);
      }
    }
  }

  /* ----------------------------------------------------------- Editor --- */
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxl);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* A hairline instead of a wide gap keeps the sections apart now that the
     headings no longer shout in letter-spaced capitals. */
  .section + .section {
    padding-top: var(--spacing-xxl);
    border-top: 1px solid
      color-mix(in srgb, var(--border-color) 70%, transparent);
  }

  .heading {
    font-family: var(--sans-serif-display);
    font-size: var(--text-md);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .row-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    font-family: var(--sans-serif);
    font-weight: 600;
    font-size: var(--text-md);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .btn:hover:not(:disabled) {
    border-color: var(--link-primary);
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn.download {
    background: var(--link-primary);
    border-color: var(--link-primary);
    color: #fff;

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      border-color: var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }
  }

  .ghost {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    background: none;
    border: none;
    cursor: pointer;
  }

  .ghost:hover {
    color: var(--link-primary);
  }

  .micro {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .swatches {
    display: flex;
    gap: var(--spacing-md);
  }

  .color-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .color-pick {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    font-family: var(--sans-serif);
    font-size: 0.85rem;
    color: var(--text-secondary);

    input[type='color'] {
      inline-size: 34px;
      block-size: 34px;
      padding: 0;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: none;
      cursor: pointer;

      &::-webkit-color-swatch-wrapper {
        padding: 2px;
      }

      &::-webkit-color-swatch {
        border: none;
        border-radius: 6px;
      }
    }
  }

  .swatch {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .swatch.pickable {
    cursor: pointer;
    padding: 0;

    &:hover {
      transform: translateY(-1px);
    }

    &.active {
      outline: 2px solid var(--text-primary);
      outline-offset: 2px;
    }
  }

  .chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);

    &.tight {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .chip {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    cursor: pointer;
    text-align: left;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;

    &:hover {
      border-color: color-mix(
        in srgb,
        var(--link-primary) 60%,
        var(--border-color)
      );
    }

    &.active {
      border-color: var(--link-primary);
      background: var(--bg-secondary);
    }

    &.pill {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      font-family: var(--sans-serif);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }
  }

  .chip-name {
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .chip-hint {
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .slider-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);

    span {
      font-family: var(--sans-serif);
      font-size: var(--text-sm);
      color: var(--text-secondary);

      b {
        color: var(--text-primary);
        font-weight: 600;
      }
    }

    /* Held in its own span so the number can settle without nudging the
       label around while a measurement is in flight. */
    .size {
      display: inline-block;
      min-width: 6.5em;
    }

    input[type='range'] {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      border-radius: var(--radius-full);
      background: var(--border-color);
      cursor: pointer;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: var(--radius-full);
        background: var(--link-primary);
        border: none;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: var(--radius-full);
        background: var(--link-primary);
        border: none;
        cursor: pointer;
      }
    }
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    color: var(--text-primary);
    cursor: pointer;

    input {
      width: 16px;
      height: 16px;
      accent-color: var(--link-primary);
      cursor: pointer;
    }
  }

  .text-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .text-input {
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);

    &:focus {
      outline: none;
      border-color: var(--link-primary);
    }
  }

  /* ------------------------------------------------------ Responsive --- */
  @media (max-width: 900px) {
    .workbench {
      /* minmax(0, …), not 1fr: an auto min track lets the frame push the
         column wider than the screen, and the measured width feeds back in. */
      grid-template-columns: minmax(0, 1fr);
      gap: var(--spacing-2xxl);
    }

    .stage {
      position: static;
    }

    .stage-actions .btn.download {
      min-width: 0;
      width: 100%;
    }
  }

  @media (max-width: 600px) {
    main {
      padding: var(--spacing-xl) var(--spacing-xxl) var(--spacing-2xxl);
    }
  }
</style>
