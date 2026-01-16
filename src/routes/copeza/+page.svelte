<script lang="ts">
  import '$lib/css/app.css';
  import '$lib/css/book-cover-fonts.css';
  import {
    IconRefresh,
    IconShare3,
    IconTypography,
    IconX,
    IconArrowRight,
    IconQuoteFilled,
    IconChevronUp,
    IconChevronDown,
    IconHome,
  } from '@tabler/icons-svelte';
  import MarkdownIt from 'markdown-it';

  import { domToImage } from '$lib/utils';
  import { onMount } from 'svelte';
  import slugify from 'slugify';

  const md = new MarkdownIt({
    html: true,
    breaks: true,
    typographer: true,
  });

  interface CopezaEntry {
    title: string;
    author: string;
    parent: string;
    grandparent: string;
    snippets: string[];
    url: string;
  }

  interface QuoteItem {
    id: number;
    quote: string;
    author: string;
    sourceUrl: string;
    quoteHtml: string;
  }

  let ready = $state(false);
  let entries: CopezaEntry[] = $state([]);
  let quoteStack: QuoteItem[] = $state([]);
  let currentIndex = $state(0);
  let containerEl: HTMLDivElement | null = $state(null);
  let isAnimating = $state(false);
  let showSwipeHint = $state(true);

  const BATCH_SIZE = 10;
  const BUFFER_AHEAD = 5; // Load more when this many quotes remain ahead
  let quoteIdCounter = 0;

  function generateQuote(): QuoteItem | null {
    if (entries.length === 0) return null;

    const entry = entries[Math.floor(Math.random() * entries.length)];
    const snippet =
      entry.snippets[Math.floor(Math.random() * entry.snippets.length)];

    return {
      id: quoteIdCounter++,
      quote: snippet,
      author: `${entry.title}, ${entry.grandparent || entry.parent}, ${entry.author}`,
      sourceUrl: entry.url,
      quoteHtml: md.render(snippet),
    };
  }

  function addMoreQuotes(count: number = BATCH_SIZE) {
    for (let i = 0; i < count; i++) {
      const quote = generateQuote();
      if (quote) {
        quoteStack.push(quote);
      }
    }
    quoteStack = [...quoteStack];
  }

  function fillStack() {
    // Initial fill
    addMoreQuotes(BATCH_SIZE);
  }

  function goToNext() {
    if (isAnimating) return;

    showSwipeHint = false;
    isAnimating = true;
    currentIndex++;

    // Preload more quotes as we approach the end (infinite scroll)
    const remainingAhead = quoteStack.length - 1 - currentIndex;
    if (remainingAhead < BUFFER_AHEAD) {
      addMoreQuotes(BATCH_SIZE);
    }

    setTimeout(() => {
      isAnimating = false;
    }, 400);
  }

  function goToPrev() {
    if (isAnimating || currentIndex <= 0) return;

    showSwipeHint = false;
    isAnimating = true;
    currentIndex--;

    setTimeout(() => {
      isAnimating = false;
    }, 400);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'j') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      goToPrev();
    }
  }

  // Touch handling for swipe
  let touchStartY = 0;
  let touchStartTime = 0;

  function handleTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  function handleTouchEnd(e: TouchEvent) {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    const deltaTime = Date.now() - touchStartTime;

    // Require a minimum swipe distance or velocity
    const minDistance = 50;
    const minVelocity = 0.3; // pixels per ms
    const velocity = Math.abs(deltaY) / deltaTime;

    if (Math.abs(deltaY) > minDistance || velocity > minVelocity) {
      if (deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  }

  // Wheel handling for desktop
  let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    if (wheelTimeout) return;

    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }

      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, 400);
    }
  }

  function handleImgSave() {
    const node = document.getElementById(`quote-card-${currentIndex}`);
    const current = quoteStack[currentIndex];
    if (node && current) {
      const title = current.quote.split(' ').slice(0, 5).join(' ');
      const author = current.author.split(',')[0]; // First part (book title)
      const filename = slugify(`${title} - ${author}`, {
        lower: true,
        strict: true,
      });
      domToImage(node, filename);
    }
  }

  const fonts = [
    { name: 'Crimson Text', value: '--crimson-text' },
    { name: 'Alegreya SC', value: '--alegreya-sc' },
    { name: 'Inter', value: '--inter' },
    { name: 'Charter', value: '--charter' },
  ];

  let selectedFont = $state(fonts[0]);
  let fontSize = $state(22);
  let showFontPanel = $state(false);

  let currentQuote = $derived(quoteStack[currentIndex]);

  onMount(async () => {
    const res = await fetch('/api/copeza.json');
    entries = await res.json();

    fillStack();

    await new Promise((r) => setTimeout(r, 50));
    ready = true;

    // Hide swipe hint after a few seconds
    setTimeout(() => {
      showSwipeHint = false;
    }, 4000);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="feed-container"
  class:ready
  bind:this={containerEl}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  onwheel={handleWheel}
  role="region"
  aria-label="Copeza - Literary quotes feed"
  aria-live="polite"
>
  <!-- Quote cards stack -->
  <div class="cards-viewport">
    {#each quoteStack as item, index (item.id)}
      {@const offset = index - currentIndex}
      {@const isVisible = Math.abs(offset) <= 1}
      {#if isVisible}
        <div
          class="quote-card"
          class:active={offset === 0}
          class:prev={offset === -1}
          class:next={offset === 1}
          id="quote-card-{index}"
          style="--offset: {offset}"
        >
          <div class="quote-content">
            <div class="quote-mark"><IconQuoteFilled size={72} /></div>
            <div
              class="quote-text prose"
              style="font-family: var({selectedFont.value}); font-size: {fontSize}px"
            >
              {@html item.quoteHtml}
            </div>
            <div class="quote-attribution">
              <div class="quote-author">{item.author}</div>
              {#if item.sourceUrl}
                <a
                  href="/{item.sourceUrl}"
                  class="source-link"
                  title="Lexo të plotë"
                >
                  <IconArrowRight size={18} />
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Swipe hint overlay -->
  {#if showSwipeHint && ready}
    <div class="swipe-hint">
      <div class="swipe-hint-content">
        <IconChevronUp size={24} />
      </div>
    </div>
  {/if}

  <!-- Progress indicator -->
  <div class="progress-indicator">
    <span class="progress-current">{currentIndex + 1}</span>
  </div>

  <!-- Side action buttons (TikTok style) -->
  <div class="side-actions" class:ready>
    <a href="/" class="action-btn" title="Kthehu në faqen kryesore">
      <IconHome size={24} />
    </a>

    <button
      class="action-btn"
      onclick={goToPrev}
      disabled={currentIndex === 0}
      title="Mëparshme"
    >
      <IconChevronUp size={24} />
    </button>

    <button class="action-btn" onclick={goToNext} title="Tjetra">
      <IconChevronDown size={24} />
    </button>

    <div class="action-divider"></div>
    <button class="action-btn" onclick={handleImgSave} title="Shpërnda">
      <IconShare3 size={22} />
    </button>

    <button
      class="action-btn"
      class:active={showFontPanel}
      onclick={() => (showFontPanel = !showFontPanel)}
      title="Fonti dhe madhësia"
    >
      <IconTypography size={22} />
    </button>
  </div>

  <!-- Navigation hints for desktop -->
  <div class="nav-hints" class:ready>
    <div class="nav-hint">
      <kbd>↑</kbd> <kbd>↓</kbd> ose rrëshqit
    </div>
  </div>
</div>

<!-- Typography panel -->
{#if showFontPanel}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="font-panel-overlay" onclick={() => (showFontPanel = false)}></div>
  <div class="font-panel">
    <!-- Drag handle for mobile -->
    <div class="panel-handle"></div>

    <div class="font-panel-header">
      <span class="font-panel-title">Tipografia</span>
      <button
        class="close-btn"
        onclick={() => (showFontPanel = false)}
        aria-label="Mbyll panelin"
      >
        <IconX size={18} />
      </button>
    </div>

    <!-- Live preview -->
    <div
      class="typography-preview"
      style="font-family: var({selectedFont.value}); font-size: {fontSize}px"
    >
      Një shembull teksti
    </div>

    <!-- Font selection -->
    <div class="section-label">Fonti</div>
    <div class="font-list">
      {#each fonts as fontOption}
        <button
          class="font-option"
          class:selected={selectedFont.value === fontOption.value}
          onclick={() => {
            selectedFont = fontOption;
          }}
          aria-pressed={selectedFont.value === fontOption.value}
        >
          <span
            class="font-preview"
            style="font-family: var({fontOption.value});">Aa</span
          >
          <span class="font-name">{fontOption.name}</span>
          {#if selectedFont.value === fontOption.value}
            <span class="font-check">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Size control -->
    <div class="section-label">Madhësia</div>
    <div class="size-control">
      <button
        class="size-preset"
        class:active={fontSize <= 18}
        onclick={() => (fontSize = 18)}
        aria-label="Madhësi e vogël"
      >
        <span class="size-letter small">A</span>
      </button>

      <div class="size-slider-container">
        <input
          type="range"
          min="16"
          max="32"
          step="1"
          class="size-slider"
          bind:value={fontSize}
          aria-label="Madhësia e fontit"
        />
        <div class="size-track">
          <div
            class="size-track-fill"
            style="width: {((fontSize - 16) / 16) * 100}%"
          ></div>
        </div>
      </div>

      <button
        class="size-preset"
        class:active={fontSize >= 28}
        onclick={() => (fontSize = 28)}
        aria-label="Madhësi e madhe"
      >
        <span class="size-letter large">A</span>
      </button>
    </div>

    <div class="size-value-display">{fontSize}px</div>
  </div>
{/if}

<style>
  .feed-container {
    position: fixed;
    inset: 0;
    background-color: var(--bg-primary);
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.4s ease;
    outline: none;
  }

  .feed-container.ready {
    opacity: 1;
  }

  .cards-viewport {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quote-card {
    position: absolute;
    width: calc(100% - 80px);
    max-width: 500px;
    max-height: calc(100vh - 120px);
    padding: var(--spacing-xxl);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.4s ease;
  }

  .quote-card.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
    z-index: 2;
  }

  .quote-card.prev {
    opacity: 0;
    transform: translateY(-100vh) scale(0.9);
    z-index: 1;
  }

  .quote-card.next {
    opacity: 0;
    transform: translateY(100vh) scale(0.9);
    z-index: 1;
  }

  .quote-content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .quote-mark {
    position: absolute;
    top: -8px;
    right: -8px;
    color: var(--text-primary);
    opacity: 0.05;
    pointer-events: none;
    user-select: none;
    transform: scaleX(-1);
  }

  .quote-text {
    font-family: var(--serif);
    line-height: 1.7;
    max-height: 50vh;
    overflow: hidden;
  }

  .quote-text.prose :global(p) {
    margin: 0 0 0.75em 0;
  }

  .quote-text.prose :global(p:last-child) {
    margin-bottom: 0;
  }

  .quote-text.prose :global(em) {
    font-style: italic;
  }

  .quote-text.prose :global(strong) {
    font-weight: 600;
  }

  .quote-text.prose :global(blockquote) {
    margin: 0.5em 0;
    padding-left: 1em;
    border-left: 2px solid var(--border-color);
    font-style: italic;
  }

  .quote-attribution {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .quote-author {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    line-height: 1.4;
    flex: 1;
  }

  .source-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    text-decoration: none;
    flex-shrink: 0;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      transform 0.15s ease;
  }

  .source-link:hover {
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    transform: scale(1.05);
  }

  /* Side action buttons */
  .side-actions {
    position: fixed;
    right: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  }

  .side-actions.ready {
    opacity: 1;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      transform 0.15s ease;
    text-decoration: none;
  }

  .action-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-primary);
    transform: scale(1.05);
  }

  .action-btn.active {
    color: var(--text-primary);
    background-color: var(--bg-primary);
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
  }

  .action-divider {
    width: 24px;
    height: 1px;
    background-color: var(--border-color);
    margin: var(--spacing-sm) auto;
  }

  /* Progress indicator */
  .progress-indicator {
    position: fixed;
    top: var(--spacing-xl);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    font-variant-numeric: tabular-nums;
    background-color: var(--bg-secondary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    z-index: 10;
  }

  .progress-current {
    font-weight: 500;
    color: var(--text-primary);
  }

  /* Swipe hint */
  .swipe-hint {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    animation: swipeHintPulse 2s ease-in-out infinite;
    z-index: 5;
  }

  .swipe-hint-content {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
  }

  @keyframes swipeHintPulse {
    0%,
    100% {
      opacity: 0.7;
      transform: translateX(-50%) translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateX(-50%) translateY(-8px);
    }
  }

  /* Nav hints for desktop */
  .nav-hints {
    position: fixed;
    bottom: var(--spacing-xl);
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 5;
  }

  .nav-hints.ready {
    opacity: 1;
  }

  .nav-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    background-color: var(--bg-secondary);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  .nav-hint kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 var(--spacing-sm);
    font-size: 13px;
    font-family: var(--sans-serif);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  /* Typography panel */
  .font-panel-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 100;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .font-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md) var(--spacing-xl) var(--spacing-xl);
    padding-bottom: calc(var(--spacing-xl) + env(safe-area-inset-bottom, 0px));
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    border-radius: 20px 20px 0 0;
    z-index: 101;
    animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    max-width: 480px;
    margin: 0 auto;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .panel-handle {
    width: 36px;
    height: 5px;
    background-color: var(--border-color);
    border-radius: 3px;
    margin: 0 auto var(--spacing-md);
  }

  .font-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
  }

  .font-panel-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    background: var(--bg-primary);
    border: none;
    cursor: pointer;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      transform 0.15s ease;
  }

  .close-btn:hover {
    color: var(--text-primary);
    transform: scale(1.05);
  }

  .close-btn:active {
    transform: scale(0.95);
  }

  /* Live preview */
  .typography-preview {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xxl);
    line-height: 1.5;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      font-family 0.2s ease,
      font-size 0.15s ease;
  }

  /* Section labels */
  .section-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-sm);
  }

  /* Font list */
  .font-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xxl);
  }

  .font-option {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    width: inherit;
    padding: var(--spacing-md) var(--spacing-sm);
    text-align: center;
    color: var(--text-primary);
    background: var(--bg-primary);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.2s ease,
      transform 0.15s ease,
      box-shadow 0.2s ease;
  }

  .font-option:hover {
    border-color: var(--border-color);
    transform: translateY(-1px);
  }

  .font-option:active {
    transform: translateY(0);
  }

  .font-option.selected {
    border-color: var(--text-primary);
    background: var(--bg-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .font-preview {
    font-size: 28px;
    line-height: 1;
    color: var(--text-primary);
    transition: transform 0.2s ease;
  }

  .font-option:hover .font-preview {
    transform: scale(1.05);
  }

  .font-option.selected .font-preview {
    transform: scale(1.1);
  }

  .font-name {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    transition: color 0.15s ease;
  }

  .font-option.selected .font-name {
    color: var(--text-primary);
    font-weight: 500;
  }

  .font-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--text-primary);
    color: var(--bg-primary);
    border-radius: var(--radius-full);
    animation: checkPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes checkPop {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Size control */
  .size-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  .size-preset {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      transform 0.15s ease;
  }

  .size-preset:hover {
    border-color: var(--text-secondary);
    transform: scale(1.05);
  }

  .size-preset:active {
    transform: scale(0.95);
  }

  .size-preset.active {
    border-color: var(--text-primary);
    background: var(--text-primary);
  }

  .size-preset.active .size-letter {
    color: var(--bg-primary);
  }

  .size-letter {
    font-family: var(--serif);
    font-weight: 500;
    color: var(--text-primary);
    transition: color 0.15s ease;
  }

  .size-letter.small {
    font-size: 14px;
  }

  .size-letter.large {
    font-size: 22px;
  }

  .size-slider-container {
    flex: 1;
    position: relative;
    height: 40px;
    display: flex;
    align-items: center;
  }

  .size-slider {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
    margin: 0;
  }

  .size-track {
    position: absolute;
    left: 0;
    right: 0;
    height: 6px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    overflow: hidden;
  }

  .size-track-fill {
    height: 100%;
    background: var(--text-primary);
    border-radius: 3px;
    transition: width 0.1s ease;
  }

  .size-slider:focus-visible + .size-track {
    outline: 2px solid var(--text-primary);
    outline-offset: 2px;
  }

  .size-value-display {
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    font-family: var(--sans-serif);
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .quote-card {
      width: calc(100% - 72px);
      max-width: none;
      max-height: calc(100vh - 180px);
      padding: var(--spacing-xl);
      margin-right: 48px;
      border: 1px solid var(--border-color);
    }

    .cards-viewport {
      align-items: center;
      justify-content: center;
    }

    .side-actions {
      right: var(--spacing-sm);
      gap: 2px;
    }

    .action-btn {
      width: 42px;
      height: 42px;
    }

    .action-divider {
      margin: 2px auto;
    }

    .quote-mark {
      top: -4px;
      right: -4px;
    }

    .quote-mark :global(svg) {
      width: 48px;
      height: 48px;
    }

    .quote-text {
      font-size: 20px !important;
      max-height: 50vh;
    }

    .nav-hints {
      display: none;
    }

    .progress-indicator {
      top: var(--spacing-lg);
    }

    .font-panel {
      padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
      padding-bottom: calc(
        var(--spacing-lg) + env(safe-area-inset-bottom, 0px)
      );
      border-radius: 16px 16px 0 0;
    }

    .typography-preview {
      padding: var(--spacing-md);
      min-height: 52px;
    }

    .font-preview {
      font-size: 24px;
    }

    .size-preset {
      width: 36px;
      height: 36px;
    }
  }

  /* Large screens */
  @media (min-width: 1024px) {
    .quote-card {
      max-width: 560px;
      padding: var(--spacing-2xxl);
    }

    .side-actions {
      right: var(--spacing-xxl);
    }

    .action-btn {
      width: 52px;
      height: 52px;
    }
  }

  /* Safe area for notched devices */
  @supports (padding: env(safe-area-inset-bottom)) {
    .side-actions {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
