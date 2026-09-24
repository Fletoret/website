<script lang="ts">
  import '$lib/css/app.css';

  import { IconCheck, IconCopy, IconDownload } from '@tabler/icons-svelte';

  import CONFIG from '$lib/config';
  import { downloadImage } from '$lib/utils';

  let { data } = $props();

  const image = $derived(data.image);
  const book = $derived(data.book);
  const author = $derived(data.author);

  const pageUrl = $derived(`${CONFIG.info.base_url}/${book.folder}/og-image/`);
  const imageUrl = $derived(`${CONFIG.info.base_url}${image.image}`);
  const filename = $derived(book.folder.replace('/', '-'));

  /** "141 vjersha · 12.853 fjalë të transkriptuara", grouped the Albanian way. */
  const sq = (n: number) => n.toLocaleString('de-DE');
  const summary = $derived(
    `${sq(image.unitCount)} ${image.unit} · ${sq(image.words)} fjalë të transkriptuara`,
  );

  let copied = $state(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(imageUrl);
      copied = true;
      setTimeout(() => (copied = false), 2400);
    } catch {
      copied = false;
    }
  }
</script>

<svelte:head>
  <title>Pamje për ndarje: {book.name}, {author.name} | {CONFIG.info.title}</title>
  <link rel="canonical" href={pageUrl} />
  <meta name="description" content={image.alt} />
  <!-- A utility page, kept out of the index the way /social-images is; the
       unfurl below works regardless. -->
  <meta name="robots" content="noindex, follow" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:title" content="{book.name}, {author.name}" />
  <meta property="og:description" content={image.alt} />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:width" content={String(image.width)} />
  <meta property="og:image:height" content={String(image.height)} />
  <meta property="og:image:alt" content={image.alt} />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content={CONFIG.social.twitter.handle} />
  <meta name="twitter:title" content="{book.name}, {author.name}" />
  <meta name="twitter:description" content={image.alt} />
  <meta name="twitter:image" content={imageUrl} />
</svelte:head>

<main>
  <header>
    <p class="eyebrow">Pamje për ndarje</p>
    <h1>{book.name}</h1>
    <p class="lede">
      {author.name}{book.datePublished ? `, ${book.datePublished}` : ''} · {summary}
    </p>
  </header>

  <figure>
    <img
      src={image.image}
      width={image.width}
      height={image.height}
      alt={image.alt}
    />
  </figure>

  <div class="actions">
    <button
      type="button"
      class="btn"
      onclick={() => downloadImage(image.image, filename, 'jpg')}
    >
      <IconDownload size={18} stroke={1.6} />
      Shkarko pamjen
    </button>

    <button type="button" class="btn bordered" onclick={copyLink}>
      {#if copied}
        <IconCheck size={18} stroke={1.6} />
        U kopjua
      {:else}
        <IconCopy size={18} stroke={1.6} />
        Kopjo lidhjen
      {/if}
    </button>

    <p class="hint">
      JPG · {image.width}×{image.height}px ·
      {data.bytes < 950_000
        ? `${Math.max(1, Math.round(data.bytes / 1024))} KB`
        : `${(data.bytes / 1024 / 1024).toFixed(1)} MB`}
    </p>
  </div>

  <p class="back">
    <a href="/{book.folder}/">← {book.name}</a>
  </p>
</main>

<style>
  main {
    max-width: 1100px;
    margin: auto;
    padding: var(--spacing-2xxl) var(--spacing-xxl) var(--spacing-3xxl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxl);
  }

  header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .eyebrow {
    margin: 0;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--link-primary);
  }

  h1 {
    margin: 0;
    font-family: var(--serif-display);
    font-size: var(--text-2xl);
    font-weight: 400;
    line-height: 1.1;
  }

  .lede {
    margin: 0;
    font-family: var(--serif);
    font-size: var(--text-lg);
    color: var(--text-secondary);
  }

  figure {
    margin: 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: solid 1px var(--border-color);
    box-shadow: var(--shadow);
    /* The frame is drawn on the dark theme's ground, so it keeps that ground
       behind it while the image loads rather than flashing the page colour. */
    background-color: #1a1712;
  }

  figure img {
    display: block;
    width: 100%;
    height: auto;
  }

  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
  }

  .btn {
    font-family: var(--sans-serif);
    font-size: var(--text-md);
  }

  .bordered {
    border: solid 1px var(--border-color);
    background-color: transparent;
  }

  .bordered:hover {
    background-color: var(--bg-secondary);
  }

  .hint {
    margin: 0;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .back {
    margin: 0;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
  }

  @media (max-width: 900px) {
    main {
      padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-2xxl);
      gap: var(--spacing-xl);
    }
  }
</style>
