<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import AlignLeft from '@lucide/svelte/icons/align-left';
	import AlignCenter from '@lucide/svelte/icons/align-center';
	import AlignRight from '@lucide/svelte/icons/align-right';
	import AlignJustify from '@lucide/svelte/icons/align-justify';
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import KeyboardIcon from "@lucide/svelte/icons/keyboard";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import PaintbrushIcon from "@lucide/svelte/icons/paintbrush";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Construction, Cog, LogIn, UserCircleIcon, LayoutGridIcon, TrashIcon, 
	BellIcon, LogOutIcon, LogInIcon, Hand, KeyRound, RefreshCw, Eye, EyeOff, Sun, Moon } from "@lucide/svelte";
	import * as Tabs from "$lib/components/ui/vertical-tabs/index.js";
	import Circle from "./Circle.svelte";
	import MnemonicVerificationPopup from "$lib/components/MnemonicVerificationPopup.svelte";
	import ShowMnemonicDrawer from "$lib/components/ShowMnemonicDrawer.svelte";
	import PasswordVerificationPopup from "$lib/components/PasswordVerificationPopup.svelte";
	import { showToast } from "$lib/hooks/toast";
import { BarSpinner } from "$lib/components/spell/bar-spinner";
    import { t, tJoin, tMany } from '$lib/stores/i18n.svelte.js';
	import { playSound } from "$lib/stores/sound"; 
	import { mnemonicPhraseStore, clearMnemonicPhrase, setMnemonicPhrase } from '$lib/stores/mnemonic';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { toggleMode } from "mode-watcher";
	import { highContrast } from "$lib/stores/highcontrast.js";
	import { individualSoundSettings, toggleIndividualSound, setAllIndividualSounds } from "$lib/stores/sound-settings.js";
	import { sounds } from "$lib/stores/sound.js";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { createEventDispatcher } from 'svelte';
    import { notificationPreferences, toggleNotificationType, toggleGeneralSetting, setAllNotifications, saveNotificationPreferences, loadNotificationPreferences, type NotificationPreferences } from "$lib/stores/notification-preferences";
    import LanguageSelector from "./LanguageSelector.svelte";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { userStore } from "$lib/stores/user.js";
import type { User } from "$lib/stores/user.js";
    import { fontSize, type FontSize } from "$lib/stores/fontSize.js";
