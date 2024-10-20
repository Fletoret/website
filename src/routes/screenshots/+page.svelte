<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import '$lib/css/app.css';
</script>

<Header />
<div class="main">
  <div class="wrapper">
    <div
      class="quote contenteditable"
      contenteditable
      spellcheck="false"
      placeholder="Citimi"
    ></div>
    <div class="flex">
      <div
        class="author contenteditable"
        contenteditable
        spellcheck="false"
        placeholder="Vepra - Autori"
      ></div>
      <div class="logo">fletoret.com</div>
    </div>
  </div>
</div>

<style>
  .main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 90vh;
    gap: 1rem;
  }
  .wrapper {
    max-width: 700px;
    min-width: 700px;
  }
  .logo {
    color: var(--text-secondary);
    font-family: var(--sans-serif);
  }
  .flex {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
  }
  .quote {
    font-size: var(--text-lg);
    font-family: var(--serif);
    min-height: 200px;
    background-color: var(--bg-secondary);
  }

  .author {
    font-size: var(--text-md);
    color: var(--text-secondary);
    font-family: var(--sans-serif);
  }

  .contenteditable {
    padding: var(--spacing-xxl);
    border-radius: var(--radius-lg);
    line-height: 1.6;
    border: solid 1px transparent;
  }

  .contenteditable:empty::before {
    content: attr(placeholder);
    color: var(--text-secondary);
    opacity: 0.9;
  }

  .contenteditable:focus {
    background-color: var(--bg-secondary);
    outline: 0;
    border: solid 1px transparent;
  }

  .contenteditable:hover {
    outline: 0;
    border: solid 1px var(--border-color);
  }
</style>
