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
        <p class="section-lead">
          Katalogu ynë i shkrimtarëve — në rritje e sipër.
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
        <!-- <p class="section-lead">Çka duhet të dini para se të nisni.</p> -->
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
    <p class="brand">
      Përmbajtja e shkrimtarëve mund të përdoret lirisht, mjafton të citohet
      fletoret.com.
    </p>
    <div class="footer-right">
      <nav class="links">
        <a href="/kopertina" class="muted">→ Krijo kopertina</a>
        <a href="/copeza" class="muted">→ Copëza</a>
      </nav>
      <SocialMedia />
    </div>
  </div>
</footer>

<style>
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
    padding: var(--spacing-3xxl) 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    padding: 0 calc(2 * var(--spacing-xxl));
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
    color: var(--color-orange);
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
  .faq-list {
    border-top: 1px solid var(--border-color);
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
    align-items: flex-start;
    gap: var(--spacing-2xxl);
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    padding-top: var(--spacing-2xxl);
    padding-bottom: var(--spacing-2xxl);
  }
  .footer .brand {
    margin: 0;
    max-width: 20rem;
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
  .footer .links .muted {
    color: var(--text-secondary);
  }
  .footer .links .muted:hover {
    color: var(--link-primary);
  }

  @media (max-width: 600px) {
    section {
      padding: var(--spacing-2xxl) 0;
    }
    .container {
      padding: 0 var(--spacing-xxl);
    }

    .hero {
      min-height: 56vh;
    }

    .authors-wrapper {
      padding-inline: var(--spacing-lg);
    }
    .authors-wrapper .panel {
      padding: var(--spacing-2xxl) var(--spacing-lg);
    }
    .authors {
      gap: var(--spacing-lg);
    }

    .footer .container {
      flex-direction: column;
      gap: var(--spacing-xl);
    }
    .footer .brand {
      max-width: 100%;
    }
    .footer-right {
      width: 100%;
      justify-content: space-between;
      gap: var(--spacing-xl);
    }
  }
</style>