import { textAlignment, type TextAlignment } from "$lib/stores/textAlignment.js";

	// Import default preferences for initialization
	const defaultPreferences = {
		follow: true,
		like: true,
		comment: true,
		reply: true,
		announcement: true,
		emailNotifications: true,
		pushNotifications: true,
		messageSounds: true,
		systemNotifications: true,
		successToasts: true,
		errorToasts: true,
		infoToasts: true,
		warningToasts: true
	};

	// High contrast state from store
	let isHighContrast = $state(false);

	// Sound settings state from store
	let currentSoundSettings = $state<Record<string, boolean>>({});

	// Notification preferences state from store
	let currentNotificationPreferences = $state<NotificationPreferences>(defaultPreferences);

	// Hide profile state
	let isProfileHidden = $state(false);
	let isTogglingHideProfile = $state(false);

	// Sync with stores
	$effect(() => {
		isHighContrast = $highContrast;
		currentSoundSettings = $individualSoundSettings;
		currentNotificationPreferences = $notificationPreferences;
	});

	// Initialize notification preferences and hide profile status on component mount
	$effect(() => {
		loadNotificationPreferences();
		loadHideProfileStatus();
	});

	// Load hide profile status from server
	async function loadHideProfileStatus() {
		try {
			const response = await fetch('/api/account/hide', {
				method: 'GET',
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				isProfileHidden = data.isHidden;
			}
		} catch (error) {
		}
	}

	// Toggle hide profile
	async function toggleHideProfile() {
		if (isTogglingHideProfile) return;
		
		isTogglingHideProfile = true;
		const newValue = !isProfileHidden;
		
		try {
			const response = await fetch('/api/account/hide', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ isHidden: newValue }),
				credentials: 'include'
			});
			
			if (response.ok) {
				isProfileHidden = newValue;
				showToast(newValue ? t('ProfileHidden') : t('ProfileUnhidden'), 'success');
			} else {
				const error = await response.json();
				showToast(error.error || t('FailedToUpdateProfile'), 'error');
			}
		} catch (error) {
			showToast(t('NetworkError'), 'error');
		} finally {
			isTogglingHideProfile = false;
		}
	}

	// Toggle high contrast mode
	function toggleHighContrast() {
		isHighContrast = !isHighContrast;
		
		// Update DOM
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('highcontrast', isHighContrast);
		}
		
		// Update store
		highContrast.set(isHighContrast);
	}

	// Toggle individual sound effect
	function handleToggleSound(soundKey: string) {
		toggleIndividualSound(soundKey);
	}

	// Enable/disable all sounds
	function handleToggleAllSounds(enabled: boolean) {
		setAllIndividualSounds(enabled);
	}

	// Handle notification type toggle
	function handleToggleNotificationType(type: keyof Omit<NotificationPreferences, 'emailNotifications' | 'pushNotifications' | 'messageSounds' | 'systemNotifications' | 'successToasts' | 'errorToasts' | 'infoToasts' | 'warningToasts'>) {
		toggleNotificationType(type);
		saveNotificationPreferences();
	}

	// Handle general notification setting toggle
	function handleToggleGeneralSetting(setting: keyof Pick<NotificationPreferences, 'emailNotifications' | 'pushNotifications' | 'messageSounds' | 'systemNotifications'>) {
		toggleGeneralSetting(setting);
		saveNotificationPreferences();
	}

	// Handle toast notification setting toggle
	function handleToggleToastSetting(setting: keyof Pick<NotificationPreferences, 'successToasts' | 'errorToasts' | 'infoToasts' | 'warningToasts'>) {
		notificationPreferences.update(pref => ({
			...pref,
			[setting]: !pref[setting]
		}));
		saveNotificationPreferences();
	}

	// Enable/disable all notifications
	function handleToggleAllNotifications(enabled: boolean) {
		setAllNotifications(enabled);
		saveNotificationPreferences();
	}

	// Get sound display name
	function getSoundDisplayName(soundKey: string): string {
		const displayNames: Record<string, string> = {
			click: t('Click'),
			error: t('Error'),
			plink: t('Plink'),
			pop: t('Pop'),
			tap: t('Tap'),
			tab: t('Tab'),
			lock: t('Lock'),
			unlock: t('Unlock'),
			success: t('Success'),
			info: t('Info'),
			errorNot: t('Error'),
			swift: t('Swift'),
			swift2: t('Swift2'),
			refresh: t('Refresh')
				};
		return displayNames[soundKey] || soundKey;
	}

	// Get current user from store
	let currentUser = $state<User | null>(null);
	$effect(() => {
		currentUser = $userStore.user;
	});

	// Filtered settings based on authentication
	const filteredSettings = $derived(() => {
		const allSettings = [
			{ name: t('Interface'), value:"interface", icon: PaintbrushIcon },
			{ name: t('Messages'), value:"messages", icon: MessageCircleIcon },
			{ name: tJoin(['Language', 'and', 'Region']), value:"language", icon: GlobeIcon },
			{ name: t('MyPasswords'), value:"passwords", icon: KeyRound },
			{ name: t('Settings'), value:"settings", icon: SettingsIcon },
		];
		
		// If user is not logged in, only show interface and language
		if (!currentUser) {
			return allSettings.filter(s => s.value === 'interface' || s.value === 'language');
		}
		
		return allSettings;
	});

	const settingsData = $derived({
		settings: filteredSettings(),
	});

	// Password change state
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	// Password visibility states
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);

	// Password strength indicators
	let passwordStrength = $state(0);
	let passwordStrengthText = $state('');
	let passwordStrengthColor = $state('');

	// Calculate password strength
	function calculatePasswordStrength(password: string) {
		if (!password) {
			passwordStrength = 0;
			passwordStrengthText = '';
			passwordStrengthColor = '';
			return;
		}

		let strength = 0;
		const checks = {
			length: password.length >= 8,
			longLength: password.length >= 12,
			upperCase: /[A-Z]/.test(password),
			lowerCase: /[a-z]/.test(password),
			numbers: /\d/.test(password),
			specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
		};

		// Calculate strength score
		Object.values(checks).forEach(passed => {
			if (passed) strength++;
		});

		// Bonus points for length
		if (checks.longLength) strength++;

		passwordStrength = strength;

		// Set strength text and color
		if (strength <= 2) {
			passwordStrengthText = t('Weak');
			passwordStrengthColor = 'text-red-600';
		} else if (strength <= 4) {
			passwordStrengthText = t('Fair');
			passwordStrengthColor = 'text-yellow-600';
		} else if (strength <= 6) {
			passwordStrengthText = t('Good');
			passwordStrengthColor = 'text-blue-600';
		} else {
			passwordStrengthText = t('Strong');
			passwordStrengthColor = 'text-green-600';
		}
	}

	// Mnemonic regeneration state
	let isRegeneratingMnemonic = $state(false);
	let mnemonicRegenerated = $state(false);
	let mnemonicError = $state('');
	let showMnemonicDrawer = $state(false);
	let showMnemonicConfirmDialog = $state(false);

	// Change password function
	async function changePassword() {
		// Clear previous messages
		passwordError = '';
		passwordSuccess = '';

		// Validation checks
		if (!currentPassword) {
			passwordError = t('CurrentPasswordRequired');
			return;
		}

		if (!newPassword) {
			passwordError = t('NewPasswordRequired');
			return;
		}

		if (newPassword !== confirmPassword) {
			passwordError = t('PasswordsDoNotMatch');
			return;
		}

		if (newPassword.length < 8) {
			passwordError = t('PasswordTooShort');
			return;
		}

		if (currentPassword === newPassword) {
			passwordError = t('NewPasswordMustBeDifferent');
			return;
		}

		// Additional password strength validation
		const hasUpperCase = /[A-Z]/.test(newPassword);
		const hasLowerCase = /[a-z]/.test(newPassword);
		const hasNumbers = /\d/.test(newPassword);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

		if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
			passwordError = t('PasswordMustContainUpperLowerNumber');
			return;
		}

		isChangingPassword = true;

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
			passwordError = t('NetworkError');
			showToast(t('NetworkError'), 'error');
		} finally {
			isChangingPassword = false;
		}
	}

	// Regenerate mnemonic phrase
	async function regenerateMnemonic() {
		// Show confirmation dialog instead of browser confirm
		showMnemonicConfirmDialog = true;
	}

	// Actually regenerate mnemonic after confirmation
	async function confirmRegenerateMnemonic() {
		showMnemonicConfirmDialog = false;

		// Set current action and show password verification first
		currentAction = 'regenerate-mnemonic';
		showPasswordVerification = true;
	}

	// Actually regenerate mnemonic after verification
	async function doRegenerateMnemonic() {
		if (!verificationToken) {
			showToast(t('VerificationIsRequired'), "error");
			return;
		}

		isRegeneratingMnemonic = true;
		mnemonicError = '';

		try {
			const response = await fetch('/api/account/regenerate-mnemonic', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Verification-Token': verificationToken
				},
				credentials: 'include'
			});

			const data = await response.json();

			if (response.ok) {
				mnemonicRegenerated = true;
				showToast(t('MnemonicRegenerated'), 'success');
				// Show mnemonic phrase to the user in a secure way
				if (data.mnemonic) {
					// Clear the previous mnemonic first
					clearMnemonicPhrase();
					// Store the new mnemonic to show in drawer
					newMnemonicPhrase = data.mnemonic;
					// Store in mnemonic store for future use
					setMnemonicPhrase(data.mnemonic);
					showMnemonicDrawer = true;
				}
			} else {
				mnemonicError = data.error || t('FailedToRegenerateMnemonic');
				showToast(mnemonicError, 'error');
			}
		} catch (error) {
			mnemonicError = t('NetworkError');
			showToast(t('NetworkError'), 'error');
		} finally {
			isRegeneratingMnemonic = false;
		}
	}

	let { open = false } = $props(); // Dışarıdan gelecek prop
	
	// Mnemonic doğrulama için state
	let showMnemonicVerification = $state(false);
	let showPasswordVerification = $state(false);
	let isDeletingAccount = $state(false);
	let verificationToken = $state<string | null>(null);
	let newMnemonicPhrase = $state<string | null>(null);
	let currentAction = $state<'regenerate-mnemonic' | 'delete-account' | null>(null);

	// Hesap silme işlemi
	async function deleteAccount() {
		if (!verificationToken) {
			showToast(t('VerificationIsRequired'), "error");
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
				showToast(data.error || t('AccountDeleteError'), "error");
			}
		} catch (error) {
			showToast(t('NetworkError'), "error");
		} finally {
			isDeletingAccount = false;
		}
	}

	// Handle showing mnemonic with proper validation
	function handleShowMnemonic() {
		if (!$mnemonicPhraseStore) {
			showToast(t('auth.errors.mnemonicRequired') || 'Mnemonic not available. Please regenerate your mnemonic.', 'error');
			return;
		}
		showMnemonicDrawer = true;
	}

	// Start account deletion process
	async function startDeleteAccount() {
		currentAction = 'delete-account';
		showPasswordVerification = true;
	}

	// Password doğrulama başarılı olduğunda
	function handlePasswordVerified(token: string) {
		showPasswordVerification = false;
		verificationToken = token;
		
		// After password verification, show mnemonic verification
		if (currentAction === 'regenerate-mnemonic' || currentAction === 'delete-account') {
			showMnemonicVerification = true;
		}
	}

	// Password doğrulama iptal edildiğinde
	function handlePasswordCancel() {
		showPasswordVerification = false;
		currentAction = null;
	}

	// Mnemonic doğrulama başarılı olduğunda
	function handleMnemonicVerified(token: string) {
		showMnemonicVerification = false;
		verificationToken = token;
		
		// Execute the action based on currentAction
		if (currentAction === 'regenerate-mnemonic') {
			doRegenerateMnemonic();
		} else if (currentAction === 'delete-account') {
			deleteAccount();
		}
		currentAction = null;
	}

	// Mnemonic doğrulama iptal edildiğinde
	function handleMnemonicCancel() {
		showMnemonicVerification = false;
		currentAction = null;
	}

