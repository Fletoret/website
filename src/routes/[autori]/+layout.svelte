<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<Header />

{@render children?.()}
