<script lang="ts">
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Check, X, Clock, Eye, Heart } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let donations = $state<any[]>([]);
  let isLoading = $state(true);
  let selectedStatus = $state('pending');

  let { approveDonation, rejectDonation } = $props();

  onMount(() => {
    fetchDonations();
  });

  async function fetchDonations() {
    isLoading = true;
    try {
      const response = await fetch(`/api/donations/moderate?status=${selectedStatus}`);
      if (response.ok) {
        const data = await response.json();
        donations = data.donations || [];
      }
    } catch (error) {
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    fetchDonations();
  });

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function handleApprove(id: string) {
    await approveDonation(id);
    await fetchDonations();
  }

  async function handleReject(id: string) {
    const reason = prompt('Red nedeni (isteğe bağlı):');
    await rejectDonation(id, reason || undefined);
    await fetchDonations();
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-2">
    <Button 
      variant={selectedStatus === 'pending' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => selectedStatus = 'pending'}
    >
      <Clock class="w-4 h-4 mr-1" />
      Bekleyenler
    </Button>
    <Button 
      variant={selectedStatus === 'approved' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => selectedStatus = 'approved'}
    >
      <Check class="w-4 h-4 mr-1" />
      Onaylananlar
    </Button>
    <Button 
      variant={selectedStatus === 'rejected' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => selectedStatus = 'rejected'}
    >
      <X class="w-4 h-4 mr-1" />
      Reddedilenler
    </Button>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if donations.length === 0}
    <div class="flex items-center justify-center h-32 text-muted-foreground">
      {selectedStatus === 'pending' ? 'Bekleyen bağış yok' : 'Bağış bulunmuyor'}
    </div>
  {:else}
    <div class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bağışçı</TableHead>
            <TableHead>Tutar (XMR)</TableHead>
            <TableHead>TXID</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead>Mesaj</TableHead>
            <TableHead>Durum</TableHead>
            {#if selectedStatus === 'pending'}
              <TableHead class="text-right">İşlemler</TableHead>
            {/if}
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each donations as donation (donation.id)}
            <TableRow>
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  {#if donation.donor_avatar}
                    <img 
                      src={donation.donor_avatar} 
                      alt={donation.donor_username || donation.display_name}
                      class="w-6 h-6 rounded-full object-cover"
                    />
                  {:else}
                    <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart class="w-3 h-3 text-red-500" />
                    </div>
                  {/if}
                  {#if donation.donor_username}
                    <a 
                      href="/profile/{donation.donor_username}"
                      class="hover:text-primary transition-colors"
                    >
                      {donation.display_name || 
                       (donation.donor_name && donation.donor_surname 
                        ? `${donation.donor_name} ${donation.donor_surname}` 
                        : donation.donor_username) || 'Anonim'}
                    </a>
                  {:else}
                    <span>{donation.display_name || 'Anonim'}</span>
                  {/if}
                </div>
              </TableCell>
              <TableCell class="text-green-600 font-semibold">
                {donation.amount}
              </TableCell>
              <TableCell class="font-mono text-xs max-w-[150px] truncate" title={donation.txid}>
                {donation.txid}
              </TableCell>
              <TableCell class="text-sm">
                {formatDate(donation.donation_date)}
              </TableCell>
              <TableCell class="max-w-[200px]">
                {#if donation.message}
                  <span class="text-sm text-muted-foreground truncate block" title={donation.message}>
                    {donation.message}
                  </span>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </TableCell>
              <TableCell>
                {#if donation.status === 'pending'}
                  <Badge variant="outline" class="text-yellow-600 border-yellow-600">Bekliyor</Badge>
                {:else if donation.status === 'approved'}
                  <Badge variant="outline" class="text-green-600 border-green-600">Onaylandı</Badge>
                {:else if donation.status === 'rejected'}
                  <Badge variant="outline" class="text-red-600 border-red-600">Reddedildi</Badge>
                {:else}
                  <Badge variant="outline">{donation.status}</Badge>
                {/if}
              </TableCell>
              {#if selectedStatus === 'pending'}
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      class="text-green-600 hover:text-green-700"
                      onclick={() => handleApprove(donation.id)}
                    >
                      <Check class="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      class="text-red-600 hover:text-red-700"
                      onclick={() => handleReject(donation.id)}
                    >
                      <X class="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