const dispatch = createEventDispatcher();

function handleClose() {
    dispatch('close');
	    playSound("pop"); 

}

// Dialog kapanırken
// <Dialog.Root bind:open onOpenChange={handleOpenChange}>
function handleOpenChange(newOpen: boolean) {
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
		class="overflow-hidden p-0 md:max-h-[80vh] md:max-w-[800px] z-50 rounded-lg border"
		trapFocus={false}
	>
		<Tabs.Root value="interface">
			<Sidebar.Provider class="items-start h-[80vh]">
				<Sidebar.Root class="w-64 border-r">
					<Sidebar.Content class="overflow-y-auto h-full" data-slot="content">
						<Sidebar.Group>
							<Sidebar.GroupLabel class="flex flex-row gap-2 font-bold text-secondary-foreground"><Cog class="text-primary"size={28} />{t('Settings')}</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each settingsData.settings as settingsItem (settingsItem.value)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton isActive={settingsItem.value === 'settings'}>
												{#snippet child({ props })}
													<Tabs.List>
														<Tabs.Trigger value={settingsItem.value} {...props}><settingsItem.icon class="w-4 h-4 mr-2"/>{settingsItem.name}</Tabs.Trigger>
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
				<div class="flex-1 overflow-hidden">
					<Tabs.Content value="passwords">
						<ScrollArea orientation="vertical" class="h-full">
							<header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
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
							<main class="flex w-full h-full flex-1 flex-col py-6 px-10 gapy-6 px-10">
								<!-- Password Change Section -->
								<div class="space-y-4">
									<div class="space-y-2">
										<div class="relative">
											<Input
												id="current-password"
												type={showCurrentPassword ? "text" : "password"}
												bind:value={currentPassword}
												placeholder={t('CurrentPassword')}
												class="pr-10 text-sm"
											/>
											<button
												type="button"
												class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
												onclick={() => showCurrentPassword = !showCurrentPassword}
											>
												{#if showCurrentPassword}
													<EyeOff class="w-4 h-4" />
												{:else}
													<Eye class="w-4 h-4" />
												{/if}
											</button>
										</div>
									</div>
              
									<div class="space-y-2">
										<div class="relative">
											<Input
												id="new-password"
												type={showNewPassword ? "text" : "password"}
												bind:value={newPassword}
												placeholder={t('NewPassword')}
												class="pr-10 text-sm"
												oninput={(e) => calculatePasswordStrength((e.target as HTMLInputElement).value)}
											/>
											<button
												type="button"
												class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
												onclick={() => showNewPassword = !showNewPassword}
											>
												{#if showNewPassword}
													<EyeOff class="w-4 h-4" />
												{:else}
													<Eye class="w-4 h-4" />
												{/if}
											</button>
										</div>
										{#if newPassword && passwordStrengthText}
											<div class="text-xs {passwordStrengthColor} mt-1">
												{t('PasswordStrength')}: {passwordStrengthText}
											</div>
										{/if}
									</div>
              
									<div class="space-y-2">
										<div class="relative">
											<Input
												id="confirm-password"
												type={showConfirmPassword ? "text" : "password"}
												bind:value={confirmPassword}
												placeholder={t('ConfirmNewPassword')}
												class="pr-10 text-sm"
											/>
											<button
												type="button"
												class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
												onclick={() => showConfirmPassword = !showConfirmPassword}
											>
												{#if showConfirmPassword}
													<EyeOff class="w-4 h-4" />
												{:else}
													<Eye class="w-4 h-4" />
												{/if}
											</button>
										</div>
									</div>
								</div>
              
								<!-- Error and Success Messages -->
								
								<div class="flex justify-start pt-2">
									<Button 
										onclick={changePassword}
										disabled={isChangingPassword}
										size="sm"
									>
										{#if isChangingPassword}
											<BarSpinner class="text-secondary" size={16} />
											{t('Changing')}...
										{:else}
											<KeyRound class="w-4 h-4"/>
											{t('ChangePassword')}
										{/if}
									</Button>
								</div>
								<Separator class="my-6"/>
              <!-- Security Section -->
              <div class="space-y-4">
                <div class="bg-muted/50 p-4 rounded-lg">
                  <p class="text-sm text-muted-foreground mb-4">
                    {t('MnemonicWarning')}
                  </p>
                  
                  <div class="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onclick={regenerateMnemonic}
                      disabled={isRegeneratingMnemonic}
                      size="sm"
                    >
                      {#if isRegeneratingMnemonic}
                        <BarSpinner class="text-secondary" size={16} />
                        {t('Regenerating')}...
                      {:else}
                        <BarSpinner class="text-secondary" size={16} />
                        {t('RegenerateMnemonic')}
                      {/if}
                    </Button>
                    
                    <Button variant="outline" size="sm" onclick={() => handleShowMnemonic()}>
                      <KeyRound class="w-4 h-4 mr-2" />
                      {t('ShowMnemonic')}
                    </Button>
                  </div>
                </div>
              </div>
			</main>
			  </ScrollArea>
        </Tabs.Content>
        
        <Tabs.Content value="settings">
          <ScrollArea orientation="vertical" class="h-full">
            <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
              <div class="flex items-center gap-2 px-6">
                <Breadcrumb.Root>
                  <Breadcrumb.List>
                    <Breadcrumb.Item class="hidden md:block">
                      <Breadcrumb.Link href="">{t('Settings')}</Breadcrumb.Link>
                    </Breadcrumb.Item>
                  </Breadcrumb.List>
                </Breadcrumb.Root>
              </div>
            </header>
            <main class="flex h-full flex-1 flex-col py-6 px-10 gapy-6 px-10">
              <div class="space-y-4">
                <div class="flex items-center justify-between py-3 px-4 rounded-lg border">
                  <Label for="lock-dm" class="cursor-pointer text-xs">{t('LockTheMessages')}</Label>
                  <Switch id="lock-dm" />
                </div>
                <div class="flex items-center justify-between py-3 px-4 rounded-lg border">
                  <Label for="hide-profile" class="cursor-pointer text-xs">{t('HideTheProfile')}</Label>
                  <Switch 
                    id="hide-profile" 
                    checked={isProfileHidden}
                    disabled={isTogglingHideProfile}
                    onclick={toggleHideProfile}
                  />
                </div>
              </div>
              <div class="border-t pt-6">
                <div class="space-y-2">
                  <Button 
                    id="delete-account" 
                    type="button" 
                    variant="destructive"
                    onclick={startDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    {#if isDeletingAccount}
                      <span class="inline-flex items-center gap-2">
                        <BarSpinner class="text-secondary" size={16} />
                        {t('Deleting')}...
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-2">
                        <TrashIcon size={16} />
                        {t('DeleteTheAccount')}
                      </span>
                    {/if}
                  </Button>
                  <p class="text-xs text-muted-foreground mt-2">
                    {t('DeleteTheAccountBIP39Info')}
                  </p>
                </div>
              </div>
            </main>
          </ScrollArea>
        </Tabs.Content>
        
				<!-- Theme Tab -->
				<Tabs.Content value="interface">
					<ScrollArea orientation="vertical" class="h-full">
						<header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
							<div class="flex items-center gap-2 px-6">
								<Breadcrumb.Root>
									<Breadcrumb.List>
										<Breadcrumb.Item class="hidden md:block">
											<Breadcrumb.Link href="">{t('Interface')}</Breadcrumb.Link>
										</Breadcrumb.Item>
									</Breadcrumb.List>
								</Breadcrumb.Root>
							</div>
						</header>
						<main class="flex h-full flex-1 flex-col py-6 px-10 gapy-6 px-10">
							<div class="space-y-2">
								<div class="flex items-center justify-between py-2 px-3.5 rounded-lg border">
									<Label for="dark-mode" class="cursor-pointer text-xs">{t('DarkMode')}</Label>
									<Button size="xs" class="w-fit !bg-background/44 h-9 flex flex-row text-xs justify-center gap-2" onclick={toggleMode} variant="outline">
										<Sun strokeWidth={2.25}
											class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all text-primary dark:-rotate-90 dark:scale-0"
										/>
										<Moon strokeWidth={2.25}
											class="absolute h-[1.2rem] w-[1.2rem] text-primary rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100"
										/>
									</Button>
								</div>
								<div class="flex items-center justify-between py-2 px-3.5 rounded-lg border">
									<Label for="high-contrast" class="cursor-pointer text-xs">{t('HighContrast')}</Label>
									<Button size="xs" class="w-fit !bg-background/44 h-9 flex flex-row text-xs justify-center gap-2" onclick={toggleHighContrast} variant="outline">
										{#if isHighContrast}
											<svg class="h-[1.2rem] w-[1.2rem] text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<circle cx="12" cy="12" r="10" stroke-width="3"/>
												<circle cx="12" cy="12" r="3" stroke-width="3"/>
												<line x1="12" y1="2" x2="12" y2="6" stroke-width="3"/>
												<line x1="12" y1="18" x2="12" y2="22" stroke-width="3"/>
												<line x1="2" y1="12" x2="6" y2="12" stroke-width="3"/>
												<line x1="18" y1="12" x2="22" y2="12" stroke-width="3"/>
											</svg>
										{:else}
											<svg class="h-[1.2rem] w-[1.2rem] text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<circle cx="12" cy="12" r="10" stroke-width="2"/>
												<circle cx="12" cy="12" r="3" stroke-width="2"/>
												<line x1="12" y1="2" x2="12" y2="6" stroke-width="2"/>
												<line x1="12" y1="18" x2="12" y2="22" stroke-width="2"/>
												<line x1="2" y1="12" x2="6" y2="12" stroke-width="2"/>
												<line x1="18" y1="12" x2="22" y2="12" stroke-width="2"/>
											</svg>
										{/if}
									</Button>
								</div>
								<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
									<Label for="font-size" class="cursor-pointer text-xs">{t('EditorFontSize')}</Label>
									<ToggleGroup.Root
										type="single"
										value={$fontSize}
										onValueChange={(v) => { if (v) fontSize.set(v as FontSize); }}
										class="justify-end h-8"
									>
										<ToggleGroup.Item value="small" class="text-xs px-2 h-7">{t('Small')}</ToggleGroup.Item>
										<ToggleGroup.Item value="medium" class="text-xs px-2 h-7">{t('Medium')}</ToggleGroup.Item>
										<ToggleGroup.Item value="large" class="text-xs px-2 h-7">{t('Large')}</ToggleGroup.Item>
									</ToggleGroup.Root>
								</div>
								<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
									<Label for="text-alignment" class="cursor-pointer text-xs">{t('TextAlignment')}</Label>
									<ToggleGroup.Root
										type="single"
										value={$textAlignment}
										onValueChange={(v) => { if (v) textAlignment.set(v as TextAlignment); }}
										class="justify-end h-8"
									>
										<ToggleGroup.Item value="justify" class="text-xs px-2 h-7"><AlignJustify class="w-3.5 h-3.5" /></ToggleGroup.Item>
										<ToggleGroup.Item value="left" class="text-xs px-2 h-7"><AlignLeft class="w-3.5 h-3.5" /></ToggleGroup.Item>
										<ToggleGroup.Item value="center" class="text-xs px-2 h-7"><AlignCenter class="w-3.5 h-3.5" /></ToggleGroup.Item>
										<ToggleGroup.Item value="right" class="text-xs px-2 h-7"><AlignRight class="w-3.5 h-3.5" /></ToggleGroup.Item>
									</ToggleGroup.Root>
								</div>

								
								<!-- Sound Effects Section -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<Label class="text-sm font-medium">{t('SoundEffects')}</Label>
										<div class="flex gap-2">
											<Button size="xs" variant="outline" onclick={() => handleToggleAllSounds(true)}>
												{t('EnableAll')}
											</Button>
											<Button size="xs" variant="outline" onclick={() => handleToggleAllSounds(false)}>
												{t('DisableAll')}
											</Button>
										</div>
									</div>
									
									<div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 ">
										{#each Object.keys(sounds) as soundKey}
											<div class="flex items-center justify-between py-2 px-3 rounded-lg border">
												<Label for="sound-{soundKey}" class="cursor-pointer text-xs">
													{getSoundDisplayName(soundKey)}
												</Label>
												<Switch 
													id="sound-{soundKey}"
													checked={currentSoundSettings[soundKey] !== false}
													onclick={() => handleToggleSound(soundKey)}
												/>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</main>
					</ScrollArea>
				</Tabs.Content>
        
				<!-- Messages Tab -->
				<Tabs.Content value="messages">
					<ScrollArea orientation="vertical" class="h-full">
						<header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
							<div class="flex items-center gap-2 px-6">
								<Breadcrumb.Root>
									<Breadcrumb.List>
										<Breadcrumb.Item class="hidden md:block">
											<Breadcrumb.Link href="">{t('Messages')}</Breadcrumb.Link>
										</Breadcrumb.Item>
									</Breadcrumb.List>
								</Breadcrumb.Root>
							</div>
						</header>
						<main class="flex h-full flex-1 flex-col py-6 px-10 gapy-6 px-10">
							<div class="space-y-6">
								<!-- General Notification Settings -->
								<div class="space-y-4">
									<div class="flex items-center justify-between">
										<Label class="text-xs font-medium">{t('GeneralNotifications')}</Label>
										<div class="flex gap-2">
											<Button size="xs" variant="outline" onclick={() => handleToggleAllNotifications(true)}>
												{t('EnableAll')}
											</Button>
											<Button size="xs" variant="outline" onclick={() => handleToggleAllNotifications(false)}>
												{t('DisableAll')}
											</Button>
										</div>
									</div>
									
									<div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="email-notifications" class="cursor-pointer text-xs">{t('EmailNotifications')}</Label>
											<Switch 
												id="email-notifications"
												checked={currentNotificationPreferences.emailNotifications}
												onclick={() => handleToggleGeneralSetting('emailNotifications')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="push-notifications" class="cursor-pointer text-xs">{t('PushNotifications')}</Label>
											<Switch 
												id="push-notifications"
												checked={currentNotificationPreferences.pushNotifications}
												onclick={() => handleToggleGeneralSetting('pushNotifications')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="message-sounds" class="cursor-pointer text-xs">{t('MessageSounds')}</Label>
											<Switch 
												id="message-sounds"
												checked={currentNotificationPreferences.messageSounds}
												onclick={() => handleToggleGeneralSetting('messageSounds')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="system-notifications" class="cursor-pointer text-xs">{t('SystemNotifications')}</Label>
											<Switch 
												id="system-notifications"
												checked={currentNotificationPreferences.systemNotifications}
												onclick={() => handleToggleGeneralSetting('systemNotifications')}
											/>
										</div>
								
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="follow-notifications" class="cursor-pointer text-xs">{t('FollowNotifications')}</Label>
											<Switch 
												id="follow-notifications"
												checked={currentNotificationPreferences.follow}
												onclick={() => handleToggleNotificationType('follow')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="like-notifications" class="cursor-pointer text-xs">{t('LikeNotifications')}</Label>
											<Switch 
												id="like-notifications"
												checked={currentNotificationPreferences.like}
												onclick={() => handleToggleNotificationType('like')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="comment-notifications" class="cursor-pointer text-xs">{t('CommentNotifications')}</Label>
											<Switch 
												id="comment-notifications"
												checked={currentNotificationPreferences.comment}
												onclick={() => handleToggleNotificationType('comment')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="reply-notifications" class="cursor-pointer text-xs">{t('ReplyNotifications')}</Label>
											<Switch 
												id="reply-notifications"
												checked={currentNotificationPreferences.reply}
												onclick={() => handleToggleNotificationType('reply')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="announcement-notifications" class="cursor-pointer text-xs">{t('AnnouncementNotifications')}</Label>
											<Switch 
												id="announcement-notifications"
												checked={currentNotificationPreferences.announcement}
												onclick={() => handleToggleNotificationType('announcement')}
											/>
										</div>
									</div>
								</div>
								
								<Separator class="my-4"/>
								
								<!-- Toast Notification Types -->
								<div class="space-y-4">
									<Label class="text-sm font-medium">{t('ToastNotifications')}</Label>
									
									<div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="success-toasts" class="cursor-pointer text-xs">{t('SuccessToasts')}</Label>
											<Switch 
												id="success-toasts"
												checked={currentNotificationPreferences.successToasts}
												onclick={() => handleToggleToastSetting('successToasts')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="error-toasts" class="cursor-pointer text-xs">{t('ErrorToasts')}</Label>
											<Switch 
												id="error-toasts"
												checked={currentNotificationPreferences.errorToasts}
												onclick={() => handleToggleToastSetting('errorToasts')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="info-toasts" class="cursor-pointer text-xs">{t('InfoToasts')}</Label>
											<Switch 
												id="info-toasts"
												checked={currentNotificationPreferences.infoToasts}
												onclick={() => handleToggleToastSetting('infoToasts')}
											/>
										</div>
										<div class="flex items-center justify-between py-3 px-4 rounded-lg border">
											<Label for="warning-toasts" class="cursor-pointer text-xs">{t('WarningToasts')}</Label>
											<Switch 
												id="warning-toasts"
												checked={currentNotificationPreferences.warningToasts}
												onclick={() => handleToggleToastSetting('warningToasts')}
											/>
										</div>
									</div>
								</div>
							</div>
						</main>
					</ScrollArea>
				</Tabs.Content>
        
				<!-- Language Tab -->
				<Tabs.Content value="language">
					<ScrollArea orientation="vertical" class="h-full">
						<header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
							<div class="flex items-center gap-2 px-6">
								<Breadcrumb.Root>
									<Breadcrumb.List>
										<Breadcrumb.Item class="hidden md:block">
											<Breadcrumb.Link href="">{tJoin(['Language', 'and', 'Region'])}</Breadcrumb.Link>
										</Breadcrumb.Item>
									</Breadcrumb.List>
								</Breadcrumb.Root>
							</div>
						</header>
						<main class="flex h-full flex-1 flex-col py-6 px-10 gapy-6 px-10">
							<div class="space-y-4">
								<LanguageSelector />

								
							</div>
						</main>
					</ScrollArea>
				</Tabs.Content>
			</div>
		</Sidebar.Provider>
	</Tabs.Root>
</Dialog.Content>
</Dialog.Root>

<!-- Password Doğrulama Popup'ı -->
<PasswordVerificationPopup
	bind:openVerif={showPasswordVerification}
	onVerified={handlePasswordVerified}
	onCancel={handlePasswordCancel}
	title={t('VerificationIsRequired')}
	description={t('EnterYourPassword')}
/>

<!-- Mnemonic Doğrulama Popup'ı -->
<MnemonicVerificationPopup
	bind:openVerif={showMnemonicVerification}
	verificationToken={verificationToken}
	onVerified={handleMnemonicVerified}
	onCancel={handleMnemonicCancel}
/>

<!-- Show Mnemonic Drawer -->
<ShowMnemonicDrawer bind:open={showMnemonicDrawer} />

<!-- Mnemonic Regeneration Confirmation Dialog -->
<AlertDialog.Root bind:open={showMnemonicConfirmDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{t('ConfirmRegenerateMnemonic')}</AlertDialog.Title>
			<AlertDialog.Description>
				{t('AreYouSureRegenerateMnemonic')}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{t('Cancel')}</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmRegenerateMnemonic}>
				{t('Confirm')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>