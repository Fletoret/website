<script lang="ts">
  import '$lib/css/app.css';
  import CONFIG from '$lib/config';
  let { data } = $props();
</script>

<svelte:head>
  <title>Blog | {CONFIG.info.title}</title>
  <link rel="canonical" href="{CONFIG.info.base_url}/blog/" />
  <meta
    name="description"
    content="Artikuj rreth digjitalizimit të veprave letrare shqipe në domain-in publik."
  />

  <!-- OG params -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{CONFIG.info.base_url}/blog/" />
  <meta property="og:title" content="Blog | {CONFIG.info.title}" />
  <meta
    property="og:description"
    content="Artikuj rreth digjitalizimit të veprave letrare shqipe në domain-in publik."
  />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@FletoretSQ" />
  <meta name="twitter:title" content="Blog | {CONFIG.info.title}" />
  <meta
    name="twitter:description"
    content="Artikuj rreth digjitalizimit të veprave letrare shqipe në domain-in publik."
  />
</svelte:head>

<main>
  <div class="container">
    <header class="page-head">
      <h1 class="page-title">Blog</h1>
      <p class="page-desc">
        Artikuj rreth digjitalizimit të veprave letrare shqipe në domain-in
        publik.
      </p>
    </header>

    <div class="posts">
      {#each data.posts as post}
        <a class="post" href="/{post.relativeUrl}">
          {#if post.human_date}<time class="date">{post.human_date}</time>{/if}
          <h2 class="title">{post.title}</h2>
        </a>
      {/each}
    </div>
  </div>
</main>

<style>
  .container {
    margin: 0 auto;
    padding: calc(2 * var(--spacing-xxl)) var(--spacing-xl) var(--spacing-2xxl);
    max-width: 660px;
    width: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .page-head {
    margin-bottom: var(--spacing-2xxl);
  }

  .page-title {
    font-family: var(--serif-display);
    font-size: 2.4rem;
    font-weight: 600;
    letter-spacing: 0;
    line-height: 1.1;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm);
  }

  .page-desc {
    font-family: var(--serif);
    color: var(--text-secondary);
    font-size: var(--text-md);
    line-height: 1.5;
    letter-spacing: 0;
    text-wrap: pretty;
    max-width: 42ch;
    margin: 0;
  }

  .posts {
    display: flex;
    flex-direction: column;
  }

  .post {
    display: grid;
    grid-template-columns: 8.5rem 1fr;
    gap: var(--spacing-xl);
    align-items: baseline;
    width: 100%;
    padding: var(--spacing-xl) 0;
    border-top: 1px solid var(--border-color);
  }
  .post:last-child {
    border-bottom: 1px solid var(--border-color);
  }

  .post .date {
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    line-height: 1.6;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .post .title {
    font-family: var(--serif);
    font-size: 1.15rem;
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0;
    color: var(--text-primary);
    margin: 0;
    text-wrap: pretty;
    transition: color 0.15s ease;
  }

  .post:hover .title {
    color: var(--text-secondary);
  }

  @media (max-width: 600px) {
    .container {
      padding: var(--spacing-2xxl) var(--spacing-xxl) var(--spacing-2xxl);
    }
    .post {
      grid-template-columns: 1fr;
      gap: var(--spacing-sm);
      padding: var(--spacing-lg) 0;
    }
    .post .date {
      order: 2;
    }
    .post .title {
      order: 1;
    }
  }
</style>
