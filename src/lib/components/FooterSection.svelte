<script lang="ts">
  interface Props {
    heading: string;
    content: string;
  }

  let { heading, content }: Props = $props();
</script>

<div class="f-section">
  <div class="heading">{heading}</div>
  <div class="content">{@html content}</div>
</div>

<style>
  .f-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: var(--text-sm);
    color: var(--color-gray-1);
  }
  .heading {
    font-weight: 600;
  }

  .f-section .content :global(emphasize) {
    color: var(--text-primary);
  }
</style>
