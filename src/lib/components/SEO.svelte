<script lang="ts">
  import { page } from '$app/state';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  
  interface Props {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
    noindex?: boolean;
    jsonLd?: Record<string, any>;
    enabled?: boolean;
  }
  
  let {
    title = 'LAF - Libertarian Anarchist Foundation',
    description = 'Libertarian anarchist activism and intellectual knowledge sharing platform. Anarchist, libertarian action and ideas.',
    keywords = 'libertarian, anarchist, anarcho-capitalism, freedom, liberty, individual rights, LAF',
    ogImage = 'https://laf.dev/og-image.png',
    ogType = 'website',
    canonical,
    noindex = false,
    jsonLd,
    enabled = true
  }: Props = $props();

  // Don't render anything if disabled (e.g., article page handles SEO itself)
  const isEnabled = $derived(enabled);

  const baseUrl = 'https://laf.international';
  const currentPath = $derived(page.url.pathname);
  const canonicalUrl = $derived(canonical || `${baseUrl}${currentPath}`);
  const locale = $derived(i18n.currentLocale || 'tr');
  
  // Default JSON-LD structured data
  const defaultJsonLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: i18n.t('seo.home.title') || 'Libertarian Anarchist Foundation',
    alternateName: 'LAF',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://t.me/lafturkiye',
    ],
    description: i18n.t('seo.home.description') || 'Libertarian anarchist activism and intellectual knowledge sharing platform'
  });
  
  const finalJsonLd = $derived(jsonLd || defaultJsonLd);
</script>

<svelte:head>
  {#if isEnabled}
    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />
    <meta name="keywords" content={keywords} />
    <meta name="author" content="Libertarian Anarchist Foundation" />
    <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

    <!-- Canonical URL -->
    <link rel="canonical" href={canonicalUrl} />

    <!-- Alternate Languages -->
    {#if i18n.availableLocales && i18n.availableLocales.length > 0}
      <!-- Self-referencing alternate link for current locale -->
      <link rel="alternate" hreflang={locale} href={canonicalUrl} />
      {#each i18n.availableLocales as localeValue}
        {#if localeValue !== locale}
          <link rel="alternate" hreflang={localeValue} href={`${baseUrl}/${localeValue}${currentPath.replace(new RegExp(`^/(${i18n.availableLocales.join('|')})(/|$)`), '/').replace(/\/$/, '') || '/'}`} />
        {/if}
      {/each}
      <link rel="alternate" hreflang="x-default" href={`${baseUrl}/tr${currentPath.replace(new RegExp(`^/(${i18n.availableLocales.join('|')})(/|$)`), '/').replace(/\/$/, '') || '/'}`} />
    {/if}

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={ogType} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:site_name" content="LAF" />
    <meta property="og:locale" content={locale === 'tr' ? 'tr_TR' : locale === 'en' ? 'en_US' : `${locale}_${locale.toUpperCase()}`} />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={canonicalUrl} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={ogImage} />

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
      {JSON.stringify(finalJsonLd)}
    </script>
  {/if}
</svelte:head>
