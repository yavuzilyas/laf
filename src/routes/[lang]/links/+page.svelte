<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';
  import { Globe, Heart, Mail, ExternalLink, MessageCircle } from '@lucide/svelte';
import { LinkIcon } from 'svelte-animate-icons';
  let { data } = $props();
  let links = $derived(data.links || []);
  let groupedLinks = $derived(data.groupedLinks || {});

  const siteUrl = 'https://laf.international';
  const currentLocale = getCurrentLocale() || 'tr';
  const seoTitle = $derived(`${t('seo.links.title')} | LAF`);
  const seoDescription = $derived(t('seo.links.description') || 'LAF sosyal medya hesapları ve iletişim bağlantıları.');
  const canonicalUrl = $derived(typeof window !== 'undefined' ? window.location.href : `${siteUrl}/${currentLocale}/links`);

  // Type labels now come from translations via t('linksPage.types.{type}')

  const typeIcons: Record<string, any> = {
    social: MessageCircle,
    donation: Heart,
    external: ExternalLink,
    contact: Mail,
    other: Globe
  };


  function getIcon(link: any) {
    if (link.icon_url) return null;
    

    
    return typeIcons[link.type] || Globe;
  }

  async function trackClick(linkId: string) {
    try {
      await fetch(`/api/links/${linkId}/click`, { method: 'POST' });
    } catch (e) {
      // Silent fail
    }
  }
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={seoDescription} />
  <meta name="keywords" content={t('seo.links.keywords') || 'sosyal medya, telegram, discord, iletişim'} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={seoDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content={t('seo.siteName') || 'LAF'} />
  <meta property="og:image" content={`${siteUrl}/og-links.png`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@lafoundation" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={seoDescription} />
</svelte:head>

<Navbar />

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-12 max-w-2xl">
    <!-- Header -->
    <div class="text-center mb-8">
                        <LinkIcon triggers={{ hover: false }} duration={2000} animationState="loading" size={48} class="text-primary" />

      <h1 class="text-4xl font-bold mb-4">{t('linksPage.title')}</h1>
      <p class="text-muted-foreground text-lg">
        {t('linksPage.subtitle')}
      </p>
    </div>

    <!-- Links by Category -->
    {#each Object.entries(groupedLinks) as [type, typeLinks]}
      <div class="mb-10 flex flex-col w-full items-center ">
        <div class="flex flex-row justify-center items-center  w-full gap-3 mb-6">
          <div class="p-2 bg-primary/10 rounded-lg">
            <svelte:component this={typeIcons[type] || Globe} class="w-5 h-5 text-primary" />
          </div>
          <h2 class="text-xl font-semibold">{t(`linksPage.types.${type}`) || type}</h2>
        </div>

        <div class="grid gap-4 w-full ">
          {#each typeLinks as link (link.id)}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/50 hover:shadow-md transition-all"
              onclick={() => trackClick(link.id)}
            >
              <!-- Icon -->
              <div class="flex-shrink-0">
                {#if link.icon_url}
                  <img
                    src={link.icon_url}
                    alt={link.title}
                    class="w-12 h-12 rounded-lg object-cover"
                  />
                {:else}
                  {@const IconComponent = getIcon(link)}
                  <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svelte:component this={IconComponent} class="w-6 h-6 text-primary" />
                  </div>
                {/if}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                {#if link.description && currentLocale === 'tr'}
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                {/if}
              </div>

                          </a>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Empty State -->
    {#if links.length === 0}
      <div class="text-center py-16">
        <Globe class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">{t('linksPage.emptyState.title')}</h3>
        <p class="text-muted-foreground">
          {t('linksPage.emptyState.description')}
        </p>
      </div>
    {/if}
  </div>
</div>

<Footer />
