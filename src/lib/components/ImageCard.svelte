<script lang="ts">
  import type { Author } from '$lib/types';
  import ImageCardWrapper from './ImageCardWrapper.svelte';

  interface Props {
    author: Author;
  }

  let { author }: Props = $props();
  let progressState = $derived(author.progressState || 'missing');
</script>

<ImageCardWrapper href="/{author.folder}/" {progressState}>
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
    background: linear-gradient(to top, rgba(26, 20, 12, 0.82) 18%, rgba(26, 20, 12, 0));
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

  /* Narrow screens: cards fill their grid cell instead of a fixed width,
     so the 2-column layout keeps even gutters and scales with the viewport. */
  @media (max-width: 600px) {
    .card {
      min-width: 0;
      max-width: 100%;
      min-height: 0;
      max-height: none;
      width: 100%;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }
    .card .img-wrapper,
    .img-wrapper {
      width: 100%;
      height: 100%;
      max-height: none;
    }
    /* A shorter, denser scrim: at 60% it was washing out the portraits in a
       card less than half the desktop width. */
    .card .content {
      padding: var(--spacing-lg);
      height: 50%;
      background: linear-gradient(
        to top,
        rgba(26, 20, 12, 0.85) 12%,
        rgba(26, 20, 12, 0)
      );
    }
    /* Cards are ~18% narrower here than the 200px desktop card, so the name
       scales with them instead of taking 80% of the content box. */
    .card .content .name {
      font-size: var(--text-lg);
      letter-spacing: -0.01em;
    }
    /* 0.2 read as a rendering fault rather than "not published yet". */
    .unavailable {
      opacity: 0.4;
    }
  }
</style>
