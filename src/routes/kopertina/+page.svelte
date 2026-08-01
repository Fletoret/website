<script lang="ts">
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';

  import { tick } from 'svelte';
  import slugify from 'slugify';
  import { IconDownload } from '@tabler/icons-svelte';

  import { domToImage } from '$lib/utils';

  import Header from '$lib/components/Header.svelte';

  type Palette = {
    id: string;
    name: string;
    bgColor: string;
    bgColor0: string;
    textColorPrimary: string;
  };

  type FontOption = {
    id: string;
    name: string;
    /** Face used for the title and the author line. */
    display: string;
    /** Text face used for the subtitle and the imprint. */
    body: string;
    titleWeight: number;
    titleTracking: string;
    /** True for faces that already render lowercase as small caps. */
    smallCaps: boolean;
  };

  const themes = [
    { id: 'modern', name: 'Moderne' },
    { id: 'vintage', name: 'Vintage' },
  ];

  const palettes: Palette[] = [
    {
      id: 'classic',
      name: 'Lokja',
      bgColor: '#4a2429',
      bgColor0: '#2a1416',
      textColorPrimary: '#f5b942',
    },
    {
      id: 'light',
      name: 'Drita',
      bgColor: '#f8e3d0',
      bgColor0: '#d8bdb6',
      textColorPrimary: '#6d5a52',
    },
    {
      id: 'green',
      name: 'Liria',
      bgColor: '#405e47',
      bgColor0: '#18231c',
      textColorPrimary: '#d8d47a',
    },
    {
      id: 'coral',
      name: 'Flaka',
      bgColor: '#7a1d1d',
      bgColor0: '#3c1212',
      textColorPrimary: '#e8c86a',
    },
    {
      id: 'sepia',
      name: 'Sepia',
      bgColor: '#ece0c8',
      bgColor0: '#bfa987',
      textColorPrimary: '#3d2817',
    },
    {
      id: 'parchment',
      name: 'Pergamena',
      bgColor: '#f6edda',
      bgColor0: '#d3c4a2',
      textColorPrimary: '#5c4a2f',
    },
    {
      id: 'oldBook',
      name: 'Libër i Vjetër',
      bgColor: '#907a5c',
      bgColor0: '#4f3f2f',
      textColorPrimary: '#f7ead8',
    },
    {
      id: 'burgundy',
      name: 'Vjollcë',
      bgColor: '#5c1a1a',
      bgColor0: '#2c0d0d',
      textColorPrimary: '#d4af37',
    },
    {
      id: 'ink',
      name: 'Bojë',
      bgColor: '#243044',
      bgColor0: '#111823',
      textColorPrimary: '#e3ddcd',
    },
    {
      id: 'linen',
      name: 'Lini',
      bgColor: '#fbf7ef',
      bgColor0: '#e2dacb',
      textColorPrimary: '#26221c',
    },
  ];

  const fonts: FontOption[] = [
    {
      id: 'instrumentSerif',
      name: 'Instrument Serif',
      display: '--serif-display',
      body: '--serif',
      titleWeight: 400,
      titleTracking: '-0.015em',
      smallCaps: false,
    },
    {
      id: 'sourceSerif',
      name: 'Source Serif 4',
      display: '--serif',
      body: '--serif',
      titleWeight: 600,
      titleTracking: '-0.01em',
      smallCaps: false,
    },
    {
      id: 'crimsonText',
      name: 'Crimson Text',
      display: '--crimson-text',
      body: '--crimson-text',
      titleWeight: 600,
      titleTracking: '0em',
      smallCaps: false,
    },
    {
      id: 'alegreyaSC',
      name: 'Alegreya SC',
      display: '--alegreya-sc',
      body: '--crimson-text',
      titleWeight: 500,
      titleTracking: '0.02em',
      smallCaps: true,
    },
    {
      id: 'imFellEnglishSC',
      name: 'IM Fell English SC',
      display: '--im-fell-english-sc',
      body: '--crimson-text',
      titleWeight: 400,
      titleTracking: '0.02em',
      smallCaps: true,
    },
    {
      id: 'charter',
      name: 'Charter',
      display: '--charter',
      body: '--charter',
      titleWeight: 600,
      titleTracking: '-0.005em',
      smallCaps: false,
    },
    {
      id: 'inter',
      name: 'Inter',
      display: '--inter',
      body: '--inter',
      titleWeight: 600,
      titleTracking: '-0.025em',
      smallCaps: false,
    },
  ];

  /** Appends an alpha channel to a `#rrggbb` value. */
  function withAlpha(hex: string, alpha: number): string {
    const channel = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
    return hex + channel.toString(16).padStart(2, '0');
  }

  /** Relative luminance, used to decide whether a palette reads as dark stock. */
  function isDarkColor(hex: string): boolean {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
  }

  let bookTitle = $state('Titulli i librit');
  let bookSubtitle = $state('Një nëntitull ndoshta pak më përshkrues.');
  let author = $state('Autori');

  let theme = $state('modern');
  let palette = $state(palettes[0]);
  let font = $state(fonts[0]);
  let exporting = $state(false);

  // Font size controls (in rem)
  let titleFontSize = $state(4);
  let subtitleFontSize = $state(0.95);
  let authorFontSize = $state(1.05);

  const dark = $derived(isDarkColor(palette.bgColor0));

  const coverStyle = $derived(
    [
      `--bg: ${palette.bgColor}`,
      `--bg-0: ${palette.bgColor0}`,
      `--ink: ${palette.textColorPrimary}`,
      `--ink-80: ${withAlpha(palette.textColorPrimary, 0.8)}`,
      `--ink-55: ${withAlpha(palette.textColorPrimary, 0.55)}`,
      `--ink-35: ${withAlpha(palette.textColorPrimary, 0.35)}`,
      `--ink-20: ${withAlpha(palette.textColorPrimary, 0.2)}`,
      // Light stock catches a warm highlight, dark stock a cool one.
      `--sheen: ${dark ? 'rgba(255, 246, 230, 0.09)' : 'rgba(255, 255, 255, 0.55)'}`,
      `--shade: ${dark ? 'rgba(0, 0, 0, 0.26)' : 'rgba(86, 66, 44, 0.16)'}`,
      `--grain-opacity: ${dark ? 0.18 : 0.3}`,
      `--display-font: var(${font.display})`,
      `--body-font: var(${font.body})`,
      `--title-weight: ${font.titleWeight}`,
      `--title-tracking: ${font.titleTracking}`,
      // Small-cap faces already carry the effect; forcing caps would flatten them.
      `--caps: ${font.smallCaps ? 'none' : 'uppercase'}`,
      `--title-size: ${titleFontSize}rem`,
      `--subtitle-size: ${subtitleFontSize}rem`,
      `--author-size: ${authorFontSize}rem`,
    ].join('; '),
  );

  async function handleImgSave() {
    const node = document.getElementById('book-cover');
    if (!node) return;

    // Drop the caret and the editing affordances so they stay out of the PNG.
    (document.activeElement as HTMLElement | null)?.blur?.();
    exporting = true;
    await tick();

    const filename =
      slugify(`${bookTitle} ${author}`, { lower: true, strict: true }) ||
      'kopertina';

    try {
      await domToImage(node, filename, { pixelRatio: 3 });
    } finally {
      exporting = false;
    }
  }
