<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Card from "$lib/components/ui/card";

  interface BadgeMeaning {
    id: string;
    name: string;
    icon: string;
    description: string;
    requirement: string;
    color: string;
  }

  const badgeMeanings: BadgeMeaning[] = [
    {
      id: 'pioneer',
      name: 'Pioneer',
      icon: '🌟',
      description: 'Bağışçı',
      requirement: 'Bağış yapan kullanıcı',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    {
      id: 'rebel',
      name: 'Rebel',
      icon: '⚡',
      description: 'Hızlı bağışçı',
      requirement: '1-10 XMR bağış yapan kullanıcı',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'sponsor',
      name: 'Sponsor',
      icon: '💎',
      description: 'Bağış sponsoru',
      requirement: '10+ XMR bağış yapan kullanıcı',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    }
  ];

  let selectedBadge = $state<BadgeMeaning | null>(null);

  function selectBadge(badge: BadgeMeaning) {
    selectedBadge = selectedBadge?.id === badge.id ? null : badge;
  }
</script>

<div class="w-full max-w-4xl mx-auto p-6">
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <span class="text-2xl">🏆</span>
        Bağış Rozetleri
      </Card.Title>
      <Card.Description>
        Monero bağışlarınıza özel rozetler kazanır ve topluluğa katkılarınız gösterilir.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 md:grid-cols-3">
        {#each badgeMeanings as badge (badge.id)}
          <div 
            class="relative cursor-pointer transition-all duration-200 hover:scale-105"
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
              <div class="text-4xl mb-2">{badge.icon}</div>
              
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

      <!-- Selected Badge Details -->
      {#if selectedBadge}
        <div class="mt-6 p-4 bg-muted rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-3xl">{selectedBadge.icon}</span>
            <div>
              <h4 class="font-semibold text-lg mb-2">{selectedBadge.name} Rozeti</h4>
              <p class="text-sm text-muted-foreground mb-2">{selectedBadge.description}</p>
              <div class="bg-background rounded px-3 py-2 text-sm">
                <strong>Kazanma Kriteri:</strong> {selectedBadge.requirement}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
