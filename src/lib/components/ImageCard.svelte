<script lang="ts">
  import type { Author } from '$lib/types';
  import ImageCardWrapper from './ImageCardWrapper.svelte';

  interface Props {
    author: Author;
  }

  let { author }: Props = $props();
  let progressState = author.progressState || 'missing';
</script>

<ImageCardWrapper href="/{author.folder}" {progressState}>
  <div class="card" class:unavailable={progressState === 'missing'}>
    <div class="img-wrapper">
      <img
        src={author.thumbnail}
        alt="{author.name} foto profili"
        loading="lazy"
      />
    </div>
    <div class="content">
      <div class="name">{author.name}</div>
    </div>
  </div>
</ImageCardWrapper>

<style>
  .card {
    --width: 200px;
    --height: 240px;
    position: relative;
    max-width: var(--width);
    min-width: var(--width);
    max-height: var(--height);
    min-height: var(--height);
    border-radius: var(--radius-xl);
    cursor: pointer;
  }
  .card .img-wrapper {
    display: block;
    width: 100%;
    max-width: 100%;
    border-radius: inherit;
    object-fit: cover;
    max-height: inherit;
  }

  .img-wrapper {
    width: 300px;
    height: 300px;
    overflow: hidden;
  }

  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.3s ease;
  }

  .card:hover img {
    transform: scale(1.1);
  }

  .card .content {
    font-family: var(--sans-serif-display);
    position: absolute;
    bottom: 0px;
    padding: var(--spacing-xl);
    width: 100%;
    height: 60%;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
    background: linear-gradient(to top, #000000c4 20%, #00000000);
    display: flex;
    flex-direction: column;
    justify-content: end;
    color: #fff;
    gap: 0.5rem;
  }

  .card .content .name {
    font-family: var(--serif-display);
    font-size: var(--text-lg2);
    line-height: 1.1;
  }

  .unavailable {
    opacity: 0.2;
    /* filter: grayscale(); */
    cursor: default;
  }

  .card:hover :global(.label) {
    display: flex;
    color: white;
    font-size: 0.85rem;
    margin-left: var(--spacing-lg);
  }

  @media (max-width: 900px) {
    .card {
      --width: 160px;
      --height: 185px;
    }
  }
</style>
