<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { MagicCard } from '$lib/components/magic/magic-card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import BadgeList from '$lib/components/BadgeList.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Copy, User, TrendingUp, Users, MessageCircle, Send, CheckCircle, Clock, ExternalLink } from '@lucide/svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import DonationChart from "$lib/components/donation-chart.svelte";
import { HandCoinsIcon } from 'svelte-animate-icons';
  import xmr from "$lib/assets/xmr.svg";
  import MoneroWalletDialog from '$lib/components/monero-wallet-dialog.svelte';
  import MoneroBadges from '$lib/components/monero-badges.svelte';
  import { Marquee } from '$lib/components/magic/marquee';
  import { IconCloud } from '$lib/components/magic/icon-cloud';
  
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';
  import Loader from "@lucide/svelte/icons/loader";

  // Real data from API
  let donations = $state<any[]>([]);
  let topDonors = $state<any[]>([]);
  let totalAmount = $state(0);
  let isLoading = $state(true);
  let donorAvatars = $state<string[]>([]);

  // Subscribe to user store
  let currentUser = $state<any>(null);

  // Form state
  let amount = $state('');
  let txid = $state('');
  let donationDate = $state('');
  let message = $state('');
  let displayName = $state('');
  let isSubmitting = $state(false);
  let showForm = $state(false);

  const walletAddress = "4A9rVy4Hg7uYMrdso6GvvHXfp7pQMCXsJfCax58TpkyRLHQ4tCbNVsBigxS7qePpwbGgrcyirKu6QNtxmeuhDMBb3tYCwaz";
  let showWalletDialog = $state(false);
  
  onMount(() => {
    fetchDonations();
    userStore.fetchUser();
    // Set default date to now
    const now = new Date();
    donationDate = now.toISOString().slice(0, 16);
    loadAnimation1();
    
    // Subscribe to user changes
    const unsubscribe = userStore.subscribe((store: any) => {
      currentUser = store.user;
    });
    
    return unsubscribe;
  });

  let moneroContainer: HTMLDivElement;
  let animMonero: any;

  async function fetchDonations() {
    try {
      const response = await fetch('/api/donations/list?status=approved&limit=50');
      if (response.ok) {
        const data = await response.json();
        donations = data.donations || [];
        topDonors = data.topDonors || [];
        totalAmount = data.total || 0;
        
        // Extract donor avatars for IconCloud
        const avatars = donations
          .filter(donation => donation.donor_avatar)
          .map(donation => donation.donor_avatar);
        
        // Also include top donors avatars
        const topDonorAvatars = topDonors
          .filter(donor => donor.donor_avatar)
          .map(donor => donor.donor_avatar);
        
        // Combine and deduplicate avatars
        const allAvatars = [...new Set([...avatars, ...topDonorAvatars])];
        donorAvatars = allAvatars;
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    } finally {
      isLoading = false;
    }
  }

  async function submitDonation() {
    if (!amount || !txid || !donationDate) {
      showToast(t('donations.errors.fillRequired'), 'error');
      return;
    }

    if (parseFloat(amount) <= 0) {
      showToast(t('donations.errors.amountPositive'), 'error');
      return;
    }

    isSubmitting = true;
    try {
      const payload: any = {
        amount: parseFloat(amount),
        txid: txid.trim(),
        donation_date: new Date(donationDate).toISOString(),
        message: message.trim() || null,
        display_name: displayName.trim() || null
      };

      // Add user_id if user is logged in
      if (currentUser && currentUser?.id) {
        payload.user_id = currentUser.id;
      }

      const response = await fetch('/api/donations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast(t('donations.success.submitted'), 'success');
        // Reset form
        amount = '';
        txid = '';
        message = '';
        displayName = '';
        showForm = false;
        const now = new Date();
        donationDate = now.toISOString().slice(0, 16);
      } else {
        showToast(data.error || t('donations.errors.submitFailed'), 'error');
      }
    } catch (error) {
      showToast(t('donations.errors.submitError'), 'error');
    } finally {
      isSubmitting = false;
    }
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
          showToast(t('donations.copySuccess'), 'success');
    }).catch(() => {
      showToast(t('donations.copyError'), 'error');
    });
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function getDonorDisplayName(donation: any): string {
    if (donation.user_name && donation.user_surname) {
      return `${donation.user_name} ${donation.user_surname}`;
    }
    if (donation.user_name) {
      return donation.user_name;
    }
    return donation.username || donation.display_name || t('donations.anonymous');
  }

  function getDonorIdentifier(donation: any): string {
    return donation.username || '';
  }

  function hasDonorInfo(donation: any): boolean {
    return !!donation.username;
  }

  function getTopDonorDisplayName(donor: any): string {
    if (donor.user_name && donor.user_surname) {
      return `${donor.user_name} ${donor.user_surname}`;
    }
    if (donor.user_name) {
      return donor.user_name;
    }
    return donor.username || donor.name || t('donations.anonymous');
  }

  function getTopDonorIdentifier(donor: any): string {
    return donor.username || '';
  }

  function hasTopDonorInfo(donor: any): boolean {
    return !!donor.username;
  }

  function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('donations.timeAgo.minutes')}`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${t('donations.timeAgo.hours')}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} ${t('donations.timeAgo.days')}`;
    }
  }

  function formatAmount(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  }

  import lottie from 'lottie-web';

  async function loadAnimation1() {
    // Önce mevcut animasyonu destroy et
    if (animMonero) animMonero.destroy();

      // JSON animasyon dosyasını locale bazlı yükle
      let moneroAnimData;

      
        moneroAnimData = (await import('$lib/assets/Monero.json')).default;

      // Lottie animasyon başlat
      animMonero = lottie.loadAnimation({
        container: moneroContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: moneroAnimData
      });
    }
