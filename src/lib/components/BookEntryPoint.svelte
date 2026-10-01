<script lang="ts">
  import { IconBook } from '@tabler/icons-svelte';
  import EpubDownload from '$lib/components/EpubDownload.svelte';
  import TocItemList from '$lib/components/TocItemList.svelte';
  import type { ExtendedBookType, Post } from '$lib/types';
  import { languageInfo } from '$lib/editions';

  interface Props {
    book: ExtendedBookType;
    chapters: Record<string, Post[]>;
    authorName: string;
  }

  let { book, chapters, authorName }: Props = $props();

  // This work in other languages (src/lib/editions.ts).
  let otherEditions = $derived(
    (book.editions ?? []).filter((e) => e.folder !== book.folder),
  );

  let meta = $derived(
    [
      `Botuar në ${book.datePublished}`,
      book.compilerName && `Mbledhur dhe kodifikuar nga ${book.compilerName}`,
    ]
      .filter(Boolean)
      .join(' · '),
  );
</script>

<article class="book" id={book.folder.split('/').pop()}>
  <!-- A tinted header, the cover on the left and everything else in one
       column beside it: title, date, description (cut to a few lines; the
       book page has it all) and the buttons. The chapters follow, as wide as
       the header. The whole header opens the book: the title's link is
       stretched over it, and the links inside sit above it, since links
       can't nest. -->
  <div class="book-entry">
    <div class="thumbnail">
      <img src={book.thumbnail} alt="{book.name} - kopertina" />
    </div>
    <div class="head">
      <h3 class="title">
        <a class="stretched" href="/{book.folder}">{book.name}</a>
      </h3>
      <p class="meta">
        {meta}{#each otherEditions as edition}
          {' · '}<a
            class="edition"
            href="/{edition.folder}/"
            hreflang={edition.inLanguage}
          >
            {edition.original ? 'Origjinali në' : 'Edhe në'}
            {languageInfo(edition.inLanguage).name}:
            <i lang={edition.inLanguage}>{edition.name}</i>
          </a>
        {/each}
      </p>
    </div>
    {#if book.abstract}
      <p class="desc">{book.abstract}</p>
    {/if}
    <div class="actions">
      <a class="btn btn-sm read" href="/{book.folder}">
        <span class="icon"><IconBook size="100%" stroke={1.5} /></span>
        Lexo librin
      </a>
      {#if book.epub}
        <EpubDownload bookFolder={book.folder} {authorName} variant="compact" />
      {/if}
    </div>
  </div>

  <div class="chapters">
    {#each Object.entries(chapters) as [chapterName, entries], idx}
      <TocItemList
        header={chapterName}
        {entries}
        chapterIdx={idx + 1}
        showHeader={Object.entries(chapters).length > 1}
      />
    {/each}
  </div>
</article>

<style lang="scss">
  /* Everything inside lines up on one inset: the cover's left edge, the
     chapter icons and the part headings all sit --inset from the card's
     edge, and the header and the chapter list share its width and radius. */
  .book {
    --inset: var(--spacing-xxl);

    scroll-margin-top: 6rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .book-entry {
    position: relative;
    display: grid;
    grid-template-columns: 112px 1fr;
    /* The text column centred on the cover, its gaps fixed. The empty rows
       above and below take the cover's spare height, and their row gaps
       keep the text at least that far inside the cover's top and foot. */
    grid-template-rows: 1fr auto auto auto 1fr;
    grid-template-areas:
      'cover .'
      'cover head'
      'cover desc'
      'cover actions'
      'cover .';
    column-gap: var(--spacing-xxl);
    row-gap: var(--spacing-xl);
    padding: var(--inset);
    border-radius: var(--radius-xl);
    background-color: var(--bg-secondary);
    transition: background-color 0.15s ease;

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--bg-secondary),
        var(--text-primary) 4%
      );
    }
  }

  /* The title's link covers the whole header. */
  .stretched {
    color: inherit;
    text-decoration: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }

    &:focus-visible {
      outline: none;

      &::after {
        outline: 2px solid var(--text-primary);
        outline-offset: -2px;
      }
    }
  }

  .thumbnail {
    grid-area: cover;
    /* Centred too, for the few columns taller than the cover. */
    align-self: center;
    aspect-ratio: 5 / 8;
    border-radius: var(--radius-sm);
    /* A tight contact shadow and a soft, lower one, so the cover reads as
       a book lying on the header. */
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.12),
      0 10px 24px -8px rgb(0 0 0 / 0.35);
  }

  .thumbnail img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  .head {
    grid-area: head;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    min-width: 0;
  }

  .title {
    font-family: var(--serif-display);
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--text-2xl);
    /* Tight, and trimmed above the capitals, so the row gap is the only
       space above the letters. */
    line-height: 1.05;
    text-box: trim-start cap alphabetic;
    margin: 0;
    text-wrap: balance;
  }

  .meta,
  .desc {
    margin: 0;
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  /* Above the stretched link, so it stays clickable. */
  .edition {
    position: relative;
    z-index: 1;
    color: inherit;
    text-decoration: none;

    i {
      color: var(--text-primary);
    }

    &:hover i {
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  .desc {
    grid-area: desc;
    line-height: 1.6;
    text-wrap: pretty;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  /* Above the stretched link, so they stay clickable. */
  .actions {
    grid-area: actions;
    align-self: start;
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-md);

    /* The EPUB button is filled with the header's own colour elsewhere;
       here it takes the page's, to stand off the tint. */
    :global(.download) {
      background-color: var(--bg-primary);
    }
  }

  /* The primary action, inverted so it never blends into the header or the
     EPUB button beside it. */
  .read {
    gap: var(--spacing-sm);
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    text-decoration: none;
    border: solid 1px var(--text-primary);
    background-color: var(--text-primary);
    color: var(--bg-primary);
    transition: background-color 0.15s ease;

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--text-primary),
        var(--bg-primary) 18%
      );
    }

    .icon {
      --size: 18px;
      padding: 0;
      color: inherit;
    }
  }

  /* The chapter list on the card's inset (TocItemList pads for the book
     page, where it stands alone). */
  .chapters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);

    /* 1px in for the list's border, as in TocItemList. */
    :global(.header) {
      margin: 0;
      padding: var(--spacing-xxl) var(--inset) var(--spacing-md)
        calc(var(--inset) + 1px);
    }

    :global(.item-list .item) {
      padding-inline: var(--inset);
    }
  }

  @media only screen and (max-width: 576px) {
    /* The column beside the cover is too narrow for more than the title: the
       description and buttons run the full width under it. */
    .book {
      --inset: var(--spacing-xl);
    }

    .book-entry {
      grid-template-columns: 80px 1fr;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        'cover head'
        'desc desc'
        'actions actions';
      column-gap: var(--spacing-xl);
    }

    .head {
      align-self: center;
    }

    .title {
      font-size: var(--text-xl);
    }
  }
</style>
