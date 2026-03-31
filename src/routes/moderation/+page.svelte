<script lang="ts">
  import Navbar from '$lib/Navbar.svelte';
  import Footer from '$lib/Footer.svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { showToast } from '$lib/hooks/toast';
  import MnemonicVerificationPopup from '$lib/components/MnemonicVerificationPopup.svelte';
	import PasswordVerificationPopup from '$lib/components/PasswordVerificationPopup.svelte';
 	import SectionCards from "$lib/components/section-cards.svelte";
 	import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
 	import DataTable from "$lib/components/data-table.svelte";
   // @ts-ignore - SvelteKit internal module
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let tableData = $state(data.tableData ?? []);

  $effect(() => {
    tableData = data.tableData ?? [];
  });

  let currentUser = data.currentUser;
  let showDeleteDialog = $state(false);
  let pendingDeleteUserId = $state<string | null>(null);
  let deleteDialogResolver: (() => void) | null = null;
  
  // Mnemonic verification state
  let showMnemonicVerification = $state(false);
  let showPasswordVerification = $state(false);
  let pendingAction = $state<(() => Promise<void>) | null>(null);
  let verificationToken = $state<string | null>(null);
  
  // Handle mnemonic verification
  function requestMnemonicVerification(action: () => Promise<void>) {
    pendingAction = action;
    showPasswordVerification = true;
  }
  
  async function handlePasswordVerified(token: string) {
    showPasswordVerification = false;
    verificationToken = token;
    showMnemonicVerification = true;
  }
  
  function handlePasswordCancel() {
    showPasswordVerification = false;
    pendingAction = null;
  }
  
  async function handleMnemonicVerified(token: string) {
    showMnemonicVerification = false;
    verificationToken = token;
    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        showToast("An error occurred during the operation", "error");
      }
      pendingAction = null;
    }
  }
  
  function handleMnemonicCancel() {
    showMnemonicVerification = false;
    pendingAction = null;
  }
  
  async function refreshModerationData() {
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
      showToast(t('moderation.actionFailed'), 'error');
    }
  }

  async function banUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
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
        showToast('User banned', 'success');
        await refreshModerationData();
      } else {
        showToast('Ban failed', 'error');
      }
    } catch (error) {
      showToast('Ban error', 'error');
    }
  }

  async function unbanUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
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
        showToast('Ban removed', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function hideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
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
        showToast('User hidden', 'success');
        await refreshModerationData();
      } else {
        showToast('Hide failed', 'error');
      }
    } catch (error) {
      showToast('Hide error', 'error');
    }
  }

  async function unhideUser(userId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
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
        showToast('Visibility restored', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
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
      showToast('User information could not be retrieved', 'error');
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
          showToast('Account deletion process started', 'success');
          await refreshModerationData();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.message || 'Deletion failed', 'error');
        }
      } catch (error) {
        showToast('Deletion error', 'error');
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
      showToast('User information could not be retrieved', 'error');
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
        showToast('Account deletion cancelled', 'success');
        await refreshModerationData();
      } else {
        showToast('Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function promoteToModerator(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Admin privileges required for this operation', 'error');
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
        showToast('User promoted to moderator', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  async function demoteToUser(userId: string) {
    if (currentUser?.role !== 'admin') {
      showToast('Admin privileges required for this operation', 'error');
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
        showToast('User moderator role removed', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error ?? 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation error', 'error');
    }
  }

  $effect(() => {
    void refreshModerationData();
  });

  // Donation moderation functions
  async function approveDonation(donationId: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/donations/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          donationId
        })
      });

      if (response.ok) {
        showToast('Bağış onaylandı', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Onay başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }

  async function rejectDonation(donationId: string, reason?: string) {
    if (!currentUser?.id || currentUser.id === 'unknown') {
      showToast('User information could not be retrieved', 'error');
      return;
    }

    try {
      const response = await fetch('/api/donations/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          donationId,
          rejectionReason: reason
        })
      });

      if (response.ok) {
        showToast('Bağış reddedildi', 'success');
        await refreshModerationData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Red başarısız', 'error');
      }
    } catch (error) {
      showToast('İşlem hatası', 'error');
    }
  }
</script>

<svelte:head>
  <title>{t('Moderation')} - LAF</title>
</svelte:head>

<!-- Password Verification Popup -->
<PasswordVerificationPopup
  bind:openVerif={showPasswordVerification}
  onVerified={handlePasswordVerified}
  onCancel={handlePasswordCancel}
  title="Moderator Action Confirmation"
  description="You need to verify your account password to perform moderator actions."
/>

<!-- Add Mnemonic Verification Popup -->
<MnemonicVerificationPopup
  bind:openVerif={showMnemonicVerification}
  verificationToken={verificationToken}
  onVerified={handleMnemonicVerified}
  onCancel={handleMnemonicCancel}
/>

<Navbar />
		<div class=" flex flex-1 flex-col items-center ">
			<div class="@container/main w-full max-w-[96vw] flex-1 px-2 sm:px-4">
			<div class="flex flex-col gap-3 py-3 sm:gap-4 sm:py-4 md:gap-5 md:py-5">
          <div class="w-full flex justify-center items-center px-2 mt-10">

            <h1 class="text-xl font-bold sm:text-2xl">{t('ModerationAndAnalysis')}</h1>
          </div>
 
          
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
            {approveDonation}
            {rejectDonation}
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
