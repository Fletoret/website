<script lang="ts">
  // import BookFooter from '$lib/components/BookFooter.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import '$lib/css/blog.css';

  let { data } = $props();
  let post = $derived(data.post);

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
        name: 'Blog',
        item: `${CONFIG.info.base_url}/blog/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: post.url,
      },
    ],
  });
</script>

<svelte:head>
  <title>{post.title} - {CONFIG.info.title}</title>
  <link rel="canonical" href={post.url} />
  <meta name="description" content={post.body.slice(0, 250)} />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content={post.url} />
  <meta property="og:title" content={post.title} />
  <meta property="og:description" content="{post.body.slice(0, 250)}..." />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />
  {#if post.img}
    <meta property="og:image" content="{CONFIG.info.base_url}/{post.imgWebp}" />
  {/if}

  <!-- Twitter -->
  <meta
    name="twitter:card"
    content={post.img ? 'summary_large_image' : 'summary'}
  />
  <meta name="twitter:site" content="@fletoretSQ" />
  <meta name="twitter:title" content={post.title} />
  <meta name="twitter:description" content={post.body.slice(0, 250)} />
  {#if post.img}
    <meta
      name="twitter:image"
      content="{CONFIG.info.base_url}/{post.imgWebp}"
    />
  {/if}

  {@html `<script type="application/ld+json"> ${JSON.stringify(BreadcrumbList)} </script>`}
</svelte:head>

<article class="post-container">
  <header class="post-header">
    {#if post.tags && post.tags.length}
      <p class="post-eyebrow">{post.tags.join(' · ')}</p>
    {/if}
    <h1 class="post-title">{post.title}</h1>
    {#if post.subtitle}
      <p class="post-subtitle">{post.subtitle}</p>
    {/if}
    {#if post.author || post.human_date}
      <div class="post-byline">
        {#if post.author}<span class="byline-author">Nga {post.author}</span
          >{/if}
        {#if post.author && post.human_date}<span class="byline-sep">·</span
          >{/if}
        {#if post.human_date}<time class="byline-date">{post.human_date}</time
          >{/if}
      </div>
    {/if}
  </header>
</article>

{#if post.img}
  <picture class="header-img">
    <source srcset="/{post.imgWebp}" type="image/webp" />
    {#if post.img.endsWith('.jpg')}
      <source srcset="/{post.img}" type="image/jpeg" />
    {:else}
      <source srcset="/{post.img}" type="image/png" />
    {/if}
    <img
      class="img-fit-contain"
      src="/{post.img}"
      alt={post.title}
      loading="lazy"
    />
  </picture>
{/if}

<!-- https://kit.svelte.dev/docs/link-options -->
<article class="post-container" data-sveltekit-reload>
  <div class="post-body">{@html post.html}</div>

  {#if post.last_update}
    <p class="last-updated">
      Last updated on {post.last_update}
    </p>
  {/if}
</article>
