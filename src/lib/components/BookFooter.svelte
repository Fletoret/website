<script>
  import CONFIG from '$lib/config';
  import SocialMedia from './SocialMedia.svelte';

  const year = new Date().getFullYear();
</script>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="wordmark" aria-label={CONFIG.info.title}>
          {CONFIG.info.title}
        </a>
        <p class="tagline">
          Vepra letrare në shqip — të plota, falas, në domenin publik.
        </p>
      </div>

      <SocialMedia />
    </div>

    <p class="legal">
      © {year} {CONFIG.info.title} · Vepra në domenin publik sipas Ligjit Nr.
      35/2016. Përmbajtja mund të përdoret lirisht, mjafton të citohet
      fletoret.com.
    </p>
  </div>
</footer>

<style>
  footer {
    margin-top: var(--spacing-3xxl);
    border-top: solid 1px var(--border-color);
    background-color: var(--bg-secondary);
    padding: var(--spacing-2xxl) var(--spacing-xxl);
  }

  .footer-inner {
    max-width: 720px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xxl);
    color: var(--text-secondary);
  }

  .footer-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-2xxl);
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    max-width: 24rem;
  }

  .wordmark {
    font-family: var(--serif-display);
    font-size: var(--text-xl);
    line-height: 1;
    color: var(--text-primary);
    text-decoration: none;
  }

  .wordmark:hover {
    color: var(--link-primary);
  }

  .tagline {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .legal {
    margin: 0;
    max-width: 42rem;
    padding-top: var(--spacing-xl);
    border-top: solid 1px var(--border-color);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .footer-top {
      flex-direction: column;
      gap: var(--spacing-xl);
    }
  }
</style>
