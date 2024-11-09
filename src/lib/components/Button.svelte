<script lang="ts">
  import CheckIcon from "$lib/icons/CheckIcon.svelte";
  import { createEventDispatcher } from "svelte";

  interface Props {
    text: string;
    hasIcon?: boolean;
    size: string;
    variant?: string;
    children?: import('svelte').Snippet;
  }

  let {
    text,
    hasIcon = false,
    size,
    variant = "default",
    children
  }: Props = $props();

  const dispatch = createEventDispatcher();

  let clicked = $state(false);
  const handleClick = () => {
    clicked = true;
    dispatch("click");
    setTimeout(() => {
      clicked = false;
    }, 1000);
  };

  const children_render = $derived(children);
</script>

<button
  class="btn"
  class:btn-sm={size === "sm"}
  class:bordered={variant === "outline"}
  onclick={handleClick}
>
  {#if hasIcon}
    <div class="icon">
      {#if clicked}
        <CheckIcon />
      {:else}
        {@render children_render?.()}
      {/if}
    </div>
  {/if}

  <div>{text}</div>
</button>

<style>
  .bordered {
    border: solid 1px var(--border-color);
    background-color: transparent;
  }
  .bordered:hover {
    background-color: var(--bg-secondary);
  }
</style>
