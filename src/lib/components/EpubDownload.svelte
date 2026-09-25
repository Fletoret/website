<script lang="ts">
  // Download link for a book's EPUB (built by scripts/epub.mjs). Render it only
  // for books with `epub: true`. `full` fills the book profile's side panel;
  // `compact` sits under a book's description on the author page.
  import { IconBookDownload } from '@tabler/icons-svelte';
  import { epubDownloadName, epubHref } from '$lib/epub';

  interface Props {
    bookFolder: string;
    authorName: string;
    variant?: 'full' | 'compact';
  }

  let { bookFolder, authorName, variant = 'full' }: Props = $props();
</script>

<a
  class="btn download"
  class:btn-sm={variant === 'compact'}
  class:compact={variant === 'compact'}
  href={epubHref(bookFolder)}
  download={epubDownloadName(authorName, bookFolder)}
  type="application/epub+zip"
>
  <span class="icon"><IconBookDownload size="100%" stroke={1.5} /></span>
  {#if variant === 'compact'}
    <span>Shkarko e-book <span class="format">· EPUB</span></span>
  {:else}
    <span class="label">
      Shkarko e-book
      <span class="format">EPUB, për lexuesit elektronikë</span>
    </span>
  {/if}
</a>

<style lang="scss">
  .download {
    width: 100%;
    box-sizing: border-box;
    font-family: var(--sans-serif);
    text-decoration: none;
    border: solid 1px var(--border-color);
    background-color: var(--bg-secondary);
    transition: background-color 0.15s ease;

    /* Filled at rest so it stands apart from the chapter list below; hover
       mixes in a little text colour, which darkens in light mode and lightens
       in dark mode. */
    &:hover {
      background-color: color-mix(in srgb, var(--bg-secondary), var(--text-primary) 7%);
    }

    /* Sized to the two-line label; .compact scales it back down. */
    .icon {
      --size: 28px;
    }

    .label {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      line-height: 1.3;
    }

    .format {
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }
  }

  .compact {
    width: auto;
    gap: var(--spacing-sm);
    font-size: var(--text-sm);

    .icon {
      --size: 18px;
      padding: 0;
    }

    .format {
      font-size: inherit;
    }
  }
</style>
