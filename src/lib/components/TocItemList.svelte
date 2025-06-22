<script lang="ts">
  import NavRightIcon from '$lib/icons/NavRightIcon.svelte';
  import type { Post } from '$lib/types';
  import { fade } from 'svelte/transition';
  import JumpIcon from '../icons/JumpIcon.svelte';

  interface Props {
    chapterIdx: number;
    header: string;
    entries: Post[];
    showHeader?: boolean;
  }

  let { chapterIdx, header, entries, showHeader = true }: Props = $props();

  function numberToRomanNumeral(n: number) {
    if (n === 1) return 'I';
    if (n === 2) return 'II';
    if (n === 3) return 'III';
    if (n === 4) return 'IV';
    if (n === 5) return 'V';
    if (n === 6) return 'VI';
    if (n === 7) return 'VII';
    if (n === 8) return 'VIII';
    if (n === 9) return 'IX';
    if (n === 10) return 'X';
  }
</script>

<section class="toc">
  {#if showHeader}
    <div class="header">
      <div class="chapter-number">
        {numberToRomanNumeral(chapterIdx)}.
      </div>
      {header}
    </div>
  {/if}

  <div class="item-list" in:fade out:fade={{ duration: 150 }}>
    {#each entries as entry}
      <a class="item" href={`/${entry.relativeUrl}`} data-sveltekit-reload>
        <div class="icon">
          <JumpIcon />
        </div>
        <div class="entry-name">{entry.title}</div>
      </a>
    {/each}
  </div>
</section>

<style>
  .header {
    font-weight: 600;
    font-family: var(--serif-display);
    font-size: var(--text-lg);
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: var(--spacing-lg) var(--spacing-xl);
    margin-top: var(--spacing-xxl);
  }
  .header .chapter-number {
    color: var(--text-secondary);
    font-size: 90%;
    display: block;
    min-width: 22px;
    text-align: right;
  }

  .item-list {
    border-radius: var(--radius-xl);
    border: solid 1px var(--border-color);
  }
  .item-list .item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: var(--spacing-lg) var(--spacing-xl);
    border-top: solid 1px var(--border-color);
  }
  .icon {
    --size: 24px;
    width: var(--size);
    height: var(--size);
    display: flex;
    padding: var(--spacing-sm);
    border-radius: var(--radius-full);
    border: solid 1px var(--border-color);
    color: var(--text-secondary);
  }
  .item {
    text-decoration: none;
  }
  .item-list .entry-name {
    color: var(--text-primary);
    font-size: var(--text-md);
  }
  .item-list .item:hover {
    background-color: var(--bg-secondary);
  }
  .item:first-child {
    border-top: none !important;
  }
  .item:hover:first-child {
    border-top-right-radius: var(--radius-xl);
    border-top-left-radius: var(--radius-xl);
  }

  .item:hover:last-child {
    border-bottom-right-radius: var(--radius-xl);
    border-bottom-left-radius: var(--radius-xl);
  }

  .item-list .item:hover .icon {
    color: var(--text-primary);
    background-color: var(--bg-primary);
  }

  .item:last-child {
    border-bottom: none !important;
  }

  @media only screen and (min-width: 320px) and (max-width: 576px) {
    .header {
      padding: var(--spacing-lg) var(--spacing-lg);
    }

    .item-list .item {
      padding: var(--spacing-lg) var(--spacing-lg);
    }
    .item-list .item .icon {
      --size: 22px;
    }
  }
</style>
