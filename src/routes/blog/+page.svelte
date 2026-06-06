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
  <meta name="twitter:site" content="@fletoretSQ" />
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
          <h2 class="title">{post.title}</h2>
          {#if post.subtitle}
            <p class="subtitle">{post.subtitle}</p>
          {/if}
          <div class="meta">
            {#if post.author}<span class="author">{post.author}</span>{/if}
            {#if post.author && post.human_date}<span class="dot">·</span>{/if}
            {#if post.human_date}<time class="date">{post.human_date}</time
              >{/if}
          </div>
        </a>
      {/each}
    </div>
  </div>
</main>

<style>
  .container {
    margin: 0 auto;
    padding: calc(2 * var(--spacing-xxl)) var(--spacing-xl) var(--spacing-2xxl);
    max-width: 720px;
    width: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .page-head {
    margin-bottom: var(--spacing-2xxl);
  }

  .page-title {
    font-family: var(--sans-serif);
    font-size: clamp(2rem, 1.4rem + 2.4vw, 2.75rem);
    font-weight: 600;
    letter-spacing: -0.022em;
    line-height: 1.1;
    font-variation-settings: 'opsz' 32;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md);
  }

  .page-desc {
    color: var(--text-secondary);
    font-size: 1.15rem;
    line-height: 1.5;
    letter-spacing: -0.011em;
    max-width: 48ch;
    margin: 0;
  }

  .posts {
    display: flex;
    flex-direction: column;
  }

  .post {
    display: block;
    width: 100%;
    padding: var(--spacing-xxl) 0;
    border-top: 1px solid var(--border-color);
    transition: opacity 0.15s ease;
  }
  .post:last-child {
    border-bottom: 1px solid var(--border-color);
  }

  .post .title {
    font-family: var(--sans-serif);
    font-size: var(--text-lg2);
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.018em;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md);
    transition: color 0.15s ease;
  }

  .post .subtitle {
    font-size: var(--text-md);
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-lg);
  }

  .post .meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
  .post .meta .dot {
    opacity: 0.6;
  }

  .post:hover .title {
    color: var(--link-primary);
  }

  @media (max-width: 600px) {
    .container {
      padding: var(--spacing-2xxl) var(--spacing-xxl) var(--spacing-2xxl);
    }
    .post {
      padding: var(--spacing-xl) 0;
    }
  }
</style>
