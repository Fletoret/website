<script lang="ts">
  // import DownloadIcon from "$lib/icons/DownloadIcon.svelte";
  import type { Author } from '$lib/types';
  import BreadcrumbItem from './BreadcrumbItem.svelte';

  interface Props {
    book: any;
    author: Author;
  }

  let { book, author }: Props = $props();
</script>

<div id="book-side-panel">
  <div
    class="card-bg-glassy"
    style="background-image: url({book?.thumbnail});"
  ></div>

  <div class="card">
    <img src={book?.thumbnail} loading="lazy" alt="" />
    <div class="content">
      <!-- <div class="book">{book}</div> -->
      <!-- <div class="name">{book.name}</div> -->
    </div>
  </div>
  <div class="book-details">
    <div class="intro">{book.abstract} Botuar në {book.datePublished}.</div>
    <div class="author-wrapper">
      <BreadcrumbItem
        item={{
          thumbnail: author.thumbnail,
          text: author.name,
          url: author.folder,
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
      --width: 300px;
      --height: 400px;

      position: relative;
      max-width: var(--width);
      min-width: var(--width);
      max-height: var(--height);
      border-radius: var(--radius-lg);
      font-family: var(--sans-serif-display);
    }
    .card img {
      display: block;
      width: 100%;
      max-width: 100%;
      border-radius: inherit;
      object-fit: cover;
      max-height: inherit;
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

  .card-bg-glassy {
    display: none;
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

        margin-bottom: var(--spacing-xl);
      }
    }

    .card-bg-glassy {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 150px;
      filter: blur(75px);

      /* background-repeat: no-repeat; */
      background-position: center;
      background-size: auto;
      background-size: contain;
    }
  }
</style>
