<script lang="ts">
  import type { ProgressState } from "$lib/types";

  export let href: string | undefined = undefined;
  export let progressState: ProgressState;
</script>

{#if progressState !== "missing"}
  <a {href}>
    <slot />
  </a>
{:else}
  <slot />
{/if}
