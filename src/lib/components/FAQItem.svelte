<script lang="ts">
  import NavRightIcon from "$lib/icons/NavRightIcon.svelte";
  import { cubicInOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  export let question: string;
  export let answer: string;

  let expanded: boolean = false;
</script>

<div class="faq-item-wrapper" class:expanded>
  <div
    class="question"
    role="button"
    tabindex="0"
    on:keydown={(e) => {
      if (e.key === "Enter") {
        expanded = !expanded;
      }
    }}
    on:click={() => {
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
    border-bottom: solid 2px var(--border-color);
  }
  .question {
    font-size: var(--text-lg2);
    font-weight: 500;
    padding: var(--spacing-lg) 0;
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
  .answer {
    color: var(--text-secondary);
    font-size: var(--text-md);
    padding: var(--spacing-lg) 0 var(--spacing-xxl) 0;
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
  .answer :global(a) {
    color: var(--text-primary);
    border-bottom: solid 2px var(--text-primary);
  }

  .answer :global(a:hover) {
    color: var(--link-primary);
    border-bottom: solid 2px var(--link-primary);
  }

  @media (max-width: 600px) {
    .question {
      font-size: var(--text-lg);
    }

    .answer {
      font-size: var(--text-md);
    }
  }
</style>
