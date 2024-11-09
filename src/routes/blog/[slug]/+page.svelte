<script lang="ts">
  // import BookFooter from '$lib/components/BookFooter.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import '$lib/css/blog.css';

  let { data } = $props();
  let { post } = data;

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
        name: 'Blog',
        item: `${CONFIG.info.base_url}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.title,
        item: post.url,
      },
    ],
  };
</script>

<svelte:head>
  <title>{post.title} - {CONFIG.info.title}</title>
  <meta name="description" content={post.body.slice(0, 250)} />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={post.url} />
  <meta property="og:title" content={post.title} />

  <meta property="og:description" content="{post.body.slice(0, 250)} ..." />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />
</svelte:head>

<div class="post-container">
  <div class="post-header">
    <h1 class="post-title">{post.title}</h1>
    {#if post.subtitle}
      <p class="post-subtitle">{post.subtitle}</p>
    {/if}
  </div>
</div>

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
<div class="post-container" data-sveltekit-reload>
  <div class="post-header">
    {#if post.human_date}
      <div class="meta-time">
        <p class="post-meta-time">{post.human_date}</p>
      </div>
    {/if}

    <div class="post-body">{@html post.html}</div>

    {#if post.last_update}
      <p class="last-updated">
        Last updated on {post.last_update}
      </p>
    {/if}
  </div>
</div>
