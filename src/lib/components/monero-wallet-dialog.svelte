<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { Copy, ExternalLink, Smartphone, Monitor, Wallet } from '@lucide/svelte';
  import { showToast } from '$lib/hooks/toast';
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/stores/i18n.svelte.js';

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
      key: 'feather',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://featherwallet.org/'
    },
    {
      key: 'moneroGui',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.getmonero.org/downloads/'
    },
    {
      key: 'cake',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://cakewallet.com/'
    },
    {
      key: 'exodus',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.exodus.com/'
    }
  ];

  const mobileWallets = [
    {
      key: 'cake',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://cakewallet.com/'
    },
    {
      key: 'monerujo',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://www.monerujo.io/'
    },
    {
      key: 'edge',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://edge.app/'
    },
    {
      key: 'guarda',
      icon: 'wallet',
      deepLink: `monero:${walletAddress}`,
      url: 'https://guarda.co/'
    }
  ];

  function openWalletDeepLink(deepLink: string, walletKey: string) {
    const walletName = t(`donations.walletDialog.wallets.${walletKey}.name`);
    try {
      // Try to open wallet app
      window.location.href = deepLink;
      
      // Fallback: show toast and copy address
      setTimeout(() => {
        showToast(t('donations.walletDialog.walletNotOpened').replace('{walletName}', walletName), 'info');
        copyToClipboard(walletAddress);
      }, 1500);
    } catch (error) {
      showToast(t('donations.walletDialog.walletError'), 'error');
    }
  }

  function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(t('donations.walletDialog.copySuccess'), 'success');
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
      showToast(t('donations.walletDialog.copySuccess'), 'success');
    } catch (err) {
      showToast(t('donations.walletDialog.copyError'), 'error');
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
  <Dialog.Content class="sm:!max-w-1/2 max-w-[95vw] w-full max-h-[90vh] overflow-y-auto p-3 sm:p-4">
    <Dialog.Header >
      <Dialog.Title class="flex items-center gap-2 text-lg">
        {#if isMobile}
          <Smartphone class="w-4 h-4" />
        {:else}
          <Monitor class="w-4 h-4" />
        {/if}
        {t('donations.walletDialog.title')}
      </Dialog.Title>
      <Dialog.Description class="text-sm">
        {isMobile 
          ? t('donations.walletDialog.mobileDescription') 
          : t('donations.walletDialog.desktopDescription')}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- Wallet Address Display -->
      <div class="p-3 bg-muted rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium">{t('donations.walletDialog.walletAddress')}:</span>
          <Button 
            variant="outline" 
            size="sm"
            onclick={() => copyToClipboard(walletAddress)}
            class="h-7 px-2 text-xs"
          >
            <Copy class="w-3 h-3 mr-1" />
            {t('donations.walletDialog.copy')}
          </Button>
        </div>
        <code class="text-xs break-all font-mono">{walletAddress}</code>
      </div>

      <!-- Compact Wallet Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {#each isMobile ? mobileWallets : desktopWallets as wallet (wallet.key)}
          <div class="border flex flex-row rounded-lg gap-2 p-2.5 sm:p-2 hover:bg-muted/50 transition-colors">
              <Wallet class="w-5 h-5 text-primary flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="font-medium text-sm sm:text-xs truncate">{t(`donations.walletDialog.wallets.${wallet.key}.name`)}</h3>
                <p class="text-xs sm:text-[10px] text-muted-foreground truncate">{t(`donations.walletDialog.wallets.${wallet.key}.description`)}</p>
              </div>
            
              <Button 
                variant="default"
                size="sm"
                onclick={() => openWalletDeepLink(wallet.deepLink, wallet.key)}
                class=" h-8 text-xs"
              >
                {t('donations.walletDialog.open')}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onclick={() => openWebsite(wallet.url)}
                class="h-8 w-8 p-0"
                title={t('donations.walletDialog.website')}
              >
                <ExternalLink class="w-3 h-3" />
              </Button>
          </div>
        {/each}
      </div>

      <!-- Compact Help Text -->
      <div class="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
        <h4 class="font-semibold text-xs mb-1">{t('donations.walletDialog.noWallet')}</h4>
        <p class="text-xs text-muted-foreground">
          {t('donations.walletDialog.helpText')}
        </p>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
