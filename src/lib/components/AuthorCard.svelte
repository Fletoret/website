<script lang="ts">
  import type { Author } from '$lib/types';

  interface Props {
    authorInfo: Author;
  }

  let { authorInfo }: Props = $props();
</script>

<div id="book-side-panel">
  <div class="card cover-glow" style="--glow-image: url({authorInfo?.thumbnail});">
    <img
      src={authorInfo?.thumbnail}
      alt="{authorInfo.name} profile"
      fetchpriority="high"
    />
    <div class="content">
      <h1 class="name">{authorInfo.name}</h1>
    </div>
  </div>

  <div class="book-details">
    <div class="intro">
      {authorInfo.description}
    </div>
  </div>
</div>

<style lang="scss">
  #book-side-panel {
    position: sticky;
    top: 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;

    .card {
      --width: 300px;
      --height: 400px;

      /* Fixed both ways: a couple of portraits are landscape (Faik Konica is
         300x257), and letting the image drive the height made those cards render
         short and out of step with the rest. `cover` crops a photo gracefully. */
      width: var(--width);
      height: var(--height);
      border-radius: var(--radius-xl);
      font-family: var(--serif-display);

      .content {
        position: absolute;
        bottom: 0px;
        padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-xxl)
          var(--spacing-xl);
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

        .name {
          margin: 0;
          font-weight: 400;
          font-size: var(--text-xl);
          line-height: 1.1;
        }
      }
    }
    .card img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
    }

    .book-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);

      .intro {
        color: var(--text-secondary);
        line-height: 1.5;
        font-size: var(--text-sm);
      }
    }
  }

  /* The glow is a mobile treatment: on desktop the card sits in a narrow sticky
     sidebar, where a halo would bleed into the column of book entries beside it. */
  @media (min-width: 901px) {
    #book-side-panel .card::before {
      display: none;
    }
  }

  @media (max-width: 900px) {
    #book-side-panel {
      max-width: 600px;
      position: relative;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 0 var(--spacing-lg);

      .card {
        --width: 200px;
        --height: 250px;

        /* Room for the halo to fall below the card before the intro text. */
        margin-bottom: var(--spacing-xl);

        .content {
          .name {
            font-size: var(--text-lg2);
          }
        }
      }
    }
  }

  /* Matches the scrim correction already made in ImageCard: at 60% height with a
     20% stop it was washing out the bottom third of the portrait on a card less
     than half the desktop width. */
  @media (max-width: 600px) {
    #book-side-panel .card .content {
      height: 50%;
      padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-xl)
        var(--spacing-lg);
      background: linear-gradient(
        to top,
        rgba(26, 20, 12, 0.85) 12%,
        rgba(26, 20, 12, 0)
      );
    }
  }
</style>
