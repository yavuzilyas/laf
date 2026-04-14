<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
    import NotLogged from "$lib/components/notLogged.svelte";
    import Write from "$lib/components/Write.svelte";
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';

    let { data } = $props();
    let user = data?.user;
    let article = data?.article;
    let mode = data?.mode;
    let isTranslator = data?.isTranslator;
    let targetLang = data?.targetLang;

    const siteUrl = 'https://laf.international';
    const currentLocale = getCurrentLocale() || 'tr';
    const seoTitle = $derived(`${t('seo.write.title')} | LAF`);
    const seoDescription = $derived(t('seo.write.description') || 'LAF platformunda makale yazın ve yayınlayın.');
    // Use consistent canonical URL without query params to avoid hydration mismatch
    const canonicalUrl = `${siteUrl}/${currentLocale}/write`;
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={seoDescription} />
  <meta name="keywords" content={t('seo.write.keywords') || 'makale yaz, içerik oluştur, blog yaz'} />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={seoDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content={t('seo.siteName') || 'LAF'} />
  <meta property="og:image" content={`${siteUrl}/lafpp.png`} />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@lafoundation" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={seoDescription} />
</svelte:head>
<Navbar />
<div class="container max-w-7xl min-h-[calc(100vh-8rem)] mx-auto px-4 xl:px-0 py-10">
  {#if !user}
    <NotLogged />
  {:else}
      <Write {article} {mode} {isTranslator} {targetLang} />
  {/if}
</div>
<Footer />
