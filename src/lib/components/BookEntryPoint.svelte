<script lang="ts">
  import EpubDownload from '$lib/components/EpubDownload.svelte';
  import TocItemList from '$lib/components/TocItemList.svelte';
  import type { ExtendedBookType, Post } from '$lib/types';

  interface Props {
    book: ExtendedBookType;
    chapters: Record<string, Post[]>;
    authorName: string;
  }

  let { book, chapters, authorName }: Props = $props();
</script>

<div class="book" id={book.folder.split('/').pop()}>
  <a class="book-entry" href="/{book.folder}">
    <div class="content">
      <h3 class="title">{book.name}</h3>
      <div class="desc">
        {book.abstract} Botuar në {book.datePublished}.
      </div>
    </div>
    <div class="thumbnail">
      <img src={book.thumbnail} alt="{book.name} - kopertina" />
    </div>
  </a>

  <!-- A sibling of the header link, not inside it: links can't nest. -->
  {#if book.epub}
    <div class="download">
      <EpubDownload bookFolder={book.folder} {authorName} variant="compact" />
    </div>
  {/if}

  <div>
    {#each Object.entries(chapters) as [chapterName, entries], idx}
      <TocItemList
        header={chapterName}
        {entries}
        chapterIdx={idx + 1}
        showHeader={Object.entries(chapters).length > 1}
      />
    {/each}
  </div>
</div>

<style lang="scss">
  .book {
    scroll-margin-top: 6rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    border: solid 1px var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--spacing-md);
  }

  .book-entry {
    display: flex;
    gap: var(--spacing-xl);
    padding: var(--spacing-xl);
    justify-content: space-between;
  }
  /* Lined up with the description, and pulled up so it reads as part of the
     header rather than a separate block. */
  .download {
    display: flex;
    padding: 0 var(--spacing-xl);
    margin-top: calc(-1 * var(--spacing-xl));
  }

  .book-entry:hover {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
  }
  .thumbnail {
    height: 100px;
    height: 100px;
    border-radius: var(--radius-lg);
  }

  .thumbnail img {
    height: inherit;
    width: inherit;
    border-radius: inherit;
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  .content .desc {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
  .title {
    font-family: var(--serif-display);
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--text-2xl);
    margin: 0;
  }
  .desc {
    font-family: var(--sans-serif);
    font-weight: 400;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  @media only screen and (min-width: 320px) and (max-width: 576px) {
    .book-entry {
      padding: var(--spacing-xl) var(--spacing-md);
    }

    .download {
      padding: 0 var(--spacing-md);
    }

    .title {
      font-size: var(--text-lg2);
    }
  }
</style>
