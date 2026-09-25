<script lang="ts">
  import Footer from '$lib/components/BookFooter.svelte';
  import TocItemList from '$lib/components/TocItemList.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import BookProfile from '$lib/components/BookProfile.svelte';
  // import { generateImageID } from "imagetools-core";
  import type { Author, ExtendedBookType, Post } from '$lib/types.js';
  import { EPUB_BLURB, EPUB_TITLE_SUFFIX, epubHref } from '$lib/epub';

  let { data } = $props();

  const author = $derived(data.authorInfo as Author | undefined);
  const book = $derived(data.bookInfo as ExtendedBookType | undefined);
  const chapters = $derived(data.chapters as Record<string, Post[]>);

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
    `${book?.abstract} Botuar në ${book?.datePublished}.${book?.epub ? ` ${EPUB_BLURB}` : ''}`,
  );

  // Books with an EPUB say so in the title too: people search for "… epub".
  const pageTitle = $derived(
    book?.epub
      ? `${book?.name}, ${author?.name} – ${EPUB_TITLE_SUFFIX} | ${CONFIG.info.title}`
      : `${book?.name}, ${author?.name} | ${CONFIG.info.title}`,
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <link rel="canonical" href="{CONFIG.info.base_url}/{book?.folder}/" />
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
  <meta property="og:locale" content="sq_AL" />
  {#each author?.books || [] as bookSchema}
    {@html `<script type="application/ld+json"> ${JSON.stringify(
      bookSchema,
    )} </script>`}
  {/each}

  {@html `<script type="application/ld+json"> ${JSON.stringify(
    BreadcrumbList,
  )}</script>`}
</svelte:head>

<main>
  <aside>
    <BookProfile {book} {author} />
  </aside>
  <div id="content">
    <h1>{book?.name}</h1>
    {#each Object.entries(chapters) as [chapter, entry], idx}
      <TocItemList
        header={chapter}
        entries={entry}
        chapterIdx={idx + 1}
        showHeader={Object.entries(chapters).length > 1}
      />
    {/each}
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
    padding: var(--spacing-xl) var(--spacing-xxl);
    margin: auto;
  }
  main #content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    h1 {
      font-family: var(--serif-display);
      margin-bottom: 0;
      font-size: var(--text-2xl);
    }
  }
  /* Sized to the 300px cover/author card, not a percentage that can fall below it. */
  aside {
    flex: 0 0 300px;
  }

  @media (max-width: 900px) {
    main {
      flex-wrap: wrap;
      padding: var(--spacing-xl) var(--spacing-lg);
    }

    main aside {
      flex: 1 1 100%;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    main #content {
      flex: 1 1 100%;
      max-width: 600px;
      width: 100%;
    }
  }
</style>
