<script lang="ts">
  import ArrowRightIcon from '$lib/icons/ArrowRightIcon.svelte';
  import type { Post } from '$lib/types';

  export let post: Post | undefined;
</script>

{#if post}
  <a href="/{post.relativeUrl}" class="read-next">
    <div class="left">
      <div class="label">Pjesa e radhës</div>
      <div class="title">{post.title}</div>
    </div>
    <div class="icon">
      <ArrowRightIcon />
    </div>
  </a>
{/if}

<style>
  .read-next {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--bg-secondary);
    padding: var(--spacing-xxl) var(--spacing-2xxl);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    margin-top: var(--spacing-2xxl);
    gap: 2rem;
  }
  .read-next .left {
    display: flex;
    flex-direction: column;
  }
  .read-next .left .label {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-family: var(--sans-serif);
    margin-bottom: var(--spacing-md);
  }

  .read-next .left .title {
    color: var(--text-primary);
    font-family: var(--serif);
    font-weight: 600;
    font-size: var(--text-lg2);
    line-height: 1.25;
  }

  .read-next .icon {
    --size: 28px;
  }
  .read-next:hover {
    background-color: var(--bg-selection);
    -webkit-transition: background-color 150ms ease-in;
    -ms-transition: background-color 150ms ease-in;
    transition: background-color 150ms ease-in;
  }

  .read-next:hover .icon {
    color: var(--text-primary);
  }
</style>
