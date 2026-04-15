<script lang="ts">
  import App from '$lib/App.svelte';
  import Loader from '$lib/components/load.svelte';
  import { getPageSEO, generateSEOMeta, generateBreadcrumbs } from '$lib/utils/seo.js';
  import { page } from '$app/state';

  let { data } = $props();

  const baseUrl = 'https://laf.international';
  const currentPath = $derived(page.url.pathname);
  const canonicalUrl = $derived(`${baseUrl}${currentPath}`);

  const seo = $derived(getPageSEO('home'));
  const meta = $derived(generateSEOMeta({
    title: seo.title,
    description: seo.description,
    type: 'website',
    canonical: canonicalUrl
  }));
  import { t, i18n } from '$lib/stores/i18n.svelte';

  const breadcrumbs = $derived(generateBreadcrumbs([
    { name: t('seo.homeTab') || 'Home', url: canonicalUrl }
  ]));
</script>

<svelte:head>
  <!-- Primary Meta -->
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
  <link rel="canonical" href={meta.canonical} />

  <!-- Open Graph / Facebook -->
  <meta property="og:title" content={meta.og.title} />
  <meta property="og:description" content={meta.og.description} />
  <meta property="og:type" content={meta.og.type} />
  <meta property="og:url" content={meta.og.url} />
  <meta property="og:site_name" content={meta.og.site_name} />
  <meta property="og:image" content={meta.og.image} />
  <meta property="og:image:alt" content={meta.og.image_alt} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content={meta.twitter.card} />
  <meta name="twitter:site" content={meta.twitter.site} />
  <meta name="twitter:title" content={meta.twitter.title} />
  <meta name="twitter:description" content={meta.twitter.description} />
  <meta name="twitter:image" content={meta.twitter.image} />
  <meta name="twitter:image:alt" content={meta.twitter.image_alt} />

  <!-- Alternate Languages -->
  {#if i18n.availableLocales && i18n.availableLocales.length > 0}
    <!-- Self-referencing alternate link for current locale -->
    <link rel="alternate" hreflang={i18n.currentLocale} href={canonicalUrl} />
    {#each i18n.availableLocales as localeValue}
      {#if localeValue !== i18n.currentLocale}
        <link rel="alternate" hreflang={localeValue} href={`${baseUrl}/${localeValue}/`} />
      {/if}
    {/each}
    <link rel="alternate" hreflang="x-default" href={`${baseUrl}/tr/`} />
  {/if}

  <!-- Structured Data / JSON-LD -->
  {@html `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`}
</svelte:head>

<main>
  <slot />
  <App {data} />
</main>
