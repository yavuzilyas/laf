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
  }
  
  let {
    title = 'LAF - Libertarian Anarchist Foundation',
    description = 'Libertarian anarchist activism and intellectual knowledge sharing platform. Anarchist, libertarian action and ideas.',
    keywords = 'libertarian, anarchist, anarcho-capitalism, freedom, liberty, individual rights, LAF',
    ogImage = 'https://laf.dev/og-image.png',
    ogType = 'website',
    canonical,
    noindex = false,
    jsonLd
  }: Props = $props();
  
  const baseUrl = 'https://laf.dev';
  const currentPath = $derived(page.url.pathname);
  const canonicalUrl = $derived(canonical || `${baseUrl}${currentPath}`);
  const locale = $derived(i18n.currentLocale || 'tr');
  
  // Default JSON-LD structured data
  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Libertarian Anarchist Foundation',
    alternateName: 'LAF',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://t.me/lafoundation',
    ],
    description: 'Libertarian anarchist activism and intellectual knowledge sharing platform'
  };
  
  const finalJsonLd = $derived(jsonLd || defaultJsonLd);
</script>

<svelte:head>
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
  <link rel="alternate" hreflang="tr" href={`${baseUrl}/tr${currentPath.replace(/^\/(en|tr)/, '')}`} />
  <link rel="alternate" hreflang="en" href={`${baseUrl}/en${currentPath.replace(/^\/(en|tr)/, '')}`} />
  <link rel="alternate" hreflang="x-default" href={`${baseUrl}/tr${currentPath.replace(/^\/(en|tr)/, '')}`} />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="LAF" />
  <meta property="og:locale" content={locale === 'tr' ? 'tr_TR' : 'en_US'} />
  
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
</svelte:head>
