<script>
  import FooterSection from './FooterSection.svelte';
  import CONFIG from '$lib/config';
  import SocialMedia from './SocialMedia.svelte';
</script>

<footer>
  <div class="footer-content-container">
    <FooterSection heading="Misioni" content={CONFIG.info.misioni} />

    <FooterSection
      heading="Të drejtat e autorit"
      content="Kjo vepër, sipas <emphasize>
        Ligjit Nr. 35/2016: Për të drejtat e autorit dhe të drejtat e tjera të
        lidhura me to</emphasize>, është tashmë pasuri publike."
    />

    <SocialMedia />
  </div>
</footer>

<style>
  footer {
    margin-top: 4rem;
    border-top: solid 1px var(--border-color);
    padding: calc(2 * var(--spacing-xxl)) var(--spacing-xxl);
  }

  .footer-content-container {
    color: var(--text-secondary);
    max-width: 900px;
    display: flex;
    gap: 2rem;
    margin: auto;
  }

  .footer-content-container > :global(div) {
    flex: 1;
    min-width: 200px;
  }

  @media (max-width: 900px) {
    .footer-content-container {
      flex-wrap: wrap;
    }
  }
</style>
