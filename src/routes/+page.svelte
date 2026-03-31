<script lang="ts">
  import App from '$lib/App.svelte';
  import Loader from '$lib/components/load.svelte';
  import { getPageSEO, generateSEOMeta, generateBreadcrumbs } from '$lib/utils/seo.js';
  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';

  const seo = getPageSEO('home');
  const meta = generateSEOMeta({
    title: seo.title,
    description: seo.description,
    type: 'website',
    locale: getCurrentLocale(),
    canonical: 'https://laf.international/'
  });

  const breadcrumbs = generateBreadcrumbs([
    { name: 'Ana Sayfa', url: 'https://laf.international/' }
  ]);
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
  <meta property="og:locale" content={meta.og.locale} />
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

  <!-- Hreflang for multilingual support -->
  <link rel="alternate" hreflang="tr" href="https://laf.international/" />
  <link rel="alternate" hreflang="en" href="https://laf.international/en/" />
  <link rel="alternate" hreflang="x-default" href="https://laf.international/" />

  <!-- Structured Data / JSON-LD -->
  {@html `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`}
</svelte:head>

<main>
  <slot />
  <App />
</main>
