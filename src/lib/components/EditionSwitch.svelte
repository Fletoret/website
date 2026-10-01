<script lang="ts">
  // Links between the language editions of one work (src/lib/editions.ts),
  // shown on a book's profile when it has more than one.
  import { languageInfo, type EditionLink } from '$lib/editions';

  interface Props {
    editions: EditionLink[];
    /** Folder of the edition being shown. */
    current: string;
  }

  let { editions, current }: Props = $props();
</script>

<nav class="editions" aria-label="Botimet në gjuhë të tjera">
  <span class="label">Lexoje në</span>
  <ul>
    {#each editions as edition}
      <li>
        <a
          href="/{edition.folder}/"
          hreflang={edition.inLanguage}
          lang={edition.inLanguage}
          aria-current={edition.folder === current ? 'page' : undefined}
          title={edition.name}
        >
          {languageInfo(edition.inLanguage).native}
          {#if edition.original}<span class="original" lang="sq"
              >origjinali</span
            >{/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style lang="scss">
  .editions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    font-family: var(--sans-serif);
    font-size: var(--text-sm);

    .label {
      color: var(--text-secondary);
    }

    ul {
      display: flex;
      margin: 0;
      padding: 0;
      list-style: none;
      border: solid 1px var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    li {
      flex: 1;
      display: flex;
    }

    li + li {
      border-left: solid 1px var(--border-color);
    }

    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--text-primary);
      text-decoration: none;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: color-mix(
          in srgb,
          var(--bg-secondary),
          var(--text-primary) 7%
        );
      }

      &[aria-current='page'] {
        background-color: var(--bg-secondary);
        font-weight: 600;
      }
    }

    .original {
      font-size: 0.85em;
      font-weight: 400;
      color: var(--text-secondary);
    }
  }
</style>
