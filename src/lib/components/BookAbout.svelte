<script lang="ts">
  // A book's description on its profile page: the abstract, when it was
  // published, and who compiled or translated it. On a phone it is cut to a
  // few lines, with a toggle, so the chapters stay near the top of the page.
  import { languageInfo, languageOf } from '$lib/editions';
  import type { ExtendedBookType } from '$lib/types';

  interface Props {
    book: ExtendedBookType;
  }

  let { book }: Props = $props();

  let lang = $derived(languageOf(book));
  let open = $state(false);
  // Only offer the toggle when the text is actually cut off.
  let clamped = $state(false);
  let text: HTMLParagraphElement | undefined = $state();

  $effect(() => {
    if (!text) return;
    const measure = () => {
      clamped = !open && text!.scrollHeight > text!.clientHeight + 1;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => observer.disconnect();
  });
</script>

<div class="about" class:open>
  <p bind:this={text}>
    <span {lang}>{book.abstract} {languageInfo(lang).published(String(book.datePublished ?? ''))}</span>
    {#if book.compilerName}
      Mbledhur dhe kodifikuar nga <a href="/{book.compiledBy}/">{book.compilerName}</a>.
    {/if}
    {#if book.translatedBy}
      Përktheu {book.translatedBy}{book.translationNote ? ` (${book.translationNote})` : ''}.
    {/if}
  </p>
  {#if clamped || open}
    <button class="more" type="button" aria-expanded={open} onclick={() => (open = !open)}>
      {open ? 'Më pak' : 'Lexo më shumë'}
    </button>
  {/if}
</div>

<style>
  .about p {
    margin: 0;
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .more {
    display: none;
  }

  @media (max-width: 900px) {
    .about:not(.open) p {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
      line-clamp: 4;
      overflow: hidden;
    }

    .more {
      display: inline-block;
      margin-top: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border: none;
      background: none;
      font-family: var(--sans-serif);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
    }
  }
</style>
