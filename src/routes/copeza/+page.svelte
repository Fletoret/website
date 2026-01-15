<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';
  import { fade } from 'svelte/transition';

  import { domToImage } from '$lib/utils';
  import { fly } from 'svelte/transition';
  import { onMount, untrack } from 'svelte';
  let { data } = $props();
  let entry = $derived(data.entry);

  let visible = $state(false);

  function handleImgSave() {
    const node = document.getElementById('quote');
    const title = quote.split(' ').slice(0, 3).join(' ') + '...';
    if (node) {
      domToImage(node, `${author} - ${title}`);
    }
  }

  const fonts = {
    crimsonText: {
      name: 'Crimson Text',
      value: '--crimson-text',
    },
    alegreyaSC: {
      name: 'Alegreya SC',
      value: '--alegreya-sc',
    },
    inter: {
      name: 'Inter',
      value: '--inter',
    },
    charter: {
      name: 'Charter',
      value: '--charter',
    },
  };

  let quote: string = $state(untrack(() => entry.previewSnippet || ''));
  let author: string = $state(
    untrack(() => `${entry.title}, ${entry.grandparent || entry.parent}, ${entry.author} | fletoret.com`),
  );
  let font = $state(fonts.crimsonText);
  let fontSize = $state('23');
  let showControls = $state(false);

  onMount(() => {
    visible = true;
  });
</script>

<Header />
<div class="main">
  <div class="controls">
    {#if showControls}
      <div class="knobs" in:fly>
        <div class="fonts">
          <div class="flex-column">
            {#each Object.values(fonts) as definition}
              <button
                class="btn font"
                style="font-family: var({definition.value});"
                onclick={() => {
                  font = definition;
                }}
              >
                {definition.name}
              </button>
            {/each}
          </div>
        </div>
        <input
          type="range"
          min="10"
          max="70"
          class="slider"
          id="myRange"
          bind:value={fontSize}
        />
      </div>
      <button class="btn" type="button" onclick={() => (showControls = false)}>→</button>
    {:else}
      <button class="btn" type="button" onclick={() => (showControls = true)}>←</button>
    {/if}

    <button class="btn" onclick={handleImgSave}> ⤓ </button>
    <a href="/copeza" class="btn" data-sveltekit-reload>↻</a>
  </div>

  {#if visible}
    <div class="wrapper" id="quote" in:fade out:fade>
      <div
        class="quote contenteditable"
        contenteditable
        spellcheck="false"
        placeholder="Copëz"
        bind:innerText={quote}
        style="font-family: var({font.value}); font-size:{fontSize}px"
      ></div>
      <div class="flex" style="margin-top: var(--spacing-md);">
        <div
          class="author contenteditable"
          contenteditable
          spellcheck="false"
          placeholder="Vepra - Autori"
          bind:innerText={author}
        ></div>
        <!-- <div class="logo">{author} | fletoret.com</div> -->
      </div>
    </div>
  {/if}
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
    position: relative;

    .controls {
      position: absolute;
      top: var(--spacing-xxl);
      display: flex;
      gap: var(--spacing-md);
      width: 700px;
      max-width: 100%;
      justify-content: flex-end;

      .knobs {
        display: flex;
        gap: var(--spacing-md);
        margin-right: var(--spacing-xxl);
      }

      .fonts .flex-column {
        display: flex;
        gap: var(--spacing-md);
      }
    }
  }
  .wrapper {
    --padding: var(--spacing-xl);
    width: 100%;
    max-width: calc(700px + var(--padding));
    min-height: calc(393px + var(--padding));
    padding: var(--padding);
    background-color: var(--bg-primary);
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
    max-height: 70vh;
    overflow: auto;
    background-color: var(--bg-secondary);
  }

  .author {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    padding: var(--spacing-sm) var(--spacing-md) !important;
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

  @media (max-width: 900px) {
    .wrapper {
      --padding: var(--spacing-md);
    }
  }
</style>
