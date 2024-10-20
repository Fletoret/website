<script lang="ts">
  import MoonIcon from '$lib/icons/MoonIcon.svelte';
  import SunIcon from '$lib/icons/SunIcon.svelte';
  import { chooseTheme, getAndLoadTheme } from '$lib/theme';
  export let borderBottom = true;

  let showTOC = false;
  let theme: string | undefined = getAndLoadTheme();

  function switchTheme() {
    if (theme === 'dark') {
      theme = 'light';
    } else if (theme === 'light') {
      theme = 'dark';
    } else {
      // system theme: do nothing
    }

    chooseTheme(theme);
  }
</script>

<header class:border-bottom={borderBottom}>
  <div id="header-content-wrapper">
    <div class="flex-align-center" style="gap: var(--spacing-lg);">
      <a href="/">Fletoret</a>
    </div>

    <div />

    <section class="nav-items">
      <a class="link" href="/blog">Blog</a>
      <button id="theme-icon" on:click={switchTheme}>
        <div class="icon">
          {#if theme === 'dark'}
            <SunIcon />
          {:else}
            <MoonIcon />
          {/if}
        </div>
      </button>
    </section>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    background: var(--bg-primary-glassy);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 2;
  }

  #header-content-wrapper {
    max-width: calc(min(90%, 1000px));
    margin: auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xl);
  }
  #header-content-wrapper a {
    font-family: var(--sans-serif-display);
    font-weight: 500;
    font-size: var(--text-lg2);
    color: var(--text-primary);
  }

  #header-content-wrapper a:hover {
    color: var(--link-primary);
  }

  .nav-items {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .nav-items .link {
    color: var(--text-secondary) !important;
    font-size: var(--text-md) !important;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
  }

  .nav-items .link:hover {
    color: var(--text-primary) !important;
    background-color: var(--bg-secondary);
  }

  /* #toc-header {
    position: absolute;
    top: 4rem;
    right: 1rem;
    max-height: 80vh;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: var(--bg-primary);
    border: solid 1px var(--border-color);
    padding: var(--spacing-xl) var(--spacing-lg);
    border-radius: var(--radius-lg);
    box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
  } */

  .icon {
    --size: 36px;
    width: var(--size);
    height: var(--size);
    display: flex;
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    background-color: var(--bg-primary);
  }
  .icon:hover {
    cursor: pointer;
    color: var(--color-text);
    background-color: var(--bg-secondary);
  }

  .border-bottom {
    border-bottom: solid 1px var(--border-color);
  }

  @media (max-width: 600px) {
    #header-content-wrapper {
      max-width: 100%;
      padding-left: var(--spacing-xxl);
      padding-right: var(--spacing-xxl);
    }
  }
</style>
