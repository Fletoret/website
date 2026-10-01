<script lang="ts">
  // The book page's side panel: cover, e-book download and language switch.
  // The title, author and description are in the page's main column (see
  // src/routes/[autori]/[libri]/+page.svelte). On a phone this panel dissolves
  // (`display: contents`) so the page can interleave its pieces with the title:
  // cover, title and author, download, description, chapters.
  import EpubDownload from './EpubDownload.svelte';
  import EditionSwitch from './EditionSwitch.svelte';
  import type { Author, ExtendedBookType } from '$lib/types';

  interface Props {
    book?: ExtendedBookType;
    author?: Author;
  }

  let { book, author }: Props = $props();
</script>

<div id="book-side-panel">
  <div class="card cover-glow" style="--glow-image: url({book?.thumbnail});">
    <img
      src={book?.thumbnail}
      fetchpriority="high"
      alt="{book?.name} - kopertina"
    />
  </div>
  {#if book?.epub}
    <EpubDownload bookFolder={book.folder} authorName={author?.name ?? ''} />
  {/if}
  {#if book?.editions && book.editions.length > 1}
    <EditionSwitch editions={book.editions} current={book.folder} />
  {/if}
</div>

<style lang="scss">
  #book-side-panel {
    position: sticky;
    /* Where the panel sits at rest: under the 69px header, after the page's
       top padding. Sticking any lower would nudge the cover down on long
       pages, out of line with the title beside it. */
    top: calc(69px + var(--spacing-xl));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;

    .card {
      /* Matches AuthorCard so a book and an author card are the same size. */
      --width: 300px;
      --height: 450px;

      width: var(--width);
      height: var(--height);
      border-radius: var(--radius-lg);
      font-family: var(--sans-serif-display);
    }
    .card img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      /* Covers are ~0.625 aspect against a 0.75 card, so this trims roughly 40px
         from the top and bottom (equally, hence centre). That clips the outer edge
         of the title block and the imprint on some covers — accepted in exchange
         for cards that are all one size. */
      object-fit: cover;
      object-position: center;
    }
  }

  /* The glow is a mobile treatment: on desktop the card sits in a narrow sticky
     sidebar, where a halo would bleed into the chapter list beside it. */
  @media (min-width: 901px) {
    #book-side-panel .card::before {
      display: none;
    }
  }

  /* On a phone the panel's pieces join the page's single column, in the
     order the page sets: cover (1), title and author (2), download (3),
     language switch (4), description (5), chapters (6). */
  @media (max-width: 900px) {
    #book-side-panel {
      display: contents;

      .card {
        --width: 200px;
        --height: 250px;

        order: 1;
        align-self: center;
        /* Room for the halo to fall below the card before the title. */
        margin-bottom: var(--spacing-xl);
      }

      :global(.download) {
        order: 3;
      }

      :global(.editions) {
        order: 4;
      }
    }
  }
</style>
