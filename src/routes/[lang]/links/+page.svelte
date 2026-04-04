<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { Globe, Heart, Mail, ExternalLink, MessageCircle } from '@lucide/svelte';
import { ExternalLinkIcon, LinkIcon } from 'svelte-animate-icons';
  let { data } = $props();
  let links = $derived(data.links || []);
  let groupedLinks = $derived(data.groupedLinks || {});

  const typeLabels: Record<string, string> = {
    social: 'Sosyal Medya',
    donation: 'Bağış',
    external: 'Diğer Linkler',
    contact: 'İletişim',
    other: 'Diğer'
  };

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
  <title>Linkler - LAF</title>
  <meta name="description" content="LAF sosyal medya ve iletişim linkleri" />
</svelte:head>

<Navbar />

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-8">
                        <LinkIcon triggers={{ hover: false }} duration={2000} animationState="loading" size={48} class="text-primary" />

      <h1 class="text-4xl font-bold mb-4">Linkler</h1>
      <p class="text-muted-foreground text-lg">
        Bizi sosyal medyada takip edin ve bağlantılara göz atın
      </p>
    </div>

    <!-- Links by Category -->
    {#each Object.entries(groupedLinks) as [type, typeLinks]}
      <div class="mb-10 flex flex-col w-full items-center ">
        <div class="flex flex-row justify-center items-center  w-full gap-3 mb-6">
          <div class="p-2 bg-primary/10 rounded-lg">
            <svelte:component this={typeIcons[type] || Globe} class="w-5 h-5 text-primary" />
          </div>
          <h2 class="text-xl font-semibold">{typeLabels[type] || type}</h2>
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
                {#if link.description}
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                {/if}
              </div>

              <!-- Arrow -->
              <ExternalLinkIcon triggers={{ hover: false }} animationState="loading" duration={1400} loop={true}  class="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Empty State -->
    {#if links.length === 0}
      <div class="text-center py-16">
        <Globe class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">Henüz link eklenmemiş</h3>
        <p class="text-muted-foreground">
          Yakında sosyal medya ve iletişim linkleri burada görünecek
        </p>
      </div>
    {/if}
  </div>
</div>

<Footer />
