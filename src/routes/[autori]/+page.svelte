<script lang="ts">
  import AuthorCard from '$lib/components/AuthorCard.svelte';
  import Footer from '$lib/components/BookFooter.svelte';
  // import TocItemList from '$lib/components/TocItemList.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import BookEntryPoint from '$lib/components/BookEntryPoint.svelte';
  import type { Author, ExtendedBookType, Post } from '$lib/types.js';

  let { data } = $props();

  let author = $derived(data.authorInfo as Author);
  let bookEntries = $derived(data.books as [ExtendedBookType, Record<string, Post[]>][]);

  let description = $derived.by(() => {
    let desc = `${author?.name} - veprat e plota. `;
    if (author?.books) {
      desc += author.books.map((x) => x.name).join(', ');
    }
    return desc.trimEnd();
  });

  let BreadcrumbList = $derived({
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
    ],
  });

  // import { generateImageID } from "imagetools-core";
</script>

<svelte:head>
  <title>{author?.name} | {CONFIG.info.title}</title>
  <link rel="canonical" href="{CONFIG.info.base_url}/{author?.folder}" />

  <meta name="description" content={description} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:url" content="{CONFIG.info.base_url}/{author?.folder}" />

  <!--twitter important OG data-->
  <meta name="twitter:title" content="{author?.name} | {CONFIG.info.title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@FletoretSQ" />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{CONFIG.info.base_url}/{author?.folder}" />
  <meta
    property="og:title"
    content={`${author?.name} | ${CONFIG.info.title}`}
  />
  {#if author?.thumbnail}
    <meta
      property="og:image"
      content="{CONFIG.info.base_url}{author.thumbnailWebp}"
    />
    <meta property="og:image:alt" content={author?.name} />
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
    {#if bookEntries?.length > 1}
      <nav class="shelf" aria-label="Veprat">
        <span class="count">{bookEntries.length} vepra</span>
        <ul>
          {#each bookEntries as [book]}
            <li>
              <a href="#{book.folder.split('/').pop()}">
                {#if book.thumbnail}<img src={book.thumbnail} alt="" />{/if}
                <span>{book.name}</span>
                <span class="year">{book.datePublished}</span>
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
    {#if bookEntries}
      {#each bookEntries as [book, chapters]}
        <BookEntryPoint {book} {chapters} />
      {/each}
    {/if}
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
  }
  /* Sized to the 300px cover/author card, not a percentage that can fall below it. */
  aside {
    flex: 0 0 300px;
  }

  .shelf {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding-bottom: var(--spacing-lg);
  }
  .shelf .count {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }
  .shelf ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .shelf a {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 4px 0.875rem 4px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    color: inherit;
    text-decoration: none;
    font-size: var(--text-sm);
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .shelf a:hover {
    border-color: var(--border-color-light);
    background: rgba(127, 127, 127, 0.1);
  }
  .shelf img {
    width: 22px;
    height: 32px;
    object-fit: cover;
    /* chip radius minus its padding, so the corners stay concentric */
    border-radius: var(--radius-md);
    display: block;
  }
  .shelf .year {
    color: var(--text-secondary);
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
