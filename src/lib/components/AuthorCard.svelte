<script lang="ts">
  import type { Author } from '$lib/types';

  export let authorInfo: Author;
</script>

<div id="book-side-panel">
  <div
    class="card-bg-glassy"
    style="background-image: url({authorInfo?.thumbnail});"
  ></div>

  <div class="card">
    <img
      src={authorInfo?.thumbnail}
      alt="{authorInfo.name} profile"
      loading="lazy"
    />
    <div class="content">
      <div class="name">{authorInfo.name}</div>
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

      position: relative;
      max-width: var(--width);
      min-width: var(--width);
      max-height: var(--height);
      border-radius: var(--radius-lg);
      font-family: var(--serif);

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
          font-size: var(--text-xl);
          line-height: 1.1;
        }
      }
    }
    .card img {
      display: block;
      width: 100%;
      max-width: 100%;
      border-radius: inherit;
      object-fit: cover;
      max-height: inherit;
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

  .card-bg-glassy {
    display: none;
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

        margin-bottom: var(--spacing-xl);

        .content {
          .name {
            font-size: var(--text-lg2);
          }
        }
      }
    }

    .card-bg-glassy {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 200px;
      filter: blur(75px) grayscale(0.5);

      /* background-repeat: no-repeat; */
      background-position: center;
      background-size: auto;
      background-size: contain;
    }
  }
</style>
