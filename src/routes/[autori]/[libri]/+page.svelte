<script lang="ts">
  import Footer from '$lib/components/BookFooter.svelte';
  import TocItemList from '$lib/components/TocItemList.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import BookProfile from '$lib/components/BookProfile.svelte';
  // import { generateImageID } from "imagetools-core";
  import type { Author } from '$lib/types.js';

  let { data } = $props();

  const author: Author = data.authorInfo;
  const book = data.bookInfo;

  const BreadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Fletoret',
        item: `${CONFIG.info.base_url}`,
      },
      {
        '@type': 'ListItem',
        position: 1,
        name: author?.name,
        item: `${CONFIG.info.base_url}/${author?.folder}`,
      },
    ],
  };

  const serpDescription = `${book?.abstract} Botuar në ${book?.datePublished}.`;
</script>

<svelte:head>
  <title>{book?.name}, {author.name} | {CONFIG.info.title}</title>
  <meta name="description" content={serpDescription} />
  <meta name="twitter:description" content={serpDescription} />

  <!--twitter important OG data-->
  <meta
    name="twitter:title"
    content="{book?.name}, {author.name} | {CONFIG.info.title}"
  />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@fletoretSQ" />

  <meta property="og:image:width" content="280" />
  <meta property="og:image:height" content="150" />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="/{author?.folder}" />
  <meta
    property="og:title"
    content={`${book?.name}, {author.name} | ${CONFIG.info.title}`}
  />
  {#if book?.thumbnail}
    <meta
      property="og:image"
      content="{CONFIG.info.base_url}{book.thumbnailWebp}"
    />
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
    {#each Object.entries(data.chapters) as [chapter, entry], idx}
      <TocItemList
        header={chapter}
        entries={entry}
        chapterIdx={idx + 1}
        showHeader={Object.entries(data.chapters).length > 1}
      />
    {/each}
  </div>
</main>

<Footer />

<style>
  main {
    max-width: 1000px;
    display: flex;
    gap: 2rem;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-xxl);
    margin: auto;
  }
  main #content {
    width: 70%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  aside {
    width: 30%;
  }

  @media (max-width: 900px) {
    main {
      flex-wrap: wrap;
      padding: var(--spacing-xl) var(--spacing-lg);
    }

    main aside {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    main #content {
      max-width: 600px;
      width: 100%;
    }
  }
</style>
