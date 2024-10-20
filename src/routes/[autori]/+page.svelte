<script lang="ts">
  import AuthorCard from '$lib/components/AuthorCard.svelte';
  import Footer from '$lib/components/BookFooter.svelte';
  // import TocItemList from '$lib/components/TocItemList.svelte';
  import CONFIG from '$lib/config';

  import type { Author } from '$lib/types.js';

  function generateAuthorDesc() {
    let desc = `${author?.name} - veprat. `;
    if (author?.books) {
      desc += author.books.map((x) => x.name).join(', ');
    }
    return desc.trimEnd();
  }

  export let data;
  const author: Author = data.authorInfo;
  const description = generateAuthorDesc();
  const books = data.authorInfo?.books;
  const bookEntries = data.books;

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

  import '$lib/css/app.css';
  import BookEntryPoint from '$lib/components/BookEntryPoint.svelte';
  // import { generateImageID } from "imagetools-core";
</script>

<svelte:head>
  <title>{author?.name} | {CONFIG.info.title}</title>
  <meta name="description" content={description} />
  <meta name="twitter:description" content={description} />

  <!--twitter important OG data-->
  <meta name="twitter:title" content="{author?.name} | {CONFIG.info.title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@fletoretSQ" />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="/{author?.folder}" />
  <meta
    property="og:title"
    content={`${author?.name} | ${CONFIG.info.title}`}
  />
  {#if author?.thumbnail}
    <meta
      property="og:image"
      content="{CONFIG.info.base_url}{author.thumbnailWebp}"
    />
    <meta
      name="twitter:image"
      content="{CONFIG.info.base_url}{author?.thumbnailWebp}"
    />
  {/if}
  {#if author?.name}
    <meta
      property="og:description"
      content={`${author.name} - Veprat e digjitalizuara.`}
    />
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
    <AuthorCard authorInfo={author} />
  </aside>
  <div id="content">
    {#if bookEntries}
      {#each bookEntries as [book, chapters]}
        <BookEntryPoint {author} {book} {chapters} />
      {/each}
    {/if}
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
