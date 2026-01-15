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
</script>

<svelte:head>
  <title>{CONFIG.info.serp_title}</title>
  <meta name="description" content={CONFIG.info.misioni} />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />
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
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@fletoretSQ" />
  <meta
    name="twitter:image"
    content="https://fletoret.com/favicon/android-chrome-512x512.png"
  />
</svelte:head>

<Header borderBottom={false} bgSecondary={false} />

<main>
  <section class="header-wrapper">
    <div class="header-content container">
      <h1 class="title">{CONFIG.info.title}</h1>
      <h3 class="section-desc">
        {CONFIG.info.misioni}
      </h3>
    </div>
  </section>

  <section class="authors-wrapper">
    <div class="container-lg">
      <div class="section-heading">
        <h2 class="section-header">Shkrimtarë</h2>
        <h4 class="section-desc">
          Disa nga shkrimtarët e parë qe do mundohemi të sjellim.
        </h4>
      </div>

      <div class="authors flex-align-center">
        {#each data.authorsIndex as [_, author]}
          <ImageCard {author} />
        {/each}
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-heading">
        <h2 class="section-header">Pyetje? Përgjigje.</h2>
      </div>
      <div>
        {#each data.faqEntries as faq}
          <FaqItem question={faq.title} answer={faq.answer} />
        {/each}
      </div>
    </div>
  </section>
</main>

<section class="footer">
  <div class="container">
    <div class="col">
      <div>
        Përmbajtja e shkrimtarëve në fletoret.com mund të përdoret lirisht.
      </div>
    </div>
    <div class="col">
      <a href="/kopertina" class="muted">→ Krijo kopertina</a>
      <a href="/copeza" class="muted">→ Copëza</a>
    </div>

    <div class="col">
      <SocialMedia />
    </div>
  </div>
</section>

<style>
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    /* background-image: linear-gradient(
      to bottom,
      var(--bg-secondary),
      var(--bg-primary)
    ); */
  }

  h2 {
    font-size: 3rem;
  }
  section {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: var(--spacing-2xxl) 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .container {
    padding: calc(2 * var(--spacing-xxl));
  }
  .header-wrapper {
    background-size: 10px 10px;
    min-height: 50vh;
  }
  .header-content {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    margin: auto;
  }
  .title {
    color: var(--text-primary);
    font-size: 5rem;
    font-family: var(--serif-display);
    font-weight: 600;
    margin-bottom: var(--spacing-xxl);
  }
  .section-heading {
    margin-bottom: calc(2 * var(--spacing-xxl));
  }
  .section-header {
    color: var(--text-primary);
    font-family: var(--serif-display);
    font-size: 2.5rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  .section-desc {
    line-height: 1.5;
    font-size: var(--text-lg);
    font-weight: 400;
    max-width: 600px;
    margin: auto;
    color: var(--text-secondary);
    text-align: center;
  }

  .authors-wrapper {
    .container-lg {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--spacing-lg);
      border-radius: var(--radius-xxl);
      background-color: var(--bg-secondary);
      max-width: 100%;
      padding: var(--spacing-2xxl);
      padding-bottom: calc(1.5 * var(--spacing-2xxl));
    }

    .authors {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xxl);
      justify-content: center;
    }
  }

  .footer {
    padding: 0 !important;
  }

  .footer .container {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
  .footer .container .col {
    min-width: 200px;
    max-width: 40%;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--spacing-lg);

    .muted {
      color: var(--text-secondary);
    }
    .muted:hover {
      color: var(--text-primary);
    }
  }

  @media (max-width: 600px) {
    .container {
      padding: var(--spacing-xxl);
    }

    .authors-wrapper {
      .container-lg {
        padding: var(--spacing-xl);
        padding-bottom: calc(1.5 * var(--spacing-xxl));

        .authors {
          gap: 1rem;
        }
      }
    }

    .header-wrapper {
      min-height: 50vh;
    }
    .title {
      font-size: 3.5rem;
    }

    .section-header {
      font-size: 2rem;
    }
    .section-desc {
      font-size: var(--text-md);
    }

    .footer .container {
      flex-wrap: wrap;
    }
    .footer .container .col {
      width: 100% !important;
    }
  }
</style>
