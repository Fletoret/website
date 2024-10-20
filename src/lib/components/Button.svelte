<script lang="ts">
  import CheckIcon from "$lib/icons/CheckIcon.svelte";
  import { createEventDispatcher } from "svelte";

  export let text: string;
  export let hasIcon: boolean = false;
  export let size: string;
  export let variant: string = "default";

  const dispatch = createEventDispatcher();

  let clicked = false;
  const handleClick = () => {
    clicked = true;
    dispatch("click");
    setTimeout(() => {
      clicked = false;
    }, 1000);
  };
</script>

<button
  class="btn"
  class:btn-sm={size === "sm"}
  class:bordered={variant === "outline"}
  on:click={handleClick}
>
  {#if hasIcon}
    <div class="icon">
      {#if clicked}
        <CheckIcon />
      {:else}
        <slot />
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
