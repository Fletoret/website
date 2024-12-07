<script lang="ts">
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';

  import { toPng } from 'html-to-image';

  import Header from '$lib/components/Header.svelte';

  const palettes = {
    classic: {
      name: 'Lokja',
      bgColor: '#442025',
      bgColor0: '#30171a',
      textColorPrimary: '#f5a700',
    },
    light: {
      name: 'Drita',
      bgColor: '#f6deca',
      bgColor0: '#ceb7b7',
      textColorPrimary: '#827069',
    },
    green: {
      name: 'Liria',
      bgColor: '#3f5c46',
      bgColor0: '#1f2c23',
      textColorPrimary: '#cfcb6a',
    },
    coral: {
      name: 'Flaka',
      bgColor: '#6f1a1a',
      bgColor0: '#4b1717',
      textColorPrimary: '#cfcb6a',
    },
  };

  const fonts = {
    alegreyaSC: {
      name: 'Alegreya SC',
      value: '--alegreya-sc',
    },
    imFellEnglishSC: {
      name: 'IM Fell English SC',
      value: '--im-fell-english-sc',
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

  let bookTitle = $state('Titulli i librit');
  let bookSubtitle = $state('Një nëntitull ndoshta pak më përshkrues.');
  let author = $state('Autori');

  let palette = $state(palettes.classic);
  let font = $state(fonts.alegreyaSC);
  const bgColor = $derived(palette.bgColor);
  const bgColor0 = $derived(palette.bgColor0);
  const textColorPrimary = $derived(palette.textColorPrimary);

  async function downloadImage(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${bookTitle.replaceAll(' ', '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function domToImage() {
    const node = document.getElementById('book-cover');
    if (node) {
      const dataUrl = await toPng(node);
      await downloadImage(dataUrl);
    }
  }
</script>

<Header />

<main>
  <div
    id="book-cover"
    class="cover"
    style="background: linear-gradient(0deg, {bgColor0}, {bgColor})"
  >
    <div class="top">
      <div
        class="title"
        bind:innerText={bookTitle}
        style="color: {textColorPrimary}; font-family: var({font.value})"
        contenteditable
      ></div>
      <div
        class="subtitle"
        bind:innerText={bookSubtitle}
        style="color: {textColorPrimary}a3"
        contenteditable
      ></div>
    </div>
    <!-- <div class="divider"></div> -->
    <div class="center">
      <div
        class="author"
        bind:innerText={author}
        style="color: {textColorPrimary}; font-family: var({font.value})"
        contenteditable
      ></div>
    </div>
    <div class="bottom" style="color: {textColorPrimary}80">Fletoret</div>
  </div>

  <div class="editor">
    <div class="section">
      <div class="heading">Ngjyra</div>
      <div class="flex-row">
        {#each Object.entries(palettes) as [name, definitions]}
          <button
            class="palette"
            style="background: linear-gradient(0deg, {definitions.bgColor0}, {definitions.bgColor}); color: {definitions.textColorPrimary}"
            onclick={() => {
              palette = palettes[name];
            }}
          >
            {definitions.name}
          </button>
        {/each}
      </div>
    </div>
    <div class="section">
      <div class="heading">Tipografia</div>
      <div class="flex-column">
        {#each Object.entries(fonts) as [name, definition]}
          <button
            class="btn font"
            style="font-family: var({definition.value});"
            onclick={() => {
              font = fonts[name];
            }}
          >
            {definition.name}
          </button>
        {/each}
      </div>
    </div>

    <button class="btn" onclick={domToImage}>Ruaj ↓</button>
  </div>
</main>

<style lang="scss">
  /* 107 mm x 174 */
  main {
    width: 1000px;
    padding: 2rem 0;
    display: flex;
    gap: 2rem;
    margin: auto;
  }
  .btn {
    border: solid 2px transparent;
  }
  .btn:hover {
    border: solid 2px var(--border-color);
  }

  .cover {
    /* Dimensions of most common paperback format */
    height: 783px;
    width: 481.5px;
    padding: 10rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    text-align: center;
    border-radius: var(--radius-md);

    .title {
      font-size: 2.5rem;
      font-weight: 500;
    }
    .subtitle {
      font-size: 1rem;
    }
    .author {
      font-size: 2rem;
    }
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xxl);

    .btn {
      width: fit-content;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);

      .heading {
        font-size: var(--text-md);
        color: var(--text-secondary);
      }

      .flex-row {
        display: flex;
        flex-direction: row;
        gap: 1rem;

        .palette {
          cursor: pointer;
          padding: 1rem 2rem;
          border-radius: var(--radius-xl);
        }
      }

      .flex-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .font {
          background: none;
          border: solid 2px var(--border-color);
          font-size: var(--text-lg);
          width: 100%;
          padding: var(--spacing-xl);
        }

        .font:hover {
          background-color: var(--bg-secondary);
        }
      }
    }
  }
</style>
