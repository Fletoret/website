<script lang="ts">
  import { IconX } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  let activeSrc = $state<string | null>(null);
  let activeAlt = $state('');

  function handleClick(e: MouseEvent) {
    // Only react to a plain left-click (ignore modifier/middle clicks).
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;

    const target = e.target as HTMLElement | null;
    const img = target?.closest('img');
    if (!img) return;

    // Leave linked images alone so the link keeps working.
    if (img.closest('a')) return;

    activeSrc = img.currentSrc || img.src;
    activeAlt = img.alt ?? '';
  }

  function close() {
    activeSrc = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  // Lock background scroll while the lightbox is open.
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeSrc ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="lightbox-scope" onclick={handleClick}>
  {@render children()}
</div>

{#if activeSrc}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="lightbox-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Imazhi në ekran të plotë"
    tabindex="-1"
    onclick={close}
  >
    <button class="lightbox-close" onclick={close} aria-label="Mbyll">
      <IconX size={22} />
    </button>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <img
      class="lightbox-img"
      src={activeSrc}
      alt={activeAlt}
      onclick={(e) => e.stopPropagation()}
    />
  </div>
{/if}

<style>
  /* Signal that in-content images are clickable. */
  .lightbox-scope :global(img) {
    cursor: zoom-in;
  }
  .lightbox-scope :global(a img) {
    cursor: pointer;
  }

  .lightbox-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    background-color: rgba(0, 0, 0, 0.85);
    cursor: zoom-out;
    animation: lightboxFadeIn 0.2s ease;
  }

  @keyframes lightboxFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .lightbox-img {
    max-width: 95vw;
    max-height: 92vh;
    object-fit: contain;
    border-radius: var(--radius-sm);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
    cursor: default;
  }

  .lightbox-close {
    position: fixed;
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: none;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      transform 0.15s ease;
  }

  .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.24);
    transform: scale(1.05);
  }

  .lightbox-close:active {
    transform: scale(0.95);
  }
</style>
