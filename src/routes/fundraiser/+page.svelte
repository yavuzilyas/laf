<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import BadgeList from '$lib/components/BadgeList.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Copy, User, TrendingUp, Users, MessageCircle, Send, CheckCircle, Clock } from '@lucide/svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import DonationChart from "$lib/components/donation-chart.svelte";
  import { HandCoinsIcon } from 'svelte-animate-icons';
  import weusexmr from "$lib/assets/image759.svg";
    import xmr from "$lib/assets/xmr.svg";
  import MoneroWalletDialog from '$lib/components/monero-wallet-dialog.svelte';
  import MoneroBadges from '$lib/components/monero-badges.svelte';

  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';

  // Real data from API
    import Loader from "@lucide/svelte/icons/loader";
  let donations = $state<any[]>([]);
  let topDonors = $state<any[]>([]);
  let totalAmount = $state(0);
  let isLoading = $state(true);

  // Subscribe to user store
  let currentUser = $derived(userStore.user);

  // Form state
  let amount = $state('');
  let txid = $state('');
  let donationDate = $state('');
  let message = $state('');
  let displayName = $state('');
  let isSubmitting = $state(false);
  let showForm = $state(false);

  const walletAddress = "44AFFMp5edwsF2V1nJpTAPvEBkssGkEQqmHqH6cBDPU";
  let isMoneroCardExpanded = $state(false);
  let showWalletDialog = $state(false);

  onMount(() => {
    fetchDonations();
    userStore.fetchUser();
    // Set default date to now
    const now = new Date();
    donationDate = now.toISOString().slice(0, 16);
        loadAnimation1();

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
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    } finally {
      isLoading = false;
    }
  }

  async function submitDonation() {
    if (!amount || !txid || !donationDate) {
      showToast('Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    if (parseFloat(amount) <= 0) {
      showToast('Bağış tutarı sıfırdan büyük olmalıdır', 'error');
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
      if (currentUser && currentUser.id) {
        payload.user_id = currentUser.id;
      }

      const response = await fetch('/api/donations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast('Bağış talebiniz başarıyla gönderildi! Onay bekleniyor.', 'success');
        // Reset form
        amount = '';
        txid = '';
        message = '';
        displayName = '';
        showForm = false;
        const now = new Date();
        donationDate = now.toISOString().slice(0, 16);
      } else {
        showToast(data.error || 'Bağış kaydedilemedi', 'error');
      }
    } catch (error) {
      showToast('Bağış kaydedilirken bir hata oluştu', 'error');
    } finally {
      isSubmitting = false;
    }
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
          showToast('Cüzdan adresi kopyalandı!', 'success');
    }).catch(() => {
      showToast('Kopyalama başarısız oldu', 'error');
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
    return donation.username || donation.display_name || 'Anonim';
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
    return donor.username || donor.name || 'Anonim';
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
      return `${diffInMinutes} dakika önce`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} gün önce`;
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

  async function loadAnimation1(lang: string) {
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

  <Navbar />
  
  <main class="px-4 py-12 sm:max-w-5/7 flex flex-col mx-auto gap-10">
    <!-- Header Section -->
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
        <HandCoinsIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />
        Bağış
      </h1>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Liberteryen anarşizm ve özgürlük fikirlerini desteklemek için platformumuza bağış yapabilirsiniz. 
        Bağışlarınız, projenin sürdürülebilirliği ve geliştirilmesi için kullanılacaktır.
      </p>
    </div>



    <!-- Main Content Grid -->


        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="w-5 h-5" />
              Bağış Yapanlar
            </CardTitle>
            <CardDescription>
              Son bağış yapanlar ve mesajları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea class="h-120">
              {#if isLoading}
                <div class="flex items-center justify-center h-full">
            <Loader class="animate-spin text-primary" />                </div>
              {:else if donations.length === 0}
                <div class="flex items-center justify-center h-full text-muted-foreground">
                  Henüz bağış yapılmamış
                </div>
              {:else}
                <div class="space-y-4">
                  {#each donations as donation (donation.id)}
                    <div class="p-4 border rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          {#if donation.donor_avatar}
                            <a 
                              href="/{getDonorIdentifier(donation)}"
                              class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <img 
                                src={donation.donor_avatar} 
                                alt={getDonorDisplayName(donation)}
                                class="w-8 h-8 rounded-full object-cover"
                              />
                            </a>
                          {:else if hasDonorInfo(donation)}
                            <a 
                              href="/{getDonorIdentifier(donation)}"
                              class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User class="w-4 h-4 text-primary-500" />
                              </div>
                            </a>
                          {:else}
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User class="w-4 h-4 text-primary-500" />
                            </div>
                          {/if}
                          <div class="flex items-center gap-2 flex-wrap">
                            {#if hasDonorInfo(donation)}
                              <a 
                                href="/{getDonorIdentifier(donation)}"
                                class="font-medium hover:text-primary transition-colors"
                              >
                                {getDonorDisplayName(donation)}
                              </a>
                            {:else}
                              <span class="font-medium">{getDonorDisplayName(donation)}</span>
                            {/if}
                            {#if donation.badges && donation.badges.length > 0}
                              <BadgeList badges={donation.badges} size="xs" maxVisible={3} />
                            {/if}
                          </div>
                        </div>
                        <div class="text-right">

                          <div class="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(donation.donation_date)}
                          </div>
                        </div>
                      </div>
                      <span class="text-xs"> {t("Donated")}</span>
                                                           <Badge variant="amount">
                            {formatAmount(donation.amount)} <img src={xmr} alt="XMR" class="w-4 h-4 rounded-full object-cover"/>
                          </Badge> 
                      {#if donation.message}
                        <div class="mt-3 p-3 bg-muted rounded-lg">
                          <div class="flex items-start gap-2">
                            <MessageCircle class="w-4 h-4 text-muted-foreground mt-0.5" />
                            <p class="text-sm">{donation.message}</p>
                          </div>

                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </ScrollArea>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="w-5 h-5" />
              Bağış Yap
            </CardTitle>
            <CardDescription>
              Platformumuza destek olmak için aşağıdaki bilgileri kullanabilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <h3 class="font-semibold mb-2">Cüzdan Adresi</h3>
              <div class="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code class="text-sm flex-1 font-mono break-all">{walletAddress}</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onclick={() => copyToClipboard(walletAddress)}
                  title="Adresi Kopyala"
                >
                  <Copy class="w-4 h-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onclick={() => showWalletDialog = true}
                  title="Monero Cüzdanını Seç"
                >
                Cüzdanda aç
                </Button>
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
                Formu Kapat
              {:else}
                Bağış Yaptım
              {/if}
            </Button>
            
            <!-- Donation Submission Form -->
            {#if showForm}
              <div class="space-y-4 p-4 border rounded-lg bg-muted/30">
          
                <h3 class="font-semibold">Bağış Bilgilerini Girin</h3>
                
                <div class="space-y-2">
                  <Label for="amount">Bağış Tutarı (XMR) *</Label>
                  <Input 
                    id="amount"
                    type="number" 
                    step="0.000001"
                    placeholder="0.5"
                    bind:value={amount}
                  />
                </div>
                
                <div class="space-y-2">
                  <Label for="txid">İşlem Kimliği (TXID) *</Label>
                  <Input 
                    id="txid"
                    type="text" 
                    placeholder="txid..."
                    bind:value={txid}
                  />
                </div>
                
                <div class="space-y-2">
                  <Label for="date">Bağış Tarihi ve Saati *</Label>
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
                  <Label for="message">Mesaj (İsteğe bağlı)</Label>
                  <Textarea 
                    id="message"
                    placeholder="Bir mesajınız varsa yazın..."
                    bind:value={message}
                    rows={3}
                  />
                </div>
                
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock class="w-4 h-4" />
                  <span>Bağışınız moderatör onayından sonra listelenecektir</span>
                </div>
                
                <Button 
                  class="w-full" 
                  onclick={submitDonation}
                  disabled={isSubmitting}
                >
                  {#if isSubmitting}
            <Loader class="animate-spin text-primary" />
                                Gönderiliyor...
                  {:else}
                    <Send class="w-4 h-4 mr-2" />
                    Bağış Bildir
                  {/if}
                </Button>
              </div>
            {/if}
            
            <Separator />
            
            <div>
              <h3 class="font-semibold mb-2">Bağış Bilgileri</h3>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li>• Monero (XMR) kabul edilmektedir</li>
                <li>• Minimum bağış miktarı: 0.001 XMR</li>
                <li>• Bağışlarınız projenin geliştirilmesi için kullanılır</li>
                <li>• Tüm bağışlar şeffaf bir şekilde kaydedilir</li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-semibold mb-2">Neden Bağış Yapmalısınız?</h3>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li>• Özgürlük fikirlerini desteklemek için</li>
                <li>• Platformun bağımsız kalmasını sağlamak için</li>
                <li>• İçerik kalitesini artırmak için</li>
                <li>• Topluluğun büyümesine katkıda bulunmak için</li>
              </ul>
            </div>
          </CardContent>
        </Card>
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <TrendingUp class="w-5 h-5" />
          En Çok Bağış Yapanlar
        </CardTitle>
        <CardDescription>
          Platformumuza en çok destek olan kullanıcılar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {#if isLoading}
          <div class="flex items-center justify-center h-32">
            <Loader class="animate-spin text-primary" />          </div>
        {:else if topDonors.length === 0}
          <div class="flex items-center justify-center h-32 text-muted-foreground">
            Henüz bağış yapılmamış
          </div>
        {:else}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sıra</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Toplam Bağış</TableHead>
                <TableHead>Bağış Sayısı</TableHead>
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
    </Card>




        <DonationChart />

    <!-- Monero Badges Section -->
    <MoneroBadges />

    <!-- Monero Hakkında Bilgi Kartı -->
    <Card>
      <CardHeader class="w-full flex-col justify-center">

        <CardTitle class="text-4xl text-primary font-bold flex flex-row justify-center items-center gap-3">
<div bind:this={moneroContainer} class="w-34 h-full"></div>

          Nedir?
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-foreground/90">
          Monero, gizlilik odaklı bir kripto paradır. İşlemleriniz tamamen anonim ve takip edilemez şekilde gerçekleşir. Geleneksel kripto paralardan farklı olarak, Monero'da gönderen, alıcı ve işlem tutarı tamamen şifrelenmiştir.
        </p>
        
        <div class="space-y-2">
          <h3 class="font-semibold text-lg">Monero'nun Temel Özellikleri:</h3>
          <ul class="list-disc pl-5 space-y-1 list-inside">
            <li><span class="font-medium">Gizlilik:</span> Tüm işlemler varsayılan olarak özeldir.</li>
            <li><span class="font-medium">Güvenlik:</span> Kriptografik tekniklerle güçlendirilmiş güvenlik.</li>
            <li><span class="font-medium">Takas Edilebilirlik:</span> Her XMR birbirine eşdeğerdir, kara listeleme yoktur.</li>
            <li><span class="font-medium">Merkeziyetsiz:</span> Açık kaynak kodlu ve topluluk tarafından yönetilir.</li>
          </ul>
        </div>

        <div class="bg-muted/50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Monero Cüzdanı Nasıl Alınır?</h4>
          <p class="text-sm text-foreground/80">
            Monero cüzdanı oluşturmak için resmi web sitesini ziyaret edebilirsiniz: 
            <a href="https://www.getmonero.org/downloads/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">getmonero.org/downloads</a>
          </p>
        </div>
      </CardContent>
    </Card>
  </main>

  <!-- Monero Wallet Dialog -->
  <MoneroWalletDialog bind:open={showWalletDialog} {walletAddress} on:close={() => showWalletDialog = false} />

<Footer />
