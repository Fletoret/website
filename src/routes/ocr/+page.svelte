<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import '$lib/css/app.css';

  let { data } = $props();
</script>

<svelte:head>
  <title>OCR — teksti i skanuar | Fletoret</title>
  <link rel="canonical" href="https://fletoret.com/ocr/" />
  <meta
    name="description"
    content="Librat e skanuar nga Biblioteka Kombëtare Dixhitale, përbri tekstit të gjeneruar automatikisht (OCR)."
  />
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<Header />

<main>
  <h1>Kopjuesi</h1>
  <p class="text-secondary">
    Faqet e skanuara nga Biblioteka Kombëtare Dixhitale, përbri tekstit të
    gjeneruar automatikisht. Zgjidhni një libër për ta lexuar dhe korrigjuar.
  </p>

  {#if data.books.length === 0}
    <p>Ende asnjë libër. Shtoni një me <code>data-pipeline/bksh.py</code>.</p>
  {:else}
    <ul>
      {#each data.books as book}
        <li>
          <a href="/ocr/{book.slug}/">{book.title}</a>
          <span class="text-secondary">
            {[book.author, book.year, book.pages ? `${book.pages} faqe` : '']
              .filter(Boolean)
              .join(' · ')}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 700px;
    padding: var(--spacing-xxl) 1rem;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: var(--spacing-md) 0;
    border-bottom: solid 1px var(--border-color);
  }
  li span {
    display: block;
    font-size: var(--text-sm);
  }
</style>
