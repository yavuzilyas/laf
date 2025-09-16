<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import KeyboardIcon from "@lucide/svelte/icons/keyboard";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import PaintbrushIcon from "@lucide/svelte/icons/paintbrush";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {HandCoins, FileBadge, Construction, Cog, LogIn, CirclePlus, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon,LogOutIcon, LogInIcon, UserRound, Hand } from "@lucide/svelte";
	import * as Tabs from "$lib/components/ui/vertical-tabs/index.js";
	import Circle from "./Circle.svelte";
	import MnemonicVerificationPopup from "$lib/components/MnemonicVerificationPopup.svelte";
	import { showToast } from "$lib/hooks/toast";
  import Loader2Icon from "@lucide/svelte/icons/loader-2";

	const data = {
		account: [
			{ name: "Üyelik", icon: CirclePlus },
			{ name: "Bağışlarım", icon: HandCoins },
			{ name: "Ödüllerim", icon: FileBadge },
		],
		settings: [
			{ name: "Tema", icon: PaintbrushIcon },
			{ name: "Mesaj", icon: MessageCircleIcon },
			{ name: "Dil ve Bölge", icon: GlobeIcon },
			{ name: "Gizlilik ve Görünürlük", icon: LockIcon },
			{ name: "Ayarlar", icon: SettingsIcon },
		],
	};

	let { open = false } = $props(); // Dışarıdan gelecek prop
	
	// Mnemonic doğrulama için state
	let showMnemonicVerification = $state(false);
	let isDeletingAccount = $state(false);

	// Hesap silme işlemi
	async function deleteAccount() {
		isDeletingAccount = true;
		try {
			const res = await fetch('/api/account/delete', {
				method: 'DELETE',
				credentials: 'include'
			});

			if (res.ok) {
				showToast("Hesabınız başarıyla silindi", "success");
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
	function handleMnemonicVerified() {
		showMnemonicVerification = false;
		deleteAccount();
	}

	// Mnemonic doğrulama iptal edildiğinde
	function handleMnemonicCancel() {
		showMnemonicVerification = false;
		 open = true;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button class="hidden" size="sm" {...props}>Open Dialog</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		class="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
		trapFocus={false}
	>
		<Tabs.Root value="Mesajlar">
			<Sidebar.Provider class="items-start">
				<Sidebar.Root>
					<Sidebar.Content class="overflow-y-auto">
						<Sidebar.Group>
							<Sidebar.GroupLabel class="flex flex-row gap-1 font-bold text-secondary-foreground"><UserRound class="text-primary"size={28} outline={1.75} />Hesap</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each data.account as hesapItem (hesapItem.name)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton>
												{#snippet child({ props })}
													<Tabs.List>
														<Tabs.Trigger value={hesapItem.name} {...props}><hesapItem.icon />{hesapItem.name}</Tabs.Trigger>
													</Tabs.List>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
						<Sidebar.Group>
							<Sidebar.GroupLabel class="flex flex-row gap-1 font-bold text-secondary-foreground"><Cog class="text-primary"size={28} outline={1.75} />Ayarlar</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each data.settings as settingsItem (settingsItem.name)}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton isActive={settingsItem.name === "Ayarlar"}>
												{#snippet child({ props })}
													<Tabs.List>
														<Tabs.Trigger value={settingsItem.name} {...props}><settingsItem.icon/>{settingsItem.name}</Tabs.Trigger>
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
				<Sidebar.Trigger class="mt-3 ml-3 scale-125 md:hidden">
					<Breadcrumb.Link href="#">Ayarlar</Breadcrumb.Link>
				</Sidebar.Trigger>
				<Tabs.Content value="Ayarlar">
					<main class="text-end flex h-[480px] flex-1 flex-col pt-8 overflow-hidden">
						<div class="flex w-full items-end justify-end flex-1 flex-col gap-2 overflow-y-auto p-4">
							<div class="flex w-full justify-end items-center py-2 px-4 rounded-lg border space-x-2">
								<Switch id="lock-dm" />
								<Label for="lock-dm">DM'i kapat</Label>
							</div>
							<div class="flex w-full justify-end  items-center py-2 px-4 rounded-lg border space-x-2">
								<Switch id="hide-profile" />
								<Label for="hide-profile">Profili Gizle</Label>
							</div>
							<div class="pt-4 w-full flex flex-col items-end border-t mt-4">
								<Button 
									id="delete-account" 
									type="button" 
									variant="destructive"
									onclick={() => {showMnemonicVerification = true; open = false;}}
									disabled={isDeletingAccount}
								>
									{#if isDeletingAccount}
										<span class="inline-flex items-center gap-2">
  											<Loader2Icon class="animate-spin" />
											Siliniyor...
										</span>
									{:else}
										<span class="inline-flex items-center gap-2">
											<TrashIcon size={16} />
											Hesabı Sil
										</span>
									{/if}
								</Button>
								<p class="text-xs text-end text-muted-foreground mt-2">
									Hesabınızı silmek için BIP-39 doğrulaması gerekecektir.
								</p>
							</div>
						</div>
					</main>
				</Tabs.Content>
			</Sidebar.Provider>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>

<!-- Mnemonic Doğrulama Popup'ı -->
<MnemonicVerificationPopup class="z-100"
	bind:open={showMnemonicVerification}
	onVerified={handleMnemonicVerified}
	onCancel={handleMnemonicCancel}
	title="Hesap Silme Onayı"
	description="Hesabınızı kalıcı olarak silmek için mnemonic kelimenizi doğrulamanız gerekiyor."
/>