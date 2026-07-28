<script lang="ts">
  import NavRightIcon from '$lib/icons/NavRightIcon.svelte';
  import { cubicInOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

  interface Props {
    question: string;
    answer: string;
  }

  let { question, answer }: Props = $props();

  let expanded: boolean = $state(false);
</script>

<div class="faq-item-wrapper" class:expanded>
  <div
    class="question"
    role="button"
    tabindex="0"
    aria-expanded={expanded}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        expanded = !expanded;
      }
    }}
    onclick={() => {
      expanded = !expanded;
    }}
  >
    <div>
      {question}
    </div>
    <div class="icon">
      <NavRightIcon />
    </div>
  </div>
  {#if expanded}
    <div
      class="answer"
      transition:slide={{
        duration: 150,
        delay: 0,
        easing: cubicInOut,
      }}
    >
      {@html answer}
    </div>
  {/if}
</div>

<style lang="scss">
  .icon {
    --size: 32px;
    transform: rotate(90deg);
  }
  .icon :global(svg) {
    stroke-width: 2px;
  }

  .expanded .icon {
    transform: rotate(-90deg);
  }

  .faq-item-wrapper {
    width: 100%;
  }
  /* Dividers between items only — a rule under the last one just fences the
     list off from the section that follows it. */
  .faq-item-wrapper:not(:last-child) {
    border-bottom: solid 1px var(--border-color);
  }
  .question {
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    font-weight: 600;
    letter-spacing: -0.011em;
    line-height: 1.4;
    padding: var(--spacing-xl) 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
    cursor: pointer;
  }
  .question:hover {
    color: var(--color-blue);
  }
  .question:hover .icon {
    color: var(--color-blue);
  }
  .question:focus-visible {
    outline: 2px solid var(--link-primary);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }
  .answer {
    color: var(--text-secondary);
    font-family: var(--sans-serif);
    font-size: var(--text-md);
    padding: var(--spacing-sm) 0 var(--spacing-xxl) 0;
    line-height: 1.6;
  }

  .answer :global(p) {
    margin: 0;
    margin-bottom: var(--spacing-md);
  }

  .answer :global(ol),
  .answer :global(ul) {
    margin: 0;
  }
  /* A hairline underline with breathing room reads lighter than the 2px border
     it replaces, and it no longer collides with descenders. */
  .answer :global(a) {
    color: var(--text-primary);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .answer :global(a:hover) {
    color: var(--link-primary);
    text-decoration-color: var(--link-primary);
  }

  @media (max-width: 600px) {
    /* Was 1.2rem/600 — heavier than the section heading above it. Keep the
       body size; 16px of padding still clears a 44px tap target. */
    .question {
      font-size: var(--text-md);
      padding: var(--spacing-xl) 0;
      gap: var(--spacing-lg);
    }

    .answer {
      font-size: var(--text-md);
    }
  }
</style>
