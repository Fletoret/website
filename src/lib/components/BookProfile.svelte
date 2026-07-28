<script lang="ts">
  // import DownloadIcon from "$lib/icons/DownloadIcon.svelte";
  import type { Author, ExtendedBookType } from '$lib/types';
  import BreadcrumbItem from './BreadcrumbItem.svelte';

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
  <div class="book-details">
    <div class="intro">{book?.abstract} Botuar në {book?.datePublished}.</div>
    <div class="author-wrapper">
      <BreadcrumbItem
        item={{
          thumbnail: author?.thumbnail,
          text: author?.name ?? '',
          url: author?.folder ?? '',
        }}
      />
    </div>
  </div>

  <!-- <div class="actions">
    <button class="btn">
      <div class="icon">
        <DownloadIcon />
      </div>
      <div>Shkarko e-book</div>
    </button>
  </div> -->
</div>

<style lang="scss">
  #book-side-panel {
    position: sticky;
    top: 6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;

    .card {
      /* Matches AuthorCard so a book and an author card are the same size. */
      --width: 300px;
      --height: 400px;

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

    .book-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);

      .intro {
        color: var(--text-secondary);
        line-height: 1.5;
        font-size: var(--text-sm);
      }

      .author-wrapper {
        width: 100%;
      }
    }
  }

  /* The glow is a mobile treatment: on desktop the card sits in a narrow sticky
     sidebar, where a halo would bleed into the chapter list beside it. */
  @media (min-width: 901px) {
    #book-side-panel .card::before {
      display: none;
    }
  }

  @media (max-width: 900px) {
    #book-side-panel {
      max-width: var(--container-width);
      position: relative;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 0 var(--spacing-lg);

      .card {
        --width: 200px;
        --height: 250px;

        /* Room for the halo to fall below the card before the abstract. */
        margin-bottom: var(--spacing-xl);
      }
    }
  }
</style>
