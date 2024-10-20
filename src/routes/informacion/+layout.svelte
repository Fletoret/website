<script>
  import { getAndLoadTheme } from "$lib/theme";

  void getAndLoadTheme();

  import "$lib/css/app.css";
</script>

<main>
  <div class="entry">
    <slot />
  </div>
</main>

<style>
  main {
    padding: var(--spacing-xxl);
  }
  .entry {
    max-width: calc(min(90%, 800px));
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xxl);
    margin-left: auto;
    margin-right: auto;
  }
</style>
