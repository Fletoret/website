<script lang="ts">
  export let data;

  import Header from '$lib/components/Header.svelte';
  import CopyIcon from '$lib/icons/CopyIcon.svelte';
  // import SaveIcon from '$lib/icons/SaveIcon.svelte';
  // import CheckIcon from '$lib/icons/CheckIconFilled.svelte';
  import Button from '$lib/components/Button.svelte';

  import '$lib/css/app.css';

  async function submitEdits(imgUrl: number, content: string) {
    const appScriptsURL =
      'https://script.google.com/macros/s/AKfycbwqZAJhCn40lpY9YJEH6SwV2dVRoZ0M6epuVuQHgIlPqjlmlqRBE7BXVQ_Eor6TVq-F/exec';

    if (imgUrl && content) {
      await fetch(`${appScriptsURL}?imgUrl=${imgUrl}&content=${content}`);
    }
  }

  async function copyTextToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  async function getEditedVersion(nodeID: string) {
    const node = document.getElementById(nodeID);
    if (node && node.textContent) {
      await copyTextToClipboard(node.innerText);
    }
  }
</script>

<Header />

<main>
  <div class="explanation flex">
    <div class="column text-center" style="max-width: 600px; width: 600px">
      Skanimi i faqes <br />
      <span class="text-secondary">(majtas)</span>
    </div>
    <div class="column text-center" style="max-width: 600px; width: 600px">
      <div>
        Teksti i gjeneruar automatikisht <br />
        <span class="text-secondary">(djathtas)</span>
      </div>
      <!-- <div style="text-align: left;">
        <p>
          Ky tekst ka gabime nga më të ndryshmet. Të shpeshta jane rastet kur:
        </p>
        <ul>
          <li>Germa <b>"d"</b> njihet si <b>"o"</b></li>
          <li>Germa <b>"j"</b> njihet si <b>"i"</b></li>
          <li>Mungon theksi mbi ndonje shkronjë, e.g. <b>e</b> - <b>ë</b></li>
          <li>... etj</li>
        </ul>
        <p>
          Qëllimi i kësaj hapësire eshte te lehtesojë punën fillestare të
          kopjimit, por teksti duhet lexuar dhe korrigjuar me shumë kujdes
          gjithsesi.
        </p>
      </div> -->
    </div>
  </div>

  {#each data.content as [imgurl, rows]}
    <div class="flex">
      <div class="column"><img src={imgurl} loading="lazy" alt="" /></div>
      <div class="column">
        <div class="content" contenteditable="true" id={imgurl}>
          {#each rows as [row, confidence]}
            {row}
            <br />
          {/each}
        </div>
        <div class="actions flex">
          <!-- <Button
            text="Ruaj"
            size="sm"
            hasIcon={true}
            variant="outline"
            on:click={() =>
              submitEdits(imgurl, rows.map((x) => x[0]).join("\n "))}
          >
            <SaveIcon />
          </Button> -->

          <Button
            text="Kopjo"
            size="sm"
            hasIcon={true}
            variant="outline"
            on:click={() => getEditedVersion(imgurl)}
          >
            <CopyIcon />
          </Button>
        </div>
      </div>
    </div>
  {/each}
</main>

<style>
  main {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 1400px;
  }
  .flex {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .row {
    display: flex;
    gap: 2rem;
  }
  .flex .column {
    padding: 1rem;
    width: calc(600px + 1rem);
    max-width: calc(600px + 1rem);
  }
  .explanation {
    background-color: var(--bg-secondary);
  }
  .flex .content {
    padding: var(--spacing-xxl) 3rem;
    font-family: var(--sans-serif);
    line-height: 1.5;
    font-size: var(--text-md);
    letter-spacing: -0.01em;
    border: solid 2px var(--border-color);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
  }
  /* .flex .confidence {
    color: var(--text-secondary);
    width: 30px;
    min-width: 30px;
    text-align: right;
    font-size: var(--text-sm);
    opacity: 0.5;
    user-select: none;
  } */
  img {
    max-width: 600px;
    width: 600px;
  }
  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: var(--spacing-xl);
  }
</style>
