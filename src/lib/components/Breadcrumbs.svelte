<script lang="ts">
  import type { Author, Post } from '$lib/types';

  import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';

  interface Props {
    author?: Author;
    post: Post;
  }

  let { post, author }: Props = $props();
</script>

<!-- Breadcrumbs -->
<div class="breadcrumbs">
  {#if author}
    <BreadcrumbItem
      item={{
        thumbnail: author.thumbnail,
        text: author.name,
        url: author.folder,
      }}
    />
  {/if}
  <div class="separator">/</div>
  <BreadcrumbItem
    item={{
      text: post.bookName,
      url: post.relativeUrlBook,
    }}
  />
</div>

<style>
  .breadcrumbs {
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .breadcrumbs .separator {
    color: var(--border-color);
    min-width: 20px;
  }
</style>
