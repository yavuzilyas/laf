<script lang="ts">
  import App from '$lib/App.svelte';
  import { getPageSEO, generateSEOMeta, generateBreadcrumbs } from '$lib/utils/seo.js';

  let { data } = $props();

  import { t } from '$lib/stores/i18n.svelte';
  
  const seo = $derived(getPageSEO('home'));
  const meta = $derived(generateSEOMeta({
    title: seo.title,
    description: seo.description,
    type: 'website',
    canonical: 'https://laf.international/'
  }));

  const breadcrumbs = $derived(generateBreadcrumbs([
    { name: t('seo.homeTab') || 'Home', url: 'https://laf.international/' }
  ]));
</script>

<svelte:head>
  <!-- Preload first slider image for LCP -->
  <link rel="preload" href="/government-is-violence/GovtIsViolence1.jpg" as="image" fetchpriority="high" />

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

  <!-- Structured Data / JSON-LD -->
  {@html `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>`}
</svelte:head>

<main>
  <slot />
  <App {data} />
</main>
