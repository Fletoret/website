<script lang="ts">
  import type { Author } from '$lib/types';

  interface Props {
    author: Author;
  }

  let { author }: Props = $props();
</script>

<a class="author" href="/{author?.folder}/">
  <img src={author?.thumbnail} class="author-thumb" alt="{author?.name} foto" />
  {author?.name}
</a>

<style>
  .author {
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    margin-left: calc(var(--spacing-lg) * -1);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    color: var(--text-secondary);
  }

  .author .author-thumb {
    height: 42px;
    width: 42px;
    object-fit: cover;
    border-radius: var(--radius-md);
    border: solid 1px var(--border-color);
    color: var(--text-secondary);
    object-position: top;
  }

  .author:hover {
    cursor: pointer;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
</style>
