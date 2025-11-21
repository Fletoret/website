<script lang="ts">
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';

  import { domToImage } from '$lib/utils';

  import Header from '$lib/components/Header.svelte';

  const themes = [
    { id: 'modern', name: 'Moderne' },
    { id: 'vintage', name: 'Vintage' },
  ];

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
    sepia: {
      name: 'Sepia',
      bgColor: '#e8dcc4',
      bgColor0: '#c4b098',
      textColorPrimary: '#3d2817',
    },
    parchment: {
      name: 'Pergamena',
      bgColor: '#f4ead5',
      bgColor0: '#d9cdb0',
      textColorPrimary: '#5c4a2f',
    },
    oldBook: {
      name: 'Libër i Vjetër',
      bgColor: '#8b7355',
      bgColor0: '#5c4a38',
      textColorPrimary: '#f5e6d3',
    },
    burgundy: {
      name: 'Vjollcë',
      bgColor: '#5c1a1a',
      bgColor0: '#3d1111',
      textColorPrimary: '#d4af37',
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

  let theme = $state('modern');
  let palette = $state(palettes.classic);
  let font = $state(fonts.alegreyaSC);
  const bgColor = $derived(palette.bgColor);
  const bgColor0 = $derived(palette.bgColor0);
  const textColorPrimary = $derived(palette.textColorPrimary);

  // Font size controls (in rem)
  let titleFontSize = $state(3.5);
  let subtitleFontSize = $state(0.95);
  let authorFontSize = $state(1.25);

  function handleImgSave() {
    const node = document.getElementById('book-cover');
    if (node) {
      domToImage(node, bookTitle);
    }
  }
</script>

<Header />

<main>
  <div
    id="book-cover"
    class="cover {theme === 'vintage' ? 'vintage-theme' : 'modern-theme'}"
    style="background: linear-gradient(0deg, {bgColor0}, {bgColor})"
  >
    {#if theme === 'vintage'}
      <!-- Vintage Theme Layout -->
      <div class="vintage-ornament-top" style="color: {textColorPrimary}">
        <svg viewBox="0 0 240 16" xmlns="http://www.w3.org/2000/svg">
          <!-- Minimal geometric pattern inspired by traditional Albanian textiles -->
          <line x1="20" y1="8" x2="60" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M70,8 L75,3 L80,8 L75,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="90" y1="8" x2="105" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M110,8 L115,3 L120,8 L115,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="130" y1="8" x2="145" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M150,8 L155,3 L160,8 L155,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="170" y1="8" x2="220" y2="8" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>

      <div class="vintage-content">
        <!-- Author at top -->
        <div class="vintage-author-section">
          <div
            class="author vintage-author"
            bind:innerText={author}
            style="color: {textColorPrimary}; font-family: var({font.value}); font-size: {authorFontSize}rem"
            contenteditable
          ></div>
        </div>

        <div class="vintage-spacer"></div>

        <!-- Title and subtitle in center -->
        <div class="vintage-title-section">
          <div
            class="title vintage-title"
            bind:innerText={bookTitle}
            style="color: {textColorPrimary}; font-family: var({font.value}); font-size: {titleFontSize}rem"
            contenteditable
          ></div>
          <div
            class="subtitle vintage-subtitle"
            bind:innerText={bookSubtitle}
            style="color: {textColorPrimary}cc; font-size: {subtitleFontSize}rem"
            contenteditable
          ></div>
        </div>

        <div class="vintage-spacer"></div>
      </div>

      <div class="vintage-ornament-bottom" style="color: {textColorPrimary}">
        <div class="vintage-publisher">Fletoret</div>

        <svg viewBox="0 0 240 16" xmlns="http://www.w3.org/2000/svg">
          <!-- Minimal geometric pattern inspired by traditional Albanian textiles -->
          <line x1="20" y1="8" x2="60" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M70,8 L75,3 L80,8 L75,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="90" y1="8" x2="105" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M110,8 L115,3 L120,8 L115,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="130" y1="8" x2="145" y2="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M150,8 L155,3 L160,8 L155,13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="170" y1="8" x2="220" y2="8" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
    {:else}
      <!-- Modern Theme Layout -->
      <div class="top">
        <div
          class="title"
          bind:innerText={bookTitle}
          style="color: {textColorPrimary}; font-family: var({font.value}); font-size: {titleFontSize}rem"
          contenteditable
        ></div>
        <div
          class="subtitle"
          bind:innerText={bookSubtitle}
          style="color: {textColorPrimary}a3; font-size: {subtitleFontSize}rem"
          contenteditable
        ></div>
      </div>
      <div class="center">
        <div
          class="author"
          bind:innerText={author}
          style="color: {textColorPrimary}; font-family: var({font.value}); font-size: {authorFontSize}rem"
          contenteditable
        ></div>
      </div>
      <div class="bottom" style="color: {textColorPrimary}80">Fletoret</div>
    {/if}
  </div>

  <div class="editor">
    <div class="section">
      <div class="heading">Tema</div>
      <div class="flex-row">
        {#each themes as themeOption}
          <button
            class="theme-btn"
            class:active={theme === themeOption.id}
            onclick={() => {
              theme = themeOption.id;
            }}
          >
            {themeOption.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="section">
      <div class="heading">Ngjyra</div>
      <div class="flex-row">
        {#each Object.entries(palettes) as [name, definitions]}
          <button
            class="palette"
            style="background: linear-gradient(0deg, {definitions.bgColor0}, {definitions.bgColor}); color: {definitions.textColorPrimary}"
            onclick={() => {
              palette = definitions;
            }}
          >
            {definitions.name}
          </button>
        {/each}
      </div>
    </div>
    <div class="section-row">
      <div class="section">
        <div class="heading">Tipografia</div>
        <div class="flex-column">
          {#each Object.entries(fonts) as [name, definition]}
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

      <div class="section">
        <div class="heading">Madhësia e Shkronjave</div>
        <div class="flex-column slider-group">
          <div class="slider-item">
            <label for="title-size">Titulli: {titleFontSize.toFixed(2)}rem</label>
            <input
              id="title-size"
              type="range"
              min="1"
              max="6"
              step="0.05"
              bind:value={titleFontSize}
              class="slider"
            />
          </div>
          <div class="slider-item">
            <label for="subtitle-size">Nëntitulli: {subtitleFontSize.toFixed(2)}rem</label>
            <input
              id="subtitle-size"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              bind:value={subtitleFontSize}
              class="slider"
            />
          </div>
          <div class="slider-item">
            <label for="author-size">Autori: {authorFontSize.toFixed(2)}rem</label>
            <input
              id="author-size"
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              bind:value={authorFontSize}
              class="slider"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="btn" onclick={handleImgSave}> ⤓ </button>
  </div>
</main>

<style lang="scss">
  /* 107 mm x 174 */
  main {
    width: 1400px;
    padding: 2rem 0;
    display: flex;
    gap: 2rem;
    margin: auto;
  }
  .btn {
    border: solid 2px transparent;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  .btn:hover {
    border: solid 2px var(--border-color);
  }

  .cover {
    /* Standard 6×9 inch paperback format */
    min-width: 500px;
    max-height: 750px;
    padding: 8rem 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    text-align: center;
    border-radius: var(--radius-md);

    .title {
      font-weight: 500;
      line-height: 1.2;
    }
    .subtitle {
      line-height: 1.5;
    }

    /* Vintage Theme Styles */
    &.vintage-theme {
      padding: 3.5rem 3.5rem;
      justify-content: flex-start;
      border: 8px double rgba(255, 255, 255, 0.1);

      .vintage-ornament-top,
      .vintage-ornament-bottom {
        opacity: 0.7;
        svg {
          width: 100%;
          height: 16px;
          opacity: 0.7;
        }
      }

      .vintage-ornament-bottom {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .vintage-publisher {
          opacity: 1;
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.6;
          margin-top: 0.5rem;
        }
      }

      .vintage-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-top: 2.5rem;
        margin-bottom: 2.5rem;
      }

      .vintage-author-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }

      .vintage-author {
        font-weight: 400;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        padding: 0;
      }

      .vintage-spacer {
        flex: 1;
        min-height: 1rem;
      }

      .vintage-title-section {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        align-items: center;
      }

      .vintage-title {
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .vintage-subtitle {
        font-style: italic;
        line-height: 1.5;
        max-width: 85%;
        margin: 0 auto;
        font-weight: 400;
        opacity: 0.9;
      }
    }
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xxl);

    .btn {
      width: fit-content;
    }

    .section-row {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      align-items: flex-start;

      .section {
        flex: 1;
      }
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
        flex-wrap: wrap;

        .palette {
          cursor: pointer;
          padding: 1rem 2rem;
          border-radius: var(--radius-xl);
        }

        .theme-btn {
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          color: var(--text-primary);
          font-size: var(--text-md);
          transition: all 0.2s ease;

          &:hover {
            background: var(--bg-tertiary);
            border-color: var(--text-secondary);
          }

          &.active {
            background: var(--accent-primary);
            color: white;
            border-color: var(--accent-primary);
          }
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

        &.slider-group {
          gap: 1.5rem;
        }
      }

      .slider-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .slider {
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: var(--bg-secondary);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;

          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--accent-primary);
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              transform: scale(1.2);
            }
          }

          &::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--accent-primary);
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;

            &:hover {
              transform: scale(1.2);
            }
          }

          &::-webkit-slider-runnable-track {
            height: 6px;
            border-radius: 5px;
            background: var(--bg-secondary);
          }

          &::-moz-range-track {
            height: 6px;
            border-radius: 5px;
            background: var(--bg-secondary);
          }
        }
      }
    }
  }
</style>
