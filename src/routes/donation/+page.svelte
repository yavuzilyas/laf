<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Copy, Heart, TrendingUp, Users, MessageCircle } from '@lucide/svelte';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
import { HandCoinsIcon } from 'svelte-animate-icons';
  import { Motion, useMotionValue, useMotionTemplate } from "svelte-motion";
 import weusexmr from "$lib/assets/image759.svg";
  // Mock data for demonstration
  let donations = $state([
    {
      id: 1,
      name: "Ahmet Yılmaz",
      amount: 0.5,
      message: "Harika bir platform, destekliyorum!",
      timestamp: new Date("2024-12-10T14:30:00")
    },
    {
      id: 2,
      name: "Ayşe Demir",
      amount: 0.25,
      message: "Devamını bekliyorum, teşekkürler",
      timestamp: new Date("2024-12-10T12:15:00")
    },
    {
      id: 3,
      name: "Mehmet Kaya",
      amount: 1.0,
      message: "Özgürlük için destek çok önemli",
      timestamp: new Date("2024-12-09T18:45:00")
    },
    {
      id: 4,
      name: "Zeynep Çelik",
      amount: 0.3,
      message: "Emeğinize sağlık",
      timestamp: new Date("2024-12-09T16:20:00")
    },
    {
      id: 5,
      name: "Mustafa Öztürk",
      amount: 0.75,
      message: "Bu projeyi çok önemsiyorum",
      timestamp: new Date("2024-12-08T20:10:00")
    }
  ]);

  let topDonors = $state([
    { rank: 1, name: "Ali Vefa", totalAmount: 12.5, donationCount: 15 },
    { rank: 2, name: "Fatma Aksoy", totalAmount: 9.0, donationCount: 12 },
    { rank: 3, name: "Hasan Hüseyin", totalAmount: 6.0, donationCount: 8 },
    { rank: 4, name: "Elif Güneş", totalAmount: 4.75, donationCount: 6 },
    { rank: 5, name: "Murat Yıldız", totalAmount: 3.75, donationCount: 5 }
  ]);

  const walletAddress = "44AFFMp5edwsF2V1nJpTAPvEBkssGkEQqmHqH6cBDPU";
  let isMoneroCardExpanded = $state(false);
  
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Cüzdan adresi kopyalandı!', 'success');
    }).catch(() => {
      showToast('Kopyalama başarısız oldu', 'error');
    });
  }

  function formatTimeAgo(date: Date): string {
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

</script>

  <Navbar />
  
  <main class="container px-4 py-8 max-w-7xl flex flex-col mx-auto gap-10">
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


        <Card class="h-full">
          <CardContent class="p-6 h-full">
            {#if !isMoneroCardExpanded}
              <!-- Collapsed state -->
              <div class="flex items-center justify-center h-full">
                <h2 class="text-xl font-semibold text-primary">Monero nedir?</h2>
              </div>
            {:else}
              <!-- Expanded state -->
              <div class="space-y-6 h-full overflow-auto">
                <div class="flex items-center justify-between">
                  <h2 class="text-3xl font-bold text-primary">Monero (XMR) Nedir?</h2>
                  <Button variant="ghost" size="sm">
                    <Heart class="w-5 h-5" />
                  </Button>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 class="text-xl font-semibold mb-4">Gizlilik Odaklı Kripto Para</h3>
                    <p class="text-muted-foreground mb-4">
                      Monero, gizlilik ve güvenlik ön planda tutularak tasarlanmış merkeziyetsiz bir kripto para birimidir. 
                      İşlemleriniz tamamen gizli ve izlenemez.
                    </p>
                    
                    <h4 class="font-semibold mb-2">Özellikleri:</h4>
                    <ul class="space-y-2 text-sm text-muted-foreground">
                      <li>• Ring Signatures - Gönderenin kimliğini gizler</li>
                      <li>• Stealth Addresses - Alıcının kimliğini gizler</li>
                      <li>• RingCT - İşlem miktarını gizler</li>
                      <li>• IP obfuscation - Ağ katmanında gizlilik</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 class="text-xl font-semibold mb-4">Neden Monero?</h3>
                    <p class="text-muted-foreground mb-4">
                      Özgürlük ve gizlilik ilkelerine uygun olarak, Monero finansal mahremiyeti korurken 
                      özgürlük projelerini desteklemek için ideal bir seçenektir.
                    </p>
                    
                    <h4 class="font-semibold mb-2">Avantajları:</h4>
                    <ul class="space-y-2 text-sm text-muted-foreground">
                      <li>• Tamamen gizli işlemler</li>
                      <li>• Takip edilemez transferler</li>
                      <li>• Merkeziyetsiz yapı</li>
                      <li>• Açık kaynak kodlu</li>
                      <li>• Pasif gelir ( Proof of Work)</li>
                    </ul>
                  </div>
                </div>
                
                <div class="bg-muted p-4 rounded-lg">
                  <h4 class="font-semibold mb-2">Özgürlük Projeleri İçin Neden Önemli?</h4>
                  <p class="text-sm text-muted-foreground">
                    Monero, özgürlük ve mahremiyet ilkelerine sahip projeler için finansal gizlilik sağlar. 
                    Bu sayede destekçilerinizin kimliği ve bağış miktarları güvende kalır.
                  </p>
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>


    <!-- Main Content Grid -->
    <div class="grid lg:grid-cols-2 gap-10 ">

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Heart class="w-5 h-5" />
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
                <code class="text-sm flex-1 font-mono">{walletAddress}</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onclick={() => copyToClipboard(walletAddress)}
                >
                  <Copy class="w-4 h-4" />
                </Button>
              </div>
            </div>
            
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
              <Users class="w-5 h-5" />
              Bağış Yapanlar
            </CardTitle>
            <CardDescription>
              Son bağış yapanlar ve mesajları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea class="h-96">
              <div class="space-y-4">
                {#each donations as donation (donation.id)}
                  <div class="p-4 border rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Heart class="w-4 h-4 text-red-500" />
                        </div>
                        <span class="font-medium">{donation.name}</span>
                      </div>
                      <div class="text-right">
                        <Badge variant="secondary" class="text-green-600">
                          {donation.amount} XMR
                        </Badge>
                        <div class="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(donation.timestamp)}
                        </div>
                      </div>
                    </div>
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
            </ScrollArea>
          </CardContent>
        </Card>
    </div>


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
                <TableCell class="font-medium">{donor.name}</TableCell>
                <TableCell class="text-green-600 font-semibold">{donor.totalAmount} XMR</TableCell>
                <TableCell>{donor.donationCount}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>



    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <TrendingUp class="w-5 h-5" />
          Bağış Grafiği
        </CardTitle>
        <CardDescription>
          Son 30 günlük bağış istatistikleri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartAreaInteractive />
      </CardContent>
    </Card>

    <!-- Monero Hakkında Bilgi Kartı -->
    <Card class="mt-12">
      <CardHeader class="w-full flex-col justify-center">

        <CardTitle class="text-4xl text-primary font-bold flex flex-row justify-center items-center gap-3">
                    <img src={weusexmr} alt="weusexmr" class="w-auto h-48 -mt-3"/>

          Monero (XMR) Nedir?
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

<Footer />
