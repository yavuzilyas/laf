<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import MnemonicVerificationPopup from '$lib/components/MnemonicVerificationPopup.svelte';
  // @ts-ignore - SvelteKit internal module
  import { page } from '$app/stores';
  // @ts-ignore - SvelteKit internal module
  import { goto, invalidateAll } from '$app/navigation';

  let { data } = $props();
  let tableData = $state(data.tableData ?? []);
  let selectedUsers = $state<Set<string>>(new Set());
  let showBulkActions = $state(false);

  $effect(() => {
    tableData = data.tableData ?? [];
    // Reset selection when table data changes
    selectedUsers = new Set();
    showBulkActions = false;
  });

  let currentUser = data.currentUser;
  let showDeleteDialog = $state(false);
  let pendingDeleteUserId = $state<string | null>(null);
  let deleteDialogResolver: (() => void) | null = null;
  
  // Mnemonic verification state
  let showMnemonicVerification = $state(false);
  let pendingAction = $state<() => Promise<void>>();
  let verificationToken = $state<string | null>(null);
  
  // Handle mnemonic verification
  function requestMnemonicVerification(action: () => Promise<void>) {
    pendingAction = action;
    showMnemonicVerification = true;
  }
  
  async function handleMnemonicVerified(token: string) {
    showMnemonicVerification = false;
    verificationToken = token;
    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        console.error("Action failed after verification:", error);
        showToast("İşlem sırasında bir hata oluştu", "error");
      }
      pendingAction = null;
    }
  }
  
  function handleMnemonicCancel() {
    showMnemonicVerification = false;
    pendingAction = null;
  }
  
  let stats = $state({
    reportedArticles: 0,
    reportedComments: 0,
    reportedUsers: 0,
    hiddenArticles: 0,
    hiddenComments: 0,
    totalReports: 0
  });

  let reports = $state({
    articles: [] as any[],
    comments: [] as any[],
    users: [] as any[]
  });

  let loading = $state(true);
  let activeTab = $state('overview');

  async function fetchStats() {
    try {
      const response = await fetch('/api/moderation/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function fetchReports() {
    try {
      const response = await fetch('/api/moderation/reports');
      if (response.ok) {
        reports = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  }

  async function refreshModerationData() {
    await Promise.all([fetchStats(), fetchReports()]);
    await invalidateAll();
  }

  async function performAction(action: string, type: string, id: string, reason?: string) {
    try {
      const response = await fetch('/api/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type, id, reason })
      });

      if (response.ok) {
        showToast(t('moderation.actionSuccess'), 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || t('moderation.actionFailed'), 'error');
      }
    } catch (error) {
      console.error('Action failed:', error);
      showToast(t('moderation.actionFailed'), 'error');
    }
  }

  // Bulk actions
  function toggleUserSelection(userId: string) {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    selectedUsers = newSelection;
    showBulkActions = newSelection.size > 0;
  }

  function selectAllUsers() {
    if (selectedUsers.size === tableData.length) {
      selectedUsers = new Set();
    } else {
      selectedUsers = new Set(tableData.map((user: any) => user.id));
    }
    showBulkActions = selectedUsers.size > 0;
  }

  async function banSelectedUsers() {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Yetkiniz yok', 'error');
      return;
    }

    try {
      const promises = Array.from(selectedUsers).map(userId => 
        banUser(userId, { skipToast: true })
      );
      
      await Promise.all(promises);
      showToast(`${selectedUsers.size} kullanıcı yasaklandı`, 'success');
      selectedUsers = new Set();
      showBulkActions = false;
      await refreshModerationData();
    } catch (error) {
      showToast('Toplu işlem sırasında hata oluştu', 'error');
    }
  }

  async function unbanSelectedUsers() {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Yetkiniz yok', 'error');
      return;
    }

    try {
      const promises = Array.from(selectedUsers).map(userId => 
        unbanUser(userId, { skipToast: true })
      );
      
      await Promise.all(promises);
      showToast(`${selectedUsers.size} kullanıcının yasağı kaldırıldı`, 'success');
      selectedUsers = new Set();
      showBulkActions = false;
      await refreshModerationData();
    } catch (error) {
      showToast('Toplu işlem sırasında hata oluştu', 'error');
    }
  }

  async function deleteSelectedUsers() {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Yetkiniz yok', 'error');
      return;
    }

    try {
      const promises = Array.from(selectedUsers).map(userId => 
        deleteUser(userId, { skipConfirm: true, skipToast: true })
      );
      
      await Promise.all(promises);
      showToast(`${selectedUsers.size} kullanıcı silindi`, 'success');
      selectedUsers = new Set();
      showBulkActions = false;
      await refreshModerationData();
    } catch (error) {
      showToast('Toplu silme işlemi sırasında hata oluştu', 'error');
    }
  }

  async function banUser(userId: string, options: { skipToast?: boolean } = {}) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Kullanıcı yasaklandı', 'success');
        await refreshModerationData();
      } else {
        showToast('Yasaklama başarısız', 'error');
      }
    } catch (error) {
      showToast('Yasaklama hatası', 'error');
    }
  }

  async function unbanUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/ban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Yasaklama kaldırıldı', 'success');
        await refreshModerationData();
      } else {
        showToast('İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function hideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Kullanıcı gizlendi', 'success');
        await refreshModerationData();
      } else {
        showToast('Gizleme başarısız', 'error');
      }
    } catch (error) {
      showToast('Gizleme hatası', 'error');
    }
  }

  async function unhideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/hide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Görünürlük geri açıldı', 'success');
        await refreshModerationData();
      } else {
        showToast('İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  function openDeleteDialog(userId: string, resolver: () => void) {
    pendingDeleteUserId = userId;
    deleteDialogResolver = resolver;
    showDeleteDialog = true;
  }

  function handleDeleteDialogCancel() {
    pendingDeleteUserId = null;
    showDeleteDialog = false;
    deleteDialogResolver?.();
    deleteDialogResolver = null;
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    showDeleteDialog = open;
    if (!open && pendingDeleteUserId) {
      handleDeleteDialogCancel();
    }
  }

  async function handleDeleteDialogConfirm() {
    const userId = pendingDeleteUserId;
    const resolver = deleteDialogResolver;
    pendingDeleteUserId = null;
    deleteDialogResolver = null;
    showDeleteDialog = false;

    if (userId) {
      await performDelete(userId);
    }

    resolver?.();
  }

  async function performDelete(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    const executeDelete = async () => {
      try {
        const response = await fetch('/api/moderation/delete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(verificationToken ? { 'X-Verification-Token': verificationToken } : {})
          },
          body: JSON.stringify({ 
            userId, 
            reason: 'Moderator action', 
            moderatorId: currentUser.id 
          })
        });

        if (response.ok) {
          showToast('Hesap silme işlemi başlatıldı', 'success');
          await refreshModerationData();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.message || 'Silme başarısız', 'error');
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Silme hatası', 'error');
      }
    };

    if (verificationToken) {
      await executeDelete();
    } else {
      requestMnemonicVerification(executeDelete);
    }
  }

  async function deleteUser(userId: string, options?: { skipConfirm?: boolean }) {
    if (!options?.skipConfirm) {
      return new Promise<void>((resolve) => openDeleteDialog(userId, resolve));
    }

    await performDelete(userId);
  }

  async function undoDeleteUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/delete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason: 'Moderator action', 
          moderatorId: currentUser.id 
        })
      });

      if (response.ok) {
        showToast('Hesap silme işlemi iptal edildi', 'success');
        await refreshModerationData();
      } else {
        showToast('İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function promoteToModerator(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Bu işlem için admin yetkisi gerekiyor', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'promote',
          moderatorId: currentUser.id
        })
      });

      if (response.ok) {
        showToast('Kullanıcı moderatör yapıldı', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function demoteToUser(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Bu işlem için admin yetkisi gerekiyor', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'demote',
          moderatorId: currentUser.id
        })
      });

      if (response.ok) {
        showToast('Kullanıcının moderatörlüğü kaldırıldı', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'İşlem başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  function formatDate(date: string | Date) {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  async function loadData() {
    loading = true;
    await Promise.all([fetchStats(), fetchReports()]);
    loading = false;
  }

  $effect(() => {
    loadData();
  });


	import SectionCards from "$lib/components/section-cards.svelte";
	import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
	import DataTable from "$lib/components/data-table.svelte";
</script>

<svelte:head>
  <title>{t('Moderation')} - LAF</title>
</svelte:head>

<!-- Add Mnemonic Verification Popup -->
<MnemonicVerificationPopup
  bind:openVerif={showMnemonicVerification}
  onVerified={handleMnemonicVerified}
  onCancel={handleMnemonicCancel}
/>
<Navbar />
		<div class=" flex flex-1 flex-col items-center ">
			<div class="@container/main w-full max-w-7xl flex-1 px-2 sm:px-4">
			<div class="flex flex-col gap-3 py-3 sm:gap-4 sm:py-4 md:gap-5 md:py-5">
          <div class="w-full flex justify-center items-center px-2">
            <h1 class="text-xl font-bold sm:text-2xl">{t('ModerationAndAnalysis')}</h1>
          </div>
          <div class="overflow-hidden">
            <SectionCards />
          </div>
          <div class="px-1 sm:px-2 lg:px-4">
            <ChartAreaInteractive />
          </div>
          
          {#if showBulkActions}
            <div class="bg-muted/50 p-3 rounded-lg mb-4 flex items-center justify-between flex-wrap gap-2">
              <div class="text-sm font-medium">
                {selectedUsers.size} öğe seçildi
              </div>
              <div class="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  on:click={() => {
                    banSelectedUsers();
                  }}
                >
                  <BanIcon class="h-4 w-4 mr-2" />
                  Yasakla
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  on:click={() => {
                    unbanSelectedUsers();
                  }}
                >
                  <CheckCircleIcon class="h-4 w-4 mr-2" />
                  Yasak Kaldır
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  on:click={() => {
                    deleteSelectedUsers();
                  }}
                >
                  <Trash2Icon class="h-4 w-4 mr-2" />
                  Seçileni Sil
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  on:click={() => {
                    selectedUsers = new Set();
                    showBulkActions = false;
                  }}
                >
                  <XCircleIcon class="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            </div>
          {/if}
          
          <DataTable
            data={tableData}
            {banUser}
            {unbanUser}
            {hideUser}
            {unhideUser}
            {deleteUser}
            {undoDeleteUser}
            {currentUser}
            {promoteToModerator}
            {demoteToUser}
            selectedUsers={selectedUsers}
            onToggleUserSelection={toggleUserSelection}
            onSelectAllUsers={selectAllUsers}
            showCheckboxes={true}
          />

				<AlertDialog.Root bind:open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
					<AlertDialog.Content class="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
				<AlertDialog.Header>
					<AlertDialog.Title class="text-lg sm:text-xl">
						{t('AreYouSure') ?? 'Silme işlemini onaylayın'}
					</AlertDialog.Title>
					<AlertDialog.Description class="text-sm sm:text-base">
						{t('DeleteAccountConfirm') ?? 'Bu hesabı silmek istediğinizden emin misiniz? Hesap hemen gizlenecek ve 48 saat sonra tamamen silinecektir.'}
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer class="flex flex-col sm:flex-row gap-2 sm:justify-end">
					<AlertDialog.Cancel 
            class="w-full sm:w-auto" 
            onclick={handleDeleteDialogCancel}
          >
						{t('Cancel') ?? 'İptal'}
					</AlertDialog.Cancel>
					<AlertDialog.Action 
            class="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90" 
            onclick={handleDeleteDialogConfirm}
          >
						{t('ConfirmDelete') ?? 'Sil'}
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
		</div>
	</div>

<Footer />
