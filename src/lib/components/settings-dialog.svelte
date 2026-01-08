<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import KeyboardIcon from "@lucide/svelte/icons/keyboard";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import PaintbrushIcon from "@lucide/svelte/icons/paintbrush";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { HandCoins, FileBadge, Construction, Cog, LogIn, CirclePlus, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon, LogOutIcon, LogInIcon, UserRound, Hand, KeyRound, RefreshCw } from "@lucide/svelte";
	import * as Tabs from "$lib/components/ui/vertical-tabs/index.js";
	import Circle from "./Circle.svelte";
	import MnemonicVerificationPopup from "$lib/components/MnemonicVerificationPopup.svelte";
	import { showToast } from "$lib/hooks/toast";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";
      import { t, tJoin, tMany } from '$lib/stores/i18n.svelte.js';
	  	import { playSound } from "$lib/stores/sound"; 

	const settingsData = $derived({
		account: [
			{ name: tJoin(['MyPlus']), value:"account", icon: CirclePlus },
			{ name: tJoin(['MyDonations']), value:"donations", icon: HandCoins },
			{ name: tJoin(['MyAwards']), value:"awards", icon: FileBadge },
		],
		settings: [
			{ name: t('Theme'), value:"theme", icon: PaintbrushIcon },
			{ name: t('Messages'), value:"messages", icon: MessageCircleIcon },
			{ name: tJoin(['Language', 'and', 'Region']), value:"language", icon: GlobeIcon },
			{ name: t('MyPasswords'), value:"passwords", icon: KeyRound },
			{ name: t('Settings'), value:"settings", icon: SettingsIcon },
		],
	});

	// Password change state
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	// Mnemonic regeneration state
	let isRegeneratingMnemonic = $state(false);
	let mnemonicRegenerated = $state(false);
	let mnemonicError = $state('');

	// Change password function
	async function changePassword() {
		if (newPassword !== confirmPassword) {
			passwordError = t('PasswordsDoNotMatch');
			return;
		}

		if (newPassword.length < 8) {
			passwordError = t('PasswordTooShort');
			return;
		}

		isChangingPassword = true;
		passwordError = '';
		passwordSuccess = '';

		try {
			const response = await fetch('/api/account/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
				credentials: 'include'
			});

			const data = await response.json();

			if (response.ok) {
				passwordSuccess = t('PasswordChangedSuccessfully');
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				showToast(t('PasswordChangedSuccessfully'), 'success');
			} else {
				passwordError = data.error || t('FailedToChangePassword');
				showToast(passwordError, 'error');
			}
		} catch (error) {
			console.error('Error changing password:', error);
			passwordError = t('NetworkError');
			showToast(t('NetworkError'), 'error');
		} finally {
			isChangingPassword = false;
		}
	}

	// Regenerate mnemonic phrase
	async function regenerateMnemonic() {
		if (!confirm(t('AreYouSureRegenerateMnemonic'))) {
			return;
		}

		isRegeneratingMnemonic = true;
		mnemonicError = '';

		try {
			const response = await fetch('/api/account/regenerate-mnemonic', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include'
			});

			const data = await response.json();

			if (response.ok) {
				mnemonicRegenerated = true;
				showToast(t('MnemonicRegenerated'), 'success');
				// Show mnemonic phrase to the user (you might want to show this in a secure way)
				if (data.mnemonic) {
					// In a real app, show this in a secure dialog and force the user to write it down
					alert(t('YourNewMnemonic') + ': ' + data.mnemonic);
				}
			} else {
				mnemonicError = data.error || t('FailedToRegenerateMnemonic');
				showToast(mnemonicError, 'error');
			}
		} catch (error) {
			console.error('Error regenerating mnemonic:', error);
			mnemonicError = t('NetworkError');
			showToast(t('NetworkError'), 'error');
		} finally {
			isRegeneratingMnemonic = false;
		}
	}

	let { open = false } = $props(); // Dışarıdan gelecek prop
	
	// Mnemonic doğrulama için state
	let showMnemonicVerification = $state(false);
	let isDeletingAccount = $state(false);
	let verificationToken = $state<string | null>(null);

	// Hesap silme işlemi
	async function deleteAccount() {
		if (!verificationToken) {
			showToast("Doğrulama gerekli", "error");
			return;
		}

		isDeletingAccount = true;
		try {
			const res = await fetch('/api/account/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'X-Verification-Token': verificationToken
				},
				credentials: 'include'
			});

			if (res.ok) {
				showToast(t('auth.success.accountDeleted'), "success");
				// Kullanıcıyı çıkış yaptır veya ana sayfaya yönlendir
				setTimeout(() => {
					window.location.href = "/";
				}, 2000);
			} else {
				const data = await res.json();
				showToast(data.error || "Hesap silinirken bir hata oluştu", "error");
			}
		} catch (error) {
			showToast("Bağlantı hatası", "error");
		} finally {
			isDeletingAccount = false;
		}
	}

	// Mnemonic doğrulama başarılı olduğunda
	function handleMnemonicVerified(token: string) {
		showMnemonicVerification = false;
		verificationToken = token;
		deleteAccount();
	}

	// Mnemonic doğrulama iptal edildiğinde
	function handleMnemonicCancel() {
		showMnemonicVerification = false;
	}
	// SettingsDialog içinde
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

