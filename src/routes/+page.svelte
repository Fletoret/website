<script lang="ts">
  import FaqItem from '$lib/components/FAQItem.svelte';
  import Header from '$lib/components/Header.svelte';
  import ImageCard from '$lib/components/ImageCard.svelte';
  import '$lib/css/app.css';

  // import JumpIcon from "$lib/icons/JumpIcon.svelte";
  // import PeopleIcon from "$lib/icons/PeopleIcon.svelte";
  import { getAndLoadTheme } from '$lib/theme';
  import CONFIG from '$lib/config';
  import SocialMedia from '$lib/components/SocialMedia.svelte';

  void getAndLoadTheme();

  let { data } = $props();

  const year = new Date().getFullYear();

  let faqSchema = $derived({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqEntries.map((faq) => ({
      '@type': 'Question',
      name: faq.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });
</script>

<svelte:head>
  <title>{CONFIG.info.serp_title}</title>
  <meta name="description" content={CONFIG.info.misioni} />
  <meta name="author" content="Fletoret.com" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- OG params for sharable content -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={CONFIG.info.title} />
  <meta property="og:description" content={CONFIG.info.misioni} />
  <meta property="og:site_name" content={CONFIG.info.title} />
  <meta property="og:locale" content="sq_AL" />
  <meta property="og:url" content="https://fletoret.com/" />
  <meta
    property="og:image"
    content="https://fletoret.com/favicon/android-chrome-512x512.png"
  />
  <meta property="og:image:alt" content="Fletoret" />

  <meta
    name="keywords"
    content="fletoret, migjeni, fishta, fan noli, faik konica, leke dukagjini, sami frasheri, naim frasheri, veprat e plota, novelat e qytetit te veriut, vargjet e lira, fan noli albumi, kanuni lek dukagjinit, kanuni i leke dukagjinit, kanuni i malësisë, kanuni i maleve, kanuni i veriut, mrizi i zanave, gomari i babatasit, shqiperia cka qene, biblioteka dixhitale, libra shqip, letërsi shqipe, autorë shqiptarë, poezi shqip, prozë shqip, klasikë shqiptarë, digjitalizim, open source, kulturë shqiptare, histori shqiptare"
  />

  <!-- Canonical -->
  <link rel="canonical" href="https://fletoret.com/" />
  <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
  <link
    rel="icon"
    type="image/png"
    href="/favicon/android-chrome-192x192.png"
    sizes="192x192"
  />
  <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />

  <!-- Alternate language (if available) -->
  <!-- <link rel="alternate" hreflang="en" href="https://fletoret.com/en" /> -->

  <!--twitter important OG data-->
  <meta name="twitter:title" content={CONFIG.info.title} />
  <meta name="twitter:description" content={CONFIG.info.description} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@FletoretSQ" />
  <meta
    name="twitter:image"
    content="https://fletoret.com/favicon/android-chrome-512x512.png"
  />

  <!-- FAQ structured data -->
  {@html `<script type="application/ld+json"> ${JSON.stringify(faqSchema)} </script>`}
</svelte:head>

<Header borderBottom={false} bgSecondary={false} />

<main>
  <section class="hero">
    <div class="hero-content container">
      <p class="eyebrow">Vepra në domenin publik</p>
      <h1 class="title">{CONFIG.info.title}</h1>
      <p class="lede">
        {CONFIG.info.misioni}
      </p>
    </div>
  </section>

  <section class="authors-wrapper">
    <div class="container-lg panel">
      <div class="block-heading">
        <p class="eyebrow">Shkrimtarë</p>
        <!-- nbsp keeps the em dash from starting a line when the lead wraps. -->
        <p class="section-lead">
          Katalogu ynë i shkrimtarëve&nbsp;— në rritje e sipër.
        </p>
      </div>

      <div class="authors flex-align-center">
        {#each data.authorsIndex as [_, author]}
          <ImageCard {author} />
        {/each}
      </div>
    </div>
  </section>

  <section class="faq-section">
    <div class="container">
      <div class="block-heading">
        <p class="eyebrow">Pyetje &amp; Përgjigje</p>
        <p class="section-lead">Çfarë duhet të dini para se të nisni.</p>
      </div>
      <div class="faq-list">
        {#each data.faqEntries as faq}
          <FaqItem question={faq.title} answer={faq.answer} />
        {/each}
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="wordmark" aria-label={CONFIG.info.title}>
          {CONFIG.info.title}
        </a>
        <p class="tagline">
          Vepra letrare në shqip&nbsp;— të plota, falas, në domenin publik.
        </p>
      </div>
      <div class="footer-right">
        <nav class="links" aria-label="Lidhje">
          <a href="/kopertina" class="muted">→ Krijo kopertina</a>
          <a href="/copeza" class="muted">→ Copëza</a>
        </nav>
        <SocialMedia />
      </div>
    </div>
    <p class="legal">
      © {year}
      {CONFIG.info.title}. Përmbajtja mund të përdoret lirisht, mjafton të
      citohet fletoret.com.
    </p>
  </div>
</footer>

<style>
  /* One knob for the page's vertical rhythm and one for its side gutter, so the
     cadence stays identical across sections at every breakpoint. Declared on
     both roots because the footer lives outside <main>. */
  main,
  .footer {
    --section-y: var(--spacing-3xxl);
    --gutter: calc(2 * var(--spacing-xxl));
  }

  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
  }

  section {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: var(--section-y) 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    padding: 0 var(--gutter);
  }

  /* ---------- Hero ---------- */
  .hero {
    min-height: 52vh;
    padding-top: var(--spacing-2xxl);
    padding-bottom: var(--spacing-2xxl);
  }
  .hero-content {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    margin: auto;
  }
  .eyebrow {
    font-family: var(--sans-serif);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: var(--text-sm);
    font-weight: 600;
    /* Terracotta rather than amber: one accent across the page, and it clears
       AA on the warm-white background at this size. */
    color: var(--link-primary);
    margin: 0 0 var(--spacing-md);
  }
  .title {
    color: var(--text-primary);
    font-family: var(--serif-display);
    font-size: clamp(3.75rem, 11vw, 6.25rem);
    font-weight: 400;
    line-height: 0.92;
    letter-spacing: -0.035em;
    margin: 0;
  }
  .lede {
    font-family: var(--serif);
    font-size: var(--text-lg2);
    line-height: 1.55;
    font-weight: 420;
    max-width: 32rem;
    margin: var(--spacing-xl) auto 0;
    color: var(--text-secondary);
    letter-spacing: -0.01em;
    text-wrap: balance;
  }

  /* ---------- Shared section heading ---------- */
  .block-heading {
    text-align: center;
    margin-bottom: var(--spacing-2xxl);
  }
  .block-heading .eyebrow {
    margin-bottom: var(--spacing-sm);
  }
  .section-lead {
    font-family: var(--serif);
    font-size: var(--text-lg);
    font-weight: 420;
    letter-spacing: -0.01em;
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0 auto;
    max-width: 34rem;
    text-wrap: balance;
  }

  /* ---------- Authors ---------- */
  .authors-wrapper {
    padding-inline: var(--spacing-xxl);
  }
  .authors-wrapper .panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--spacing-lg);
    border-radius: var(--radius-2xxl);
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    max-width: 100%;
    padding: var(--spacing-2xxl) var(--spacing-2xxl) var(--spacing-3xxl);
  }
  .authors {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2xxl);
    justify-content: center;
  }

  /* ---------- FAQ ---------- */
  .faq-section .container {
    --w: 720px;
  }

  /* ---------- Footer ---------- */
  .footer {
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
  }
  .footer .container {
    --w: 720px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xxl);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    padding-top: var(--spacing-2xxl);
    padding-bottom: var(--spacing-2xxl);
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
    max-width: 20rem;
  }
  .footer .tagline {
    margin: 0;
    line-height: 1.6;
  }
  .footer .wordmark {
    /* Keep the hit area on the word, not the whole column. */
    align-self: flex-start;
    font-family: var(--serif-display);
    font-size: var(--text-xl);
    line-height: 1;
    color: var(--text-primary);
    text-decoration: none;
  }
  .footer .wordmark:hover {
    color: var(--link-primary);
  }
  .footer .legal {
    margin: 0;
    max-width: 42rem;
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--border-color);
    line-height: 1.6;
  }
  .footer-right {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2xxl);
  }
  .footer .links {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    white-space: nowrap;
  }
  /* Match the social column's row box (24px icon + 8px gap) so the two footer
     columns share one baseline grid instead of drifting apart. */
  .footer .links .muted {
    display: flex;
    align-items: center;
    min-height: 24px;
    color: var(--text-secondary);
  }
  .footer .links .muted:hover {
    color: var(--link-primary);
  }

  @media (max-width: 600px) {
    main,
    .footer {
      /* 32px: the scale jumps 24 → 48, and 24 left the sections crowding each
         other while 48 reopened the gap this pass was closing. */
      --section-y: calc(var(--spacing-xxl) + var(--spacing-md));
      --gutter: var(--spacing-xxl);
    }

    /* ---------- Hero ---------- */
    /* No min-height: the space below the lede is padding we chose, not a gap
       left over by a viewport-height box. */
    .hero {
      min-height: 0;
      padding-top: var(--spacing-3xxl);
      padding-bottom: var(--spacing-2xxl);
    }
    .title {
      /* Let the wordmark own the screen — the clamp floor was capping it at
         60px on every phone, leaving the lede heavier than the H1. */
      font-size: clamp(3.5rem, 22vw, 6.25rem);
    }
    .lede {
      font-size: var(--text-lg);
      line-height: 1.5;
      max-width: 24rem;
      margin-top: var(--spacing-lg);
    }

    /* ---------- Shared section heading ---------- */
    .block-heading {
      margin-bottom: var(--spacing-xxl);
    }
    .block-heading .eyebrow {
      margin-bottom: var(--spacing-sm);
    }
    .section-lead {
      font-size: var(--text-md);
      max-width: 22rem;
    }

    /* ---------- Authors ---------- */
    /* The panel breaks out past the page gutter, but its 1px border means the
       inset has to absorb the odd pixel for the cards to land on the gutter. */
    .authors-wrapper {
      padding-inline: calc(var(--gutter) - var(--spacing-lg) - 1px);
    }
    .authors-wrapper .panel {
      padding: var(--spacing-xxl) var(--spacing-lg);
      border-radius: var(--radius-xxl);
    }
    .authors {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
    }

    /* ---------- FAQ ---------- */
    /* The rule under the heading already separates the list; the extra gap only
       made the eyebrow look orphaned. */
    .faq-section .block-heading {
      margin-bottom: var(--spacing-xl);
    }

    /* ---------- Footer ---------- */
    .footer .container {
      gap: var(--spacing-xxl);
    }
    .footer-top {
      flex-direction: column;
      gap: var(--spacing-xxl);
    }
    .footer-brand {
      max-width: 22rem;
    }
    .footer-right {
      width: 100%;
      justify-content: space-between;
      gap: var(--spacing-xl);
    }
    /* Roomier rows in both footer columns — 15px-tall links were far too small
       to hit with a thumb. */
    .footer .links {
      gap: var(--spacing-lg);
    }
    .footer .links .muted,
    .footer-right :global(.social-media) {
      min-height: 32px;
    }
    .footer-right :global(.social-media-list) {
      gap: var(--spacing-lg);
    }
  }
</style>
