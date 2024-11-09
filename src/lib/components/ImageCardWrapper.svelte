<script lang="ts">
  import type { ProgressState } from "$lib/types";

  interface Props {
    href?: string | undefined;
    progressState: ProgressState;
    children?: import('svelte').Snippet;
  }

  let { href = undefined, progressState, children }: Props = $props();

  const children_render = $derived(children);
</script>

{#if progressState !== "missing"}
  <a {href}>
    {@render children_render?.()}
  </a>
{:else}
  {@render children?.()}
{/if}
