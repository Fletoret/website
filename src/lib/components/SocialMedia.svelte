<script lang="ts">
  import Reddit from '$lib/icons/social/Reddit.svelte';
  import Twitter from '$lib/icons/social/Twitter.svelte';
  import GitHub from '$lib/icons/social/GitHub.svelte';
  import CONFIG from '$lib/config';
</script>

<div class="social-media-list">
  <a class="social-media" href={CONFIG.social.reddit.url}>
    <div class="icon">
      <Reddit />
    </div>
    <div>{CONFIG.social.reddit.handle}</div>
  </a>

  <a class="social-media" href={CONFIG.social.twitter.url}>
    <div class="icon">
      <Twitter />
    </div>
    <div>{CONFIG.social.twitter.handle}</div>
  </a>

  <a class="social-media" href={CONFIG.social.github.url}>
    <div class="icon">
      <GitHub />
    </div>
    <div>{CONFIG.social.github.handle}</div>
  </a>
</div>

<style lang="scss">
  .social-media-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);

    .social-media {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);

      .icon {
        --size: 24px;
        color: inherit;
      }

      &:hover {
        color: var(--text-primary);
      }
    }
  }
</style>