function handleClose() {
    dispatch('close');
	    playSound("pop"); 

}

// Dialog kapanırken
// <Dialog.Root bind:open onOpenChange={handleOpenChange}>
function handleOpenChange(newOpen) {
    if (!newOpen) {
        dispatch('close');
			    playSound("pop"); 

    }
}

</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button class="hidden" size="sm" {...props}>Open Dialog</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		class="overflow-hidden p-0 md:max-h-[500px] md:max-w-[650px] z-50 rounded-none border-0 md:rounded-xl md:border-1"
		trapFocus={false}
	>
		<Tabs.Root value="passwords">
			<Sidebar.Provider class="items-start">
				<Sidebar.Root>
					<Sidebar.Content class="overflow-y-auto" data-slot="content">
						<Sidebar.Group>
							<Sidebar.GroupLabel class="flex flex-row gap-1 font-bold text-secondary-foreground"><UserRound class="text-primary"size={28} outline={1.75} />{t('MyAccount')}</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each settingsData.account as hesapItem (hesapItem.value)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton>
												{#snippet child({ props })}
													<Tabs.List>
														<Tabs.Trigger value={hesapItem.value} {...props}><hesapItem.icon />{hesapItem.name}</Tabs.Trigger>
													</Tabs.List>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
						<Sidebar.Group>
							<Sidebar.GroupLabel class="flex flex-row gap-1 font-bold text-secondary-foreground"><Cog class="text-primary"size={28} outline={1.75} />{t('Settings')}</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each settingsData.settings as settingsItem (settingsItem.value)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton isActive={settingsItem.value === 'settings'}>
												{#snippet child({ props })}
													<Tabs.List>
														<Tabs.Trigger value={settingsItem.value} {...props}><settingsItem.icon/>{settingsItem.name}</Tabs.Trigger>
													</Tabs.List>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
					</Sidebar.Content>
				</Sidebar.Root>
				<Sidebar.Trigger class="fixed top-4 left-4 z-50 md:hidden">
					<Button variant="outline" size="icon" class="h-10 w-10 p-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
							<line x1="4" x2="20" y1="12" y2="12" />
							<line x1="4" x2="20" y1="6" y2="6" />
							<line x1="4" x2="20" y1="18" y2="18" />
						</svg>
					</Button>
				</Sidebar.Trigger>
				<Tabs.Content value="passwords">
        <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div class="flex items-center gap-2 px-6">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href="">{t('Security')}</Breadcrumb.Link>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
          </div>
        </header>
        <main class="flex w-full h-full flex-1 items-end flex-col p-6 gap-3 overflow-y-auto">
          <!-- Password Change Section -->
          <div class="flex w-full flex-col-reverse items-end gap-1.5">
            <Input
              id="current-password"
              type="password"
              bind:value={currentPassword}
              placeholder={t('CurrentPassword')}
              class="text-right"
            />
            <Label for="current-password" class="text-sm whitespace-nowrap">{t('CurrentPassword')}</Label>
          </div>
          
          <div class="flex w-full flex-col-reverse items-end gap-1.5">
            <Input
              id="new-password"
              type="password"
              bind:value={newPassword}
              placeholder={t('NewPassword')}
              class="text-right"
            />
            <Label for="new-password" class="whitespace-nowrap">{t('NewPassword')}</Label>
          </div>
          
          <div class="flex w-full flex-col-reverse items-end gap-1.5">
            <Input
              id="confirm-password"
              type="password"
              bind:value={confirmPassword}
              placeholder={t('ConfirmNewPassword')}
              class="text-right"
            />
            <Label for="confirm-password" class="whitespace-nowrap">{t('ConfirmNewPassword')}</Label>
          </div>
          
          <div class="w-full flex justify-end pt-2">
            <Button 
              onclick={changePassword}
              disabled={isChangingPassword}
			  size="sm"
            >
              {#if isChangingPassword}
                <Loader2Icon class="w-4 h-4  animate-spin" />
                {t('Changing')}...
              {:else}
			  <KeyRound class="w-4 h-4"/>
                {t('ChangePassword')}
              {/if}
            </Button>
          </div>
          <Separator class="my-1.5"/>
          <!-- Security Section -->
          <div class="w-full flex flex-col items-end">
            <p class="text-sm text-muted-foreground text-right mb-4">
              {t('MnemonicWarning')}
            </p>
            
            {#if mnemonicError}
              <div class="p-3 text-sm text-red-600 bg-red-50 rounded-md w-full text-right mb-4">
                {mnemonicError}
              </div>
            {/if}
            
            {#if mnemonicRegenerated}
              <div class="p-3 text-sm text-green-600 bg-green-50 rounded-md w-full text-right mb-4">
                {t('MnemonicRegeneratedSuccess')}
              </div>
            {/if}
            
            <div class="w-full flex flex-col gap-1.5 items-end">
              <Button
                variant="outline"
                onclick={regenerateMnemonic}
                disabled={isRegeneratingMnemonic}
				size="sm"
              >
                {#if isRegeneratingMnemonic}
                  <Loader2Icon class="w-4 h-4  animate-spin" />
                  {t('Regenerating')}...
                {:else}
                  <RefreshCw class="w-4 h-4 " />
                  {t('RegenerateMnemonic')}
                {/if}
              </Button>
              
              <Button variant="outline" size="sm">
                <KeyRound class="w-4 h-4 " />
                {t('ShowMnemonic')}
				
              </Button>
            </div>
          </div>
      </Tabs.Content>
      
      <Tabs.Content value="settings">
        <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div class="flex items-center gap-2 px-6">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href="">{t('Settings')}</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
              </Breadcrumb.List>
            </Breadcrumb.Root>
          </div>
        </header>
					<main class="text-end flex h-full flex-1 flex-col p-6 gap-1.5 overflow-y-auto">
							<div class="flex w-full justify-end items-center py-2 px-4 rounded-lg border space-x-2">
								<Switch id="lock-dm" />
								<Label for="lock-dm">{t('LockTheMessages')}</Label>
							</div>
							<div class="flex w-full justify-end  items-center py-2 px-4 rounded-lg border space-x-2">
								<Switch id="hide-profile" />
								<Label for="hide-profile">{t('HideTheProfile')}</Label>
							</div>
							<div class="pt-4 w-full flex flex-col items-end border-t mt-4">
								<Button 
									id="delete-account" 
									type="button" 
									variant="destructive"
									onclick={() => {verificationToken = null;
			showMnemonicVerification = true;}}
									disabled={isDeletingAccount}
								>
									{#if isDeletingAccount}
										<span class="inline-flex items-center gap-2">
  											<Loader2Icon class="animate-spin" />
											{t('Deleting')}...
										</span>
									{:else}
										<span class="inline-flex items-center gap-2">
											<TrashIcon size={16} />
											{t('DeleteTheAccount')}
										</span>
									{/if}
								</Button>
								<p class="text-xs text-end text-muted-foreground mt-2">
									{t('DeleteTheAccountBIP39Info')}
								</p>
							</div>
					</main>
				</Tabs.Content>
			</Sidebar.Provider>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>

<!-- Mnemonic Doğrulama Popup'ı -->
<MnemonicVerificationPopup class="z-100"
	bind:openVerif={showMnemonicVerification}
	onVerified={handleMnemonicVerified}
	onCancel={handleMnemonicCancel}
	title="Hesap Silme Onayı"
	description="Hesabınızı kalıcı olarak silmek için mnemonic kelimenizi doğrulamanız gerekiyor."
/>