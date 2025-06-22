<script lang="ts">
  import type { Breadcrumb } from '$lib/types';

  interface Props {
    item: Breadcrumb;
  }

  let { item }: Props = $props();
</script>

<a class="breadcrumb-item" href="/{item.url}">
  {#if item?.thumbnail}
    <img src={item?.thumbnail} class="item-thumb" alt={item?.text} />
  {/if}
  {item?.text}
</a>

<style>
  .breadcrumb-item {
    padding: var(--spacing-md) var(--spacing-md);
    border-radius: var(--radius-xl);
    margin-left: calc(var(--spacing-lg) * -1);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    color: var(--text-secondary);
    height: calc(42px + var(--spacing-md));

    .item-thumb {
      height: 42px;
      width: 42px;
      object-fit: cover;
      border-radius: var(--radius-lg);
      border: solid 1px var(--border-color);
      color: var(--text-secondary);
      object-position: top;
    }
  }
  .breadcrumb-item:hover {
    cursor: pointer;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
</style>
