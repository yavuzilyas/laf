<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Card from "$lib/components/ui/card";
  import { MagicCard } from "$lib/components/magic/magic-card";
  import { t } from '$lib/stores/i18n.svelte.js';
  import { getCurrentLocale } from '$lib/stores/i18n.svelte.js';

  // Locale-aware URL helper
  const currentLocale = $derived(getCurrentLocale() || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
import { BarSpinner } from "$lib/components/spell/bar-spinner";
  import { User } from "@lucide/svelte";

  interface BadgeUser {
    userId: string;
    username: string;
    name: string;
    surname: string;
    avatar_url: string | null;
    totalAmount: string;
    donationCount: number;
  }

  interface BadgeMeaning {
    id: string;
    name: string;
    icon: string;
    description: string;
    requirement: string;
    color: string;
  }

  let selectedBadge = $state<BadgeMeaning | null>(null);
  let badgeUsers = $state<BadgeUser[]>([]);
  let isLoadingUsers = $state(false);

  // Reactive badge meanings to handle translation updates
  const badgeMeanings = $derived<BadgeMeaning[]>([
    {
      id: 'pioneer',
      name: t('donations.badges.bastiat.name'),
      icon: '/badge-pp/bastiat-badge-pp.jpeg',
      description: t('donations.badges.bastiat.description'),
      requirement: t('donations.badges.bastiat.requirement'),
      color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50'
    },
    {
      id: 'rebel',
      name: t('donations.badges.ludwig.name'),
      icon: '/badge-pp/mises-badge-pp.jpeg',
      description: t('donations.badges.ludwig.description'),
      requirement: t('donations.badges.ludwig.requirement'),
      color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50'
    },
    {
      id: 'sponsor',
      name: t('donations.badges.murray.name'),
      icon: '/badge-pp/murray-badge-pp.jpeg',
      description: t('donations.badges.murray.description'),
      requirement: t('donations.badges.murray.requirement'),
      color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50'
    }
  ]);

  async function fetchBadgeUsers(badgeId: string) {
    isLoadingUsers = true;
    try {
      const response = await fetch(`/api/donations/badges?type=${badgeId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        badgeUsers = data.users || [];
      }
    } catch (error) {
    } finally {
      isLoadingUsers = false;
    }
  }

  function selectBadge(badge: BadgeMeaning) {
    if (selectedBadge?.id === badge.id) {
      selectedBadge = null;
      badgeUsers = [];
    } else {
      selectedBadge = badge;
      fetchBadgeUsers(badge.id);
    }
  }

  function getDonorDisplayName(user: BadgeUser): string {
    if (user.name && user.surname) {
      return `${user.name} ${user.surname}`;
    }
    return user.username || t('donations.anonymous');
  }
</script>

<div class="w-full">
  <MagicCard class="rounded-xl p-6">
    <div>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <span class="text-2xl">🏆</span>
        {t('donations.badges.title')}
      </Card.Title>
      <Card.Description>
        {t('donations.badges.subtitle')}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 mt-4 md:grid-cols-3">
        {#each badgeMeanings as badge (badge.id)}
          <div 
            class="relative cursor-pointer transition-all duration-200 hover:scale-102"
            onclick={() => selectBadge(badge)}
          >
            <!-- Badge Card -->
            <div class={`border-2 rounded-lg p-4 text-center transition-all duration-200 ${
              selectedBadge?.id === badge.id 
                ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
                : 'hover:shadow-md'
            } ${badge.color}`}
          >
              <!-- Badge Icon -->
              <div class="mb-2 flex justify-center">
                <img src={badge.icon} alt={badge.name} class="w-16 h-16 object-cover rounded-full" />
              </div>
              
              <!-- Badge Name -->
              <h3 class="font-bold text-lg mb-1">{badge.name}</h3>
              
              <!-- Badge Description -->
              <p class="text-sm opacity-80 mb-3">{badge.description}</p>
              
              <!-- Badge Requirement -->
              <div class="text-xs font-medium bg-black/10 rounded px-2 py-1">
                {badge.requirement}
              </div>
            </div>
            
            <!-- Selection Indicator -->
            {#if selectedBadge?.id === badge.id}
              <div class="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Selected Badge Users List Only -->
      {#if selectedBadge}
        <div class="mt-6 p-4 bg-muted rounded-lg">
          <!-- Badge Holders List -->
          <div>
            <h5 class="font-semibold text-sm mb-3 flex items-center gap-2">
              <User class="w-4 h-4" />
              {t('donations.badgeHolders')} ({badgeUsers.length})
            </h5>
            
            {#if isLoadingUsers}
              <div class="flex items-center justify-center py-8">
                <BarSpinner class="text-primary" />
              </div>
            {:else if badgeUsers.length === 0}
              <p class="text-sm text-muted-foreground text-center py-4">
                {t('donations.noBadgeHolders')}
              </p>
            {:else}
              <div class="grid gap-2 max-h-80 overflow-y-auto">
                {#each badgeUsers as user (user.userId)}
                  <a 
                    href={l(`/${user.username}`)}
                    class="flex items-center gap-3 p-2 bg-background rounded-lg hover:bg-accent transition-colors"
                  >
                    {#if user.avatar_url}
                      <img 
                        src={user.avatar_url} 
                        alt={getDonorDisplayName(user)}
                        class="w-10 h-10 rounded-full object-cover"
                      />
                    {:else}
                      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User class="w-5 h-5 text-primary" />
                      </div>
                    {/if}
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm truncate">{getDonorDisplayName(user)}</p>
                      {#if user.username}
                        <p class="text-xs text-muted-foreground truncate">@{user.username}</p>
                      {/if}
                    </div>
                    <div class="text-right">
                      <p class="text-xs font-medium text-green-600">{parseFloat(user.totalAmount).toFixed(2)} XMR</p>
                      <p class="text-xs text-muted-foreground">{user.donationCount} {t('donations.donations')}</p>
                    </div>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </Card.Content>
    </div>
  </MagicCard>
</div>
