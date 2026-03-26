<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { Copy, ExternalLink, Smartphone, Monitor } from '@lucide/svelte';
  import { showToast } from '$lib/hooks/toast';
  import { createEventDispatcher } from 'svelte';

  let { open = false, walletAddress = '' } = $props();

  const dispatch = createEventDispatcher();

  // Device detection
  let isMobile = $state(false);

  function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  // Popular Monero wallets with their deep links
  const desktopWallets = [
    {
      name: 'Feather Wallet',
      icon: '🪶',
      deepLink: `monero:${walletAddress}`,
      url: 'https://featherwallet.org/',
      description: 'Hafif ve kullanıcı dostu masaüstü cüzdan'
    },
    {
      name: 'Monero GUI Wallet',
      icon: '💻',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.getmonero.org/downloads/',
      description: 'Resmi Monero masaüstü cüzdanı'
    },
    {
      name: 'Cake Wallet',
      icon: '🍰',
      deepLink: `monero:${walletAddress}`,
      url: 'https://cakewallet.com/',
      description: 'Popüler ve güvenli cüzdan'
    },
    {
      name: 'Exodus',
      icon: '🌊',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.exodus.com/',
      description: 'Çoklu kripto para cüzdanı'
    }
  ];

  const mobileWallets = [
    {
      name: 'Cake Wallet',
      icon: '🍰',
      deepLink: `monero:${walletAddress}`,
      url: 'https://cakewallet.com/',
      appStore: 'https://apps.apple.com/app/cake-wallet-monero/id1444619086',
      playStore: 'https://play.google.com/store/apps/details?id=com.cakewallet.cake_wallet',
      description: 'En popüler mobil Monero cüzdanı'
    },
    {
      name: 'Monerujo',
      icon: '📱',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.monerujo.io/',
      appStore: 'https://apps.apple.com/app/monerujo/id1454255856',
      playStore: 'https://play.google.com/store/apps/details?id=com.m2049r.xmrwallet',
      description: 'Android için güvenli cüzdan'
    },
    {
      name: 'Edge Wallet',
      icon: '🔷',
      deepLink: `monero:${walletAddress}`,
      url: 'https://edge.app/',
      appStore: 'https://apps.apple.com/app/edge-bitcoin-wallet/id1344700041',
      playStore: 'https://play.google.com/store/apps/details?id=co.edge',
      description: 'Çoklu varlık mobil cüzdan'
    },
    {
      name: 'Guarda Wallet',
      icon: '🛡️',
      deepLink: `monero:${walletAddress}`,
      url: 'https://guarda.co/',
      appStore: 'https://apps.apple.com/app/guarda-crypto-wallet/id1447356989',
      playStore: 'https://play.google.com/store/apps/details?id=com.guarda.wallet',
      description: 'Kullanıcı dostu mobil cüzdan'
    }
  ];

  function openWalletDeepLink(deepLink: string, walletName: string) {
    try {
      // Try to open wallet app
      window.location.href = deepLink;
      
      // Fallback: show toast and copy address
      setTimeout(() => {
        showToast(`${walletName} açılmadıysa, adresi kopyalayıp manuel olarak yapabilirsiniz`, 'info');
        copyToClipboard(walletAddress);
      }, 1500);
    } catch (error) {
      showToast('Cüzdan açılırken hata oluştu', 'error');
    }
  }

  function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Cüzdan adresi kopyalandı!', 'success');
      }).catch(() => {
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  }

  function fallbackCopyToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showToast('Cüzdan adresi kopyalandı!', 'success');
    } catch (err) {
      showToast('Kopyalama başarısız oldu', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  function openStore(storeUrl: string) {
    window.open(storeUrl, '_blank');
  }

  function openWebsite(url: string) {
    window.open(url, '_blank');
  }

  // Handle dialog close
  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      dispatch('close');
    }
  }

  // Detect device when dialog opens
  $effect(() => {
    if (open) {
      detectDevice();
    }
  });
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="!max-w-1/2 max-h-[90vh] overflow-y-auto p-4">
    <Dialog.Header class="pb-3">
      <Dialog.Title class="flex items-center gap-2 text-lg">
        {#if isMobile}
          <Smartphone class="w-4 h-4" />
        {:else}
          <Monitor class="w-4 h-4" />
        {/if}
        Monero Cüzdanı Seç
      </Dialog.Title>
      <Dialog.Description class="text-sm">
        {isMobile 
          ? 'Mobil cüzdan seçin' 
          : 'Masaüstü cüzdan seçin'}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- Wallet Address Display -->
      <div class="p-3 bg-muted rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium">Cüzdan Adresi:</span>
          <Button 
            variant="outline" 
            size="sm"
            onclick={() => copyToClipboard(walletAddress)}
            class="h-7 px-2 text-xs"
          >
            <Copy class="w-3 h-3 mr-1" />
            Kopyala
          </Button>
        </div>
        <code class="text-xs break-all font-mono">{walletAddress}</code>
      </div>

      <!-- Compact Wallet Grid -->
      <div class="grid grid-cols-2 gap-2">
        {#each isMobile ? mobileWallets : desktopWallets as wallet (wallet.name)}
          <div class="border rounded-lg p-2 hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{wallet.icon}</span>
              <div class="min-w-0 flex-1">
                <h3 class="font-medium text-xs truncate">{wallet.name}</h3>
                <p class="text-xs text-muted-foreground truncate">{wallet.description}</p>
              </div>
            </div>
            
            <div class="flex gap-1">
              <Button 
                variant="default"
                size="sm"
                onclick={() => openWalletDeepLink(wallet.deepLink, wallet.name)}
                class="flex-1 h-7 text-xs"
              >
                Aç
              </Button>
              
              {#if isMobile && wallet.appStore}
                <Button 
                  variant="outline" 
                  size="sm"
                  onclick={() => openStore(wallet.appStore)}
                  class="h-7 px-2 text-xs"
                  title="App Store"
                >
                  AS
                </Button>
              {/if}
              
              {#if isMobile && wallet.playStore}
                <Button 
                  variant="outline" 
                  size="sm"
                  onclick={() => openStore(wallet.playStore)}
                  class="h-7 px-2 text-xs"
                  title="Google Play"
                >
                  GP
                </Button>
              {/if}
              
              <Button 
                variant="ghost" 
                size="sm"
                onclick={() => openWebsite(wallet.url)}
                class="h-7 w-7 p-0"
                title="Web sitesi"
              >
                <ExternalLink class="w-3 h-3" />
              </Button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Compact Help Text -->
      <div class="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <h4 class="font-semibold text-xs mb-1">Cüzdanınız yüklü değil mi?</h4>
        <p class="text-xs text-muted-foreground">
          Mağaza butonlarından indirebilir veya web sitesini ziyaret edebilirsiniz. "Aç" butonu ile otomatik ödeme ekranına ulaşabilirsiniz.
        </p>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