</script>

<section id="donations" class="px-4 py-12 sm:max-w-5/7 flex flex-col mx-auto gap-10">

  <!-- Header Section -->
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-4 flex items-center justify-center text-left gap-3">
      <HandCoinsIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />
      {t('donations.title')}
    </h1>
    <p class="text-sm  mx-auto text-left">
      {t('donations.description')}
    </p>
    
    <!-- Discord & Telegram Buttons - Turkish only -->
    {#if t.currentLocale === 'tr'}
    <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
      <!-- <Button variant="outline" size="sm" class="gap-2" href="https://discord.gg/laf" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        {t('donations.joinDiscord')}
      </Button> -->
      <Button variant="outline" size="sm" class="gap-2" href="https://t.me/lafturkiye" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        {t('donations.joinTelegram')}
      </Button>
    </div>
    {/if}
  </div>


      {#if isLoading}
        <div class="flex items-center justify-center h-48">
          <Loader class="animate-spin text-primary w-8 h-8" />
        </div>
      {:else if donations.length === 0}
        <div class="flex items-center justify-center h-48 text-muted-foreground">
          {t('donations.noDonations')}
        </div>
      {:else}
      {#if donorAvatars.length > 3}
      <div class="mb-6 flex justify-center">
        <IconCloud images={donorAvatars} />
      </div>
    {/if}
        <div class="relative flex flex-col gap-4 py-4">
          <!-- First Marquee Row - Left to Right -->
          <Marquee pauseOnHover class="[--duration:10s]" repeat={6}>
            {#each donations.slice(0, Math.ceil(donations.length / 2)) as donation (donation.id)}
              <div class="flex-shrink-0 w-72 p-2 sm:p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div class="flex items-start gap-3">
                  {#if donation.donor_avatar}
                    <a href="/{getDonorIdentifier(donation)}" class="flex-shrink-0">
                      <img 
                        src={donation.donor_avatar} 
                        alt={getDonorDisplayName(donation)}
                        class="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                      />
                    </a>
                  {:else}
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                      <User class="w-6 h-6 text-primary" />
                    </div>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      {#if hasDonorInfo(donation)}
                        <a 
                          href="/{getDonorIdentifier(donation)}"
                          class="font-semibold text-sm hover:text-primary transition-colors truncate"
                        >
                          {getDonorDisplayName(donation)}
                        </a>
                      {:else}
                        <span class="font-semibold text-sm truncate">{getDonorDisplayName(donation)}</span>
                      {/if}
                                          {#if donation.badges && donation.badges.length > 0}
                      <div>
                        <BadgeList badges={donation.badges} size="xs" maxVisible={2} />
                      </div>
                    {/if}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <Badge variant="amount" class="text-xs">
                        {formatAmount(donation.amount)}
                        <img src={xmr} alt="XMR" class="w-3 h-3 ml-1"/>
                      </Badge>
                      <span class="text-xs text-muted-foreground">{formatTimeAgo(donation.donation_date)}</span>
                    </div>

                  </div>
                </div>
                {#if donation.message}
                  <div class="mt-3 pt-3 border-t border-border/50">
                    <p class="text-xs text-muted-foreground line-clamp-2 italic">"{donation.message}"</p>
                  </div>
                {/if}
              </div>
            {/each}
          </Marquee>

          <!-- Second Marquee Row - Right to Left (Reverse) -->
          <Marquee reverse pauseOnHover class="[--duration:20s]" repeat={6}>
            {#each donations.slice(Math.ceil(donations.length / 2)) as donation (donation.id)}
              <div class="flex-shrink-0 w-72 p-2 sm:p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div class="flex items-start gap-3">
                  {#if donation.donor_avatar}
                    <a href="/{getDonorIdentifier(donation)}" class="flex-shrink-0">
                      <img 
                        src={donation.donor_avatar} 
                        alt={getDonorDisplayName(donation)}
                        class="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                      />
                    </a>
                  {:else}
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                      <User class="w-6 h-6 text-primary" />
                    </div>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      {#if hasDonorInfo(donation)}
                        <a 
                          href="/{getDonorIdentifier(donation)}"
                          class="font-semibold text-sm hover:text-primary transition-colors truncate"
                        >
                          {getDonorDisplayName(donation)}
                        </a>
                      {:else}
                        <span class="font-semibold text-sm truncate">{getDonorDisplayName(donation)}</span>
                      {/if}
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <Badge variant="amount" class="text-xs">
                        {formatAmount(donation.amount)}
                        <img src={xmr} alt="XMR" class="w-3 h-3 ml-1"/>
                      </Badge>
                      <span class="text-xs text-muted-foreground">{formatTimeAgo(donation.donation_date)}</span>
                    </div>
                    {#if donation.badges && donation.badges.length > 0}
                      <div class="mt-2">
                        <BadgeList badges={donation.badges} size="xs" maxVisible={2} />
                      </div>
                    {/if}
                  </div>
                </div>
                {#if donation.message}
                  <div class="mt-3 pt-3 border-t border-border/50">
                    <p class="text-xs text-muted-foreground line-clamp-2 italic">"{donation.message}"</p>
                  </div>
                {/if}
              </div>
            {/each}
          </Marquee>

          <!-- Gradient Overlays for smooth edges -->
          <div class="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
          <div class="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10"></div>
        </div>
      {/if}


  <MagicCard class="p-3 sm:p-6 rounded-xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
                        <img src={xmr} alt="XMR" class="w-9 h-9"/>
        {t('donations.makeDonation')}
      </CardTitle>
      <CardDescription>
        {t('donations.makeDonationDescription')}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4 mt-4">
      <div>
        <h3 class="font-semibold mb-2">{t('donations.walletAddress')}</h3>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted rounded-lg">
          <code class="text-sm flex-1 font-mono break-all">{walletAddress}</code>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onclick={() => copyToClipboard(walletAddress)}
              title={t('donations.copyAddress')}
              class="flex-1 sm:flex-none"
            >
              <Copy class="w-4 h-4 sm:mr-2" />
              <span class="hidden sm:inline">{t('donations.copyAddress')}</span>
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onclick={() => showWalletDialog = true}
              title={t('donations.selectWallet')}
              class="flex-1 sm:flex-none"
            >
              <ExternalLink class="w-4 h-4 sm:mr-2" />
              <span class="hidden sm:inline">{t('donations.openInWallet')}</span>
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <!-- Toggle Form Button -->
      <Button 
        class="w-full" 
        variant={showForm ? "secondary" : "default"}
        onclick={() => showForm = !showForm}
      >
        {#if showForm}
          {t('donations.closeForm')}
        {:else}
          {t('donations.iDonated')}
        {/if}
      </Button>
      
      <!-- Donation Submission Form -->
      {#if showForm}
        <div class="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 class="font-semibold">{t('donations.enterDonationInfo')}</h3>
          
          <div class="space-y-2">
            <Label for="amount">{t('donations.amount')} *</Label>
            <Input 
              id="amount"
              type="number" 
              step="0.000001"
              placeholder={t('donations.amountPlaceholder')}
              bind:value={amount}
            />
          </div>
          
          <div class="space-y-2">
            <Label for="txid">{t('donations.txid')} *</Label>
            <Input 
              id="txid"
              type="text" 
              placeholder={t('donations.txidPlaceholder')}
              bind:value={txid}
            />
          </div>
          
          <div class="space-y-2">
            <Label for="date">{t('donations.date')} *</Label>
            <Input 
              id="date"
              type="datetime-local" 
              bind:value={donationDate}
            />
          </div>
          
          <!-- Hidden display name for logged in users -->
          {#if currentUser}
            <input type="hidden" name="displayName" bind:value={displayName} />
          {/if}
          
          <div class="space-y-2">
            <Label for="message">{t('donations.message')}</Label>
            <Textarea 
              id="message"
              placeholder={t('donations.messagePlaceholder')}
              bind:value={message}
              rows={3}
            />
          </div>
          
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock class="w-4 h-4" />
            <span>{t('donations.approvalNotice')}</span>
          </div>
          
          <Button 
            class="w-full" 
            onclick={submitDonation}
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <Loader class="animate-spin text-primary" />
              {t('donations.submitting')}
            {:else}
              <Send class="w-4 h-4 mr-2" />
              {t('donations.submitDonation')}
            {/if}
          </Button>
        </div>
      {/if}
      
      <Separator />
      
      <div>
        <h3 class="font-semibold mb-2">{t('donations.donationInfo')}</h3>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li>• {t('donations.acceptedCurrency')}</li>
          <li>• {t('donations.minimumAmount')}</li>
          <li>• {t('donations.usage')}</li>
          <li>• {t('donations.transparency')}</li>
        </ul>
      </div>
    </CardContent>
  </MagicCard>

  <MagicCard class="p-3 sm:p-6 rounded-xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5" />
        {t('donations.topDonors')}
      </CardTitle>
      <CardDescription>
        {t('donations.topDonorsDescription')}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {#if isLoading}
        <div class="flex items-center justify-center h-32">
          <Loader class="animate-spin text-primary" />
        </div>
      {:else if topDonors.length === 0}
        <div class="flex items-center justify-center h-32 text-muted-foreground">
          {t('donations.noDonations')}
        </div>
      {:else}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('donations.rank')}</TableHead>
              <TableHead>{t('donations.user')}</TableHead>
              <TableHead>{t('donations.totalDonation')}</TableHead>
              <TableHead>{t('donations.donationCount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each topDonors as donor (donor.rank)}
              <TableRow>
                <TableCell>
                  <Badge variant={donor.rank <= 3 ? "default" : "secondary"}>
                    #{donor.rank}
                  </Badge>
                </TableCell>
                <TableCell class="font-medium">
                  <div class="flex items-center gap-2">
                    {#if donor.donor_avatar}
                      <a 
                        href="/{getTopDonorIdentifier(donor)}"
                        class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <img 
                          src={donor.donor_avatar} 
                          alt={getTopDonorDisplayName(donor)}
                          class="w-6 h-6 rounded-full object-cover"
                        />
                      </a>
                    {:else if hasTopDonorInfo(donor)}
                      <a 
                        href="/{getTopDonorIdentifier(donor)}"
                        class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User class="w-3 h-3 text-primary-500" />
                        </div>
                      </a>
                    {:else}
                      <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User class="w-3 h-3 text-primary-500" />
                      </div>
                    {/if}
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        {#if hasTopDonorInfo(donor)}
                          <a 
                            href="/{getTopDonorIdentifier(donor)}"
                            class="hover:text-primary transition-colors"
                          >
                            {getTopDonorDisplayName(donor)}
                          </a>
                        {:else}
                          <span>{getTopDonorDisplayName(donor)}</span>
                        {/if}
                        {#if donor.badges && donor.badges.length > 0}
                          <BadgeList badges={donor.badges} size="sm" maxVisible={3} />
                        {/if}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-green-600 font-semibold">{formatAmount(donor.totalAmount)} XMR</TableCell>
                <TableCell>{donor.donationCount}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/if}
    </CardContent>
  </MagicCard>

  <DonationChart />

  <!-- Monero Badges Section -->
  <MoneroBadges />

  <!-- Monero Hakkında Bilgi Kartı -->
  <MagicCard class="p-3 sm:p-6 rounded-xl">
    <CardHeader class="w-full flex-col justify-center">
      <CardTitle class="text-4xl text-primary font-bold flex flex-row justify-center items-center gap-3">
        <div bind:this={moneroContainer} class="w-34 h-full"></div>
        {t('donations.monero.whatIs')}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-foreground/90">
        {t('donations.monero.description')}
      </p>
      
      <div class="space-y-2">
        <h3 class="font-semibold text-lg">{t('donations.monero.featuresTitle')}</h3>
        <ul class="list-disc pl-5 space-y-1 list-inside">
          <li><span class="font-medium">{t('donations.monero.privacy')}</span> {t('donations.monero.privacyDesc')}</li>
          <li><span class="font-medium">{t('donations.monero.security')}</span> {t('donations.monero.securityDesc')}</li>
          <li><span class="font-medium">{t('donations.monero.fungibility')}</span> {t('donations.monero.fungibilityDesc')}</li>
          <li><span class="font-medium">{t('donations.monero.decentralized')}</span> {t('donations.monero.decentralizedDesc')}</li>
        </ul>
      </div>

      <div class="bg-muted/50 p-4 rounded-lg">
        <h4 class="font-semibold mb-2">{t('donations.monero.howToGet')}</h4>
        <p class="text-sm text-foreground/80">
          {t('donations.monero.walletInfo')} 
          <a href="https://www.getmonero.org/downloads/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">{t('donations.monero.walletLink')}</a>
        </p>
      </div>
    </CardContent>
  </MagicCard>
</section>

<!-- Monero Wallet Dialog -->
<MoneroWalletDialog open={showWalletDialog} {walletAddress} on:close={() => showWalletDialog = false} />