</script>

{#snippet ornament()}
  <svg
    class="ornament"
    viewBox="0 0 240 14"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Rules and lozenges echoing the geometry of Albanian textile borders. -->
    <line x1="4" y1="7" x2="92" y2="7" stroke="currentColor" stroke-width="1" />
    <path d="M100 3 L104 7 L100 11 L96 7 Z" fill="currentColor" />
    <path
      d="M120 0.5 L126.5 7 L120 13.5 L113.5 7 Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
    />
    <circle cx="120" cy="7" r="1.6" fill="currentColor" />
    <path d="M140 3 L144 7 L140 11 L136 7 Z" fill="currentColor" />
    <line
      x1="148"
      y1="7"
      x2="236"
      y2="7"
      stroke="currentColor"
      stroke-width="1"
    />
  </svg>
{/snippet}

<svelte:head>
  <title>Krijo kopertina — gjenerator kopertinash | Fletoret</title>
  <link rel="canonical" href="https://fletoret.com/kopertina/" />
  <meta
    name="description"
    content="Krijo kopertina librash për veprat letrare shqipe me gjeneratorin e Fletoret."
  />
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<Header />

<main>
  <div class="cover-stage">
    <div
      id="book-cover"
      class="cover"
      class:vintage-theme={theme === 'vintage'}
      class:modern-theme={theme !== 'vintage'}
      class:is-exporting={exporting}
      style={coverStyle}
    >
      <div class="layer bg"></div>
      <div class="layer sheen"></div>
      <div class="layer vignette"></div>
      <svg class="layer grain" preserveAspectRatio="none" aria-hidden="true">
        <filter id="cover-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cover-grain)" />
      </svg>

      {#if theme === 'vintage'}
        <div class="frame frame-outer"></div>
        <div class="frame frame-inner"></div>

        <div class="content vintage">
          <div class="v-head">
            {@render ornament()}
            <div
              class="author"
              data-placeholder="Autori"
              bind:innerText={author}
              contenteditable
            ></div>
          </div>

          <div class="v-middle">
            <div
              class="title"
              data-placeholder="Titulli"
              bind:innerText={bookTitle}
              contenteditable
            ></div>
            <div class="rule"></div>
            <div
              class="subtitle"
              data-placeholder="Nëntitulli"
              bind:innerText={bookSubtitle}
              contenteditable
            ></div>
          </div>

          <div class="v-foot">
            {@render ornament()}
            <div class="imprint">Fletoret</div>
          </div>
        </div>
      {:else}
        <div class="content modern">
          <div class="m-main">
            <div
              class="title"
              data-placeholder="Titulli"
              bind:innerText={bookTitle}
              contenteditable
            ></div>
            <div class="rule"></div>
            <div
              class="subtitle"
              data-placeholder="Nëntitulli"
              bind:innerText={bookSubtitle}
              contenteditable
            ></div>
            <div
              class="author"
              data-placeholder="Autori"
              bind:innerText={author}
              contenteditable
            ></div>
          </div>

          <div class="m-foot">
            <div class="hairline"></div>
            <div class="imprint">Fletoret</div>
          </div>
        </div>
      {/if}
    </div>

    <p class="stage-hint">Kliko mbi tekstin e kopertinës për ta ndryshuar.</p>
  </div>

  <div class="editor">
    <div class="section">
      <div class="heading">Tema</div>
      <div class="flex-row">
        {#each themes as themeOption (themeOption.id)}
          <button
            class="theme-btn"
            class:active={theme === themeOption.id}
            onclick={() => {
              theme = themeOption.id;
            }}
          >
            {themeOption.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="section">
      <div class="heading">Ngjyra</div>
      <div class="flex-row">
        {#each palettes as definition (definition.id)}
          <button
            class="palette"
            class:active={palette.id === definition.id}
            style="background: linear-gradient(170deg, {definition.bgColor}, {definition.bgColor0}); color: {definition.textColorPrimary}"
            onclick={() => {
              palette = definition;
            }}
          >
            {definition.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="section-row">
      <div class="section">
        <div class="heading">Tipografia</div>
        <div class="flex-column">
          {#each fonts as definition (definition.id)}
            <button
              class="btn font"
              class:active={font.id === definition.id}
              style="font-family: var({definition.display});"
              onclick={() => {
                font = definition;
              }}
            >
              {definition.name}
            </button>
          {/each}
        </div>
      </div>

      <div class="section">
        <div class="heading">Madhësia e Shkronjave</div>
        <div class="flex-column slider-group">
          <div class="slider-item">
            <label for="title-size"
              >Titulli: {titleFontSize.toFixed(2)}rem</label
            >
            <input
              id="title-size"
              type="range"
              min="1"
              max="6"
              step="0.05"
              bind:value={titleFontSize}
              class="slider"
            />
          </div>
          <div class="slider-item">
            <label for="subtitle-size"
              >Nëntitulli: {subtitleFontSize.toFixed(2)}rem</label
            >
            <input
              id="subtitle-size"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              bind:value={subtitleFontSize}
              class="slider"
            />
          </div>
          <div class="slider-item">
            <label for="author-size"
              >Autori: {authorFontSize.toFixed(2)}rem</label
            >
            <input
              id="author-size"
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              bind:value={authorFontSize}
              class="slider"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="btn download" onclick={handleImgSave} disabled={exporting}>
      <IconDownload size={20} />
      {exporting ? 'Duke ruajtur…' : 'Shkarko kopertinën'}
    </button>
  </div>
</main>

<style lang="scss">
  main {
    width: min(1400px, 100%);
    padding: 2rem 1rem;
    display: flex;
    gap: 3rem;
    margin: auto;
  }

  .btn {
    border: solid 2px transparent;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  .btn:hover {
    border: solid 2px var(--border-color);
  }

  .cover-stage {
    position: sticky;
    top: 2rem;
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);

    .stage-hint {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-align: center;
    }
  }

  /* Standard 6×9 inch trade paperback proportion (2:3). */
  .cover {
    position: relative;
    isolation: isolate;
    width: 500px;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    font-kerning: normal;
    font-feature-settings:
      'kern' 1,
      'liga' 1,
      'calt' 1;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;

    .layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .bg {
      background: linear-gradient(170deg, var(--bg) 0%, var(--bg-0) 100%);
    }

    /* A soft light source at the top keeps the flat gradient from looking digital. */
    .sheen {
      background: radial-gradient(
        95% 55% at 50% -8%,
        var(--sheen) 0%,
        transparent 70%
      );
    }

    .vignette {
      background: radial-gradient(
        118% 100% at 50% 45%,
        transparent 55%,
        var(--shade) 100%
      );
    }

    /* Paper tooth. Inline SVG (rather than a CSS data URI) so html-to-image
       clones it verbatim and the grain survives the PNG export. */
    .grain {
      opacity: var(--grain-opacity);
      mix-blend-mode: overlay;
    }

    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      text-align: center;
      color: var(--ink);
    }

    [contenteditable] {
      outline: none;
      caret-color: var(--ink);
      border-radius: 2px;
      overflow-wrap: break-word;
    }

    [contenteditable]:empty::before {
      content: attr(data-placeholder);
      opacity: 0.3;
    }

    &:not(.is-exporting) [contenteditable]:hover,
    &:not(.is-exporting) [contenteditable]:focus {
      box-shadow: 0 0 0 1px var(--ink-20);
    }

    .title {
      font-family: var(--display-font);
      font-size: var(--title-size);
      font-weight: var(--title-weight);
      letter-spacing: var(--title-tracking);
      line-height: 1.08;
      text-wrap: balance;
    }

    .subtitle {
      font-family: var(--body-font);
      font-size: var(--subtitle-size);
      line-height: 1.5;
      color: var(--ink-80);
      text-wrap: balance;
    }

    .author {
      font-family: var(--display-font);
      font-size: var(--author-size);
      font-weight: 400;
      text-transform: var(--caps);
      letter-spacing: 0.16em;
      line-height: 1.3;
    }

    .imprint {
      font-family: var(--body-font);
      font-size: 0.7rem;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: var(--ink-55);
    }

    /* ── Modern ─────────────────────────────────────────────── */
    &.modern-theme .content {
      display: grid;
      grid-template-rows: 1fr auto;
      padding: 3.5rem 3rem 2.75rem;
    }

    /* Title, subtitle and author travel together as one centred block. */
    .m-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.15rem;
      /* The imprint at the foot adds weight below, so a dead-centre stack
         reads as slightly low; lift it towards the optical centre. */
      padding-bottom: 2.5rem;

      .rule {
        width: 3rem;
        height: 2px;
        background: var(--ink-35);
      }

      .subtitle {
        max-width: 88%;
      }

      /* Held further off than the internal gaps so the group reads as
         "work, then author" rather than three evenly spaced lines. */
      .author {
        margin-top: 2.25rem;
      }
    }

    .m-foot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      .hairline {
        width: 100%;
        height: 1px;
        background: var(--ink-20);
      }
    }

    /* ── Vintage ────────────────────────────────────────────── */
    .frame {
      position: absolute;
      z-index: 1;
      pointer-events: none;
    }

    .frame-outer {
      inset: 16px;
      border: 2px solid var(--ink-35);
    }

    .frame-inner {
      inset: 24px;
      border: 1px solid var(--ink-20);
    }

    &.vintage-theme .content {
      justify-content: space-between;
      padding: 3.25rem 3rem;
    }

    .ornament {
      width: 100%;
      height: 14px;
      color: var(--ink-55);
      display: block;
    }

    .v-head {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .v-middle {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.25rem;

      .title {
        text-transform: var(--caps);
        line-height: 1.14;
      }

      .rule {
        width: 2.5rem;
        height: 1px;
        margin: 0.25rem auto;
        background: var(--ink-35);
      }

      .subtitle {
        font-style: italic;
        max-width: 85%;
        margin: 0 auto;
      }
    }

    .v-foot {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
  }

  .editor {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xxl);

    .download {
      width: fit-content;
      cursor: pointer;
      padding: var(--spacing-lg) var(--spacing-xxl);
      border-radius: var(--radius-lg);
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      color: var(--text-primary);
      font-size: var(--text-md);

      &:disabled {
        opacity: 0.6;
        cursor: progress;
      }
    }

    .section-row {
      display: flex;
      flex-direction: row;
      gap: 4rem;
      align-items: flex-start;

      .section {
        flex: 1;
        min-width: 0;
      }

      /* The sliders are visually light next to the solid font buttons, so they
         need more than the gap alone to stop reading as the same column. */
      .section + .section {
        padding-left: 4rem;
        border-left: 1px solid var(--border-color);
      }
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);

      .heading {
        font-size: var(--text-md);
        color: var(--text-secondary);
      }

      .flex-row {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        flex-wrap: wrap;

        .palette {
          cursor: pointer;
          padding: 0.9rem 1.75rem;
          border-radius: var(--radius-xl);
          border: 2px solid transparent;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
          transition: transform 0.15s ease;

          &:hover {
            transform: translateY(-2px);
          }

          &.active {
            border-color: var(--link-primary);
            box-shadow:
              inset 0 0 0 1px rgba(0, 0, 0, 0.08),
              0 0 0 2px var(--bg-primary);
          }
        }

        .theme-btn {
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          color: var(--text-primary);
          font-size: var(--text-md);
          transition: all 0.2s ease;

          &:hover {
            background: var(--bg-primary);
            border-color: var(--text-secondary);
          }

          &.active {
            background: var(--link-primary);
            color: var(--bg-primary);
            border-color: var(--link-primary);
          }
        }
      }

      .flex-column {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .font {
          background: none;
          border: solid 2px var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-lg);
          width: 100%;
          padding: var(--spacing-lg) var(--spacing-xl);
          cursor: pointer;
        }

        .font:hover {
          background-color: var(--bg-secondary);
        }

        .font.active {
          border-color: var(--link-primary);
        }

        &.slider-group {
          gap: 1.5rem;
        }
      }

      .slider-item {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;

        label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .slider {
          width: 100%;
          max-width: 22rem;
          height: 6px;
          border-radius: 5px;
          /* --bg-secondary is a near-white on a near-white page, so the track
             was effectively invisible. */
          background: color-mix(
            in srgb,
            var(--text-secondary) 28%,
            transparent
          );
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;

          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--link-primary);
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              transform: scale(1.2);
            }
          }

          &::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--link-primary);
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;

            &:hover {
              transform: scale(1.2);
            }
          }

          &::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 5px;
            background: transparent;
          }

          &::-moz-range-track {
            height: 6px;
            border-radius: 5px;
            background: transparent;
          }
        }
      }
    }
  }

  @media (max-width: 1100px) {
    main {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .cover-stage {
      position: static;
      max-width: 100%;
    }

    .editor {
      width: min(500px, 100%);
    }

    .editor .section-row {
      flex-direction: column;
      gap: var(--spacing-2xxl);
    }

    .editor .section-row .section {
      width: 100%;
    }

    /* Stacked, the vertical divider makes no sense. */
    .editor .section-row .section + .section {
      padding-left: 0;
      border-left: none;
    }
  }

  @media (max-width: 540px) {
    /* The cover keeps its fixed 500×750 pixel size so the exported PNG is always
       identical; on narrow screens the stage scrolls instead of scaling, since a
       CSS transform would also shrink the measured export dimensions. */
    .cover-stage {
      max-width: 100%;
      overflow-x: auto;
    }
  }
</style>
