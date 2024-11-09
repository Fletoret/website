<script lang="ts">
  import TocItemList from '$lib/components/TocItemList.svelte';
  

  interface Props {
    // import type { Author } from '$lib/types';
    book: any;
    chapters: any;
  }

  let { book, chapters }: Props = $props();
</script>

<div class="book">
  <a class="book-entry" href="/{book.folder}/">
    <div class="content">
      <h3 class="title">{book.name}</h3>
      <div class="desc">
        {book.abstract} Botuar në {book.datePublished}.
      </div>
    </div>
    <div class="thumbnail">
      <img src={book.thumbnail} alt="" />
    </div>
  </a>

  <div>
    {#each Object.entries(chapters) as [chapterName, entries], idx}
      <TocItemList
        header={chapterName}
        entries={entries}
        chapterIdx={idx + 1}
        showHeader={Object.entries(chapters).length > 1}
      />
    {/each}
  </div>
</div>

<style lang="scss">
  .book {
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
    font-size: var(--text-xl);
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

    .title {
      font-size: var(--text-lg2);
    }
  }
</style>
