<script lang="ts">
  import Footer from '$lib/components/BookFooter.svelte';
  import TocItemList from '$lib/components/TocItemList.svelte';
  import CONFIG from '$lib/config';
  import { bookSchema, jsonLd } from '$lib/schema';
  import '$lib/css/app.css';
  import BookProfile from '$lib/components/BookProfile.svelte';
  import BookAbout from '$lib/components/BookAbout.svelte';
  import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
  // import { generateImageID } from "imagetools-core";
  import type { Author, ExtendedBookType, Post } from '$lib/types.js';
  import { epubBlurb, epubHref, epubTitleSuffix } from '$lib/epub';
  import { DEFAULT_LANGUAGE, languageInfo, languageOf } from '$lib/editions';

  let { data } = $props();

  const author = $derived(data.authorInfo as Author | undefined);
  const book = $derived(data.bookInfo as ExtendedBookType | undefined);
  const chapters = $derived(data.chapters as Record<string, Post[]>);
  const lang = $derived(book ? languageOf(book) : DEFAULT_LANGUAGE);
  // The other language editions of this work, for hreflang.
  const alternates = $derived((book?.editions ?? []).filter((e) => e.folder !== book?.folder));

  const BreadcrumbList = $derived({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Fletoret',
        item: `${CONFIG.info.base_url}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: author?.name,
        item: `${CONFIG.info.base_url}/${author?.folder}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book?.name,
        item: `${CONFIG.info.base_url}/${book?.folder}/`,
      },
    ],
  });

  const serpDescription = $derived(
    `${book?.abstract} ${languageInfo(lang).published(String(book?.datePublished ?? ''))}${book?.epub ? ` ${epubBlurb(lang)}` : ''}`,
  );

  // Books with an EPUB say so in the title too: people search for "… epub".
  const pageTitle = $derived(
    book?.epub
      ? `${book?.name}, ${author?.name} – ${epubTitleSuffix(lang)} | ${CONFIG.info.title}`
      : `${book?.name}, ${author?.name} | ${CONFIG.info.title}`,
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <link rel="canonical" href="{CONFIG.info.base_url}/{book?.folder}/" />
  {#if alternates.length}
    <link rel="alternate" hreflang={lang} href="{CONFIG.info.base_url}/{book?.folder}/" />
    {#each alternates as edition}
      <link rel="alternate" hreflang={edition.inLanguage} href="{CONFIG.info.base_url}/{edition.folder}/" />
    {/each}
  {/if}
  {#if book?.epub}
    <link
      rel="alternate"
      type="application/epub+zip"
      href="{CONFIG.info.base_url}{epubHref(book.folder)}"
      title="{book.name} (EPUB)"
    />
  {/if}
  <meta name="description" content={serpDescription} />
  <meta name="twitter:description" content={serpDescription} />

  <!--twitter important OG data-->
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@FletoretSQ" />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{CONFIG.info.base_url}/{book?.folder}/" />
  <meta property="og:title" content={pageTitle} />
  {#if book?.thumbnail}
    <meta
      property="og:image"
      content="{CONFIG.info.base_url}{book.thumbnailWebp}"
    />
    <meta property="og:image:alt" content="{book?.name}, {author?.name}" />
    <meta
      name="twitter:image"
      content="{CONFIG.info.base_url}{book?.thumbnailWebp}"
    />
  {/if}
  {#if book?.abstract}
    <meta property="og:description" content={serpDescription} />
  {/if}
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content={languageInfo(lang).locale} />
  {#each alternates as edition}
    <meta property="og:locale:alternate" content={languageInfo(edition.inLanguage).locale} />
  {/each}
  {#if book}
    {@html jsonLd(bookSchema(book))}
  {/if}

  {@html jsonLd(BreadcrumbList)}
</svelte:head>

<main>
  <aside>
    <BookProfile {book} {author} />
  </aside>
  <div id="content">
    <header class="book-head">
      <h1 {lang}>{book?.name}</h1>
      {#if author}
        <BreadcrumbItem
          item={{ thumbnail: author.thumbnail, text: author.name, url: author.folder }}
        />
      {/if}
    </header>
    {#if book}
      <div class="book-about"><BookAbout {book} /></div>
    {/if}
    <div class="chapters" {lang}>
      {#each Object.entries(chapters) as [chapter, entry], idx}
        <TocItemList
          header={chapter}
          entries={entry}
          chapterIdx={idx + 1}
          showHeader={Object.entries(chapters).length > 1}
        />
      {/each}
    </div>
  </div>
</main>

<Footer />

<style>
  /* body is a flex column and auto margins stop a flex item from stretching, so
     without an explicit width main would shrink to its content and the columns
     would change size from book to book. */
  main {
    width: 100%;
    max-width: 1000px;
    display: flex;
    gap: 3rem;
    justify-content: center;
    padding: var(--spacing-2xxl) var(--spacing-xxl) var(--spacing-xl);
    margin: auto;
  }
  main #content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxl);

    h1 {
      font-family: var(--serif-display);
      margin: 0;
      font-size: var(--text-2xl);
      /* Trim the space above the capitals, so the title starts exactly at the
         cover's top edge (browsers without text-box keep the old spacing). */
      text-box: trim-start cap alphabetic;
    }
  }

  .book-head {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);

    /* Line the author's portrait up with the text column, and take the
       pill's padding (4px above and below the 42px portrait) out of the
       spacing around it; it still gives the hover background room. */
    :global(.breadcrumb-item) {
      margin: calc(-1 * var(--spacing-sm)) 0 calc(-1 * var(--spacing-sm))
        calc(-1 * var(--spacing-md));
    }
  }

  .chapters {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    /* The first part heading follows the description at the column's own
       gap; the later ones keep their margin, to set the parts apart. */
    :global(.toc:first-child .header) {
      margin-top: 0;
    }
  }
  /* Sized to the 300px cover/author card, not a percentage that can fall below it. */
  aside {
    flex: 0 0 300px;
  }

  /* Phones (most visitors): one column, in reading order. The side panel and
     the content column dissolve (`display: contents`) so their pieces can be
     ordered together: cover, title and author, download, language switch
     (set in BookProfile.svelte), description, chapters. */
  @media (max-width: 900px) {
    main {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-xl);
      max-width: calc(var(--container-width) + 2 * var(--spacing-lg));
      padding: var(--spacing-xl) var(--spacing-lg);
    }

    main aside,
    main #content {
      display: contents;
    }

    .book-head {
      order: 2;
      align-items: center;
      text-align: center;
    }

    .book-about {
      order: 5;
    }

    .chapters {
      order: 6;
      margin-top: var(--spacing-md);
    }
  }
</style>
