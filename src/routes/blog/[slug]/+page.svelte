<script lang="ts">
  // import BookFooter from '$lib/components/BookFooter.svelte';
  import CONFIG from '$lib/config';
  import { stripMarkdown } from '$lib/utils';
  import '$lib/css/app.css';
  import '$lib/css/blog.css';

  let { data } = $props();
  let post = $derived(data.post);

  let description = $derived(stripMarkdown(post.body, 160));

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

  let BlogPostingSchema = $derived({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    inLanguage: 'sq',
    ...(post.author
      ? { author: { '@type': 'Person', name: post.author } }
      : {}),
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.last_update ? { dateModified: post.last_update } : {}),
    publisher: {
      '@type': 'Organization',
      name: CONFIG.info.title,
      url: `${CONFIG.info.base_url}/`,
    },
    url: post.url,
    mainEntityOfPage: post.url,
    ...(post.img
      ? { image: `${CONFIG.info.base_url}/${post.imgWebp}` }
      : {}),
  });
</script>

<svelte:head>
  <title>{post.title} - {CONFIG.info.title}</title>
  <link rel="canonical" href={post.url} />
  <meta name="description" content={description} />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content={post.url} />
  <meta property="og:title" content={post.title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />
  {#if post.img}
    <meta property="og:image" content="{CONFIG.info.base_url}/{post.imgWebp}" />
    <meta property="og:image:alt" content={post.title} />
  {/if}

  <!-- Twitter -->
  <meta
    name="twitter:card"
    content={post.img ? 'summary_large_image' : 'summary'}
  />
  <meta name="twitter:site" content="@FletoretSQ" />
  <meta name="twitter:title" content={post.title} />
  <meta name="twitter:description" content={description} />
  {#if post.img}
    <meta
      name="twitter:image"
      content="{CONFIG.info.base_url}/{post.imgWebp}"
    />
  {/if}

  {@html `<script type="application/ld+json"> ${JSON.stringify(BreadcrumbList)} </script>`}
  {@html `<script type="application/ld+json"> ${JSON.stringify(BlogPostingSchema)} </script>`}
</svelte:head>

<article class="post-container">
  <header class="post-header">
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
      fetchpriority="high"
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
