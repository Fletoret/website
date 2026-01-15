<script lang="ts">
  import BookFooter from '$lib/components/BookFooter.svelte';
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import ReadNext from '$lib/components/ReadNext.svelte';
  import CONFIG from '$lib/config';
  import '$lib/css/app.css';
  import '$lib/css/post.css';

  let { data } = $props();
  let post = $derived(data.post);
  let postAfter = $derived(data.postAfter);
  let authorInfo = $derived(data.authorInfo);

  let title = $derived(`${post.title}, ${post.grandparent || post.parent} - ${post.author} | ${CONFIG.info.title}`);

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
        name: authorInfo?.name,
        item: `${CONFIG.info.base_url}/${authorInfo?.folder}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.bookName,
        item: post.urlBook,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: post.url,
      },
    ],
  });
</script>

<svelte:head>
  <title>{title}</title>
  <link rel="canonical" href={post.url} />
  <meta name="description" content={post.body.slice(0, 250)} />
  <meta name="twitter:description" content={post.body.slice(0, 250)} />

  <!--twitter important OG data-->
  <meta name="twitter:title" content={title} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@fletoretSQ" />

  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={post.url} />
  <meta property="og:title" content={title} />
  {#if authorInfo?.thumbnail}
    <meta
      property="og:image"
      content="{CONFIG.info.base_url}{authorInfo?.thumbnailWebp}"
    />
    <meta
      name="twitter:image"
      content="{CONFIG.info.base_url}{authorInfo?.thumbnailWebp}"
    />
  {/if}
  <meta property="og:description" content="{post.body.slice(0, 250)} ..." />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />

  {@html `<script type="application/ld+json"> ${JSON.stringify(
    BreadcrumbList,
  )} </script>`}
</svelte:head>

<div class="post-container">
  <div class="post-header">
    <Breadcrumbs author={authorInfo} {post} />

    <!-- <div class="post-meta-tags">
      {#each post.tags as tag}
        <p class="post-tag">{tag}</p>
      {/each}
    </div> -->
    <h1 class="post-title">{post.title}</h1>
    {#if post.subtitle}
      <h2 class="post-subtitle">{post.subtitle}</h2>
    {/if}
  </div>
</div>

{#if post.img}
  <picture class="header-img">
    {#if post.img.endsWith('.jpg')}
      <source srcset="/{post.img}" type="image/jpeg" />
    {:else if post.img.endsWith('.avif')}
      <source srcset="/{post.img}" type="image/avif" />
    {:else if post.img.endsWith('.webp')}
      <source srcset="/{post.imgWebp}" type="image/webp" />
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
{:else}
  <!-- <div class="divider" /> -->
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
        Ndryshuar së fundmi më {post.last_update}.
      </p>
    {/if}

    <ReadNext post={postAfter} />
  </div>
</div>

<BookFooter />
