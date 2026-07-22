<script lang="ts">
  import { IconX } from '@tabler/icons-svelte';

  interface Props {
    noteId: string | null;
    html: string | undefined;
    onClose: () => void;
  }

  let { noteId, html, onClose }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && noteId) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if noteId}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="editor-note-overlay" onclick={onClose}></div>
  <div
    class="editor-note-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Shënimi i redaktorit nr. {noteId}"
  >
    <div class="panel-handle"></div>

    <div class="editor-note-header">
      <span class="editor-note-title">Shënimi {noteId}</span>
      <button class="close-btn" onclick={onClose} aria-label="Mbyll shënimin">
        <IconX size={18} />
      </button>
    </div>

    <div class="editor-note-body">
      {#if html}
        {@html html}
      {/if}
    </div>
  </div>
{/if}

<style>
  .editor-note-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 100;
    animation: editorNoteFadeIn 0.2s ease;
  }

  @keyframes editorNoteFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .editor-note-sheet {
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
    animation: editorNoteSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    max-width: 640px;
    max-height: 70vh;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  @keyframes editorNoteSlideUp {
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
    flex-shrink: 0;
  }

  .editor-note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    flex-shrink: 0;
  }

  .editor-note-title {
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

  .editor-note-body {
    overflow-y: auto;
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .editor-note-body :global(p) {
    margin: 0;
  }

  @media (max-width: 600px) {
    .editor-note-sheet {
      max-height: 80vh;
    }
  }
</style>
