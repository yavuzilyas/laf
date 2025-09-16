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
    import {HandCoins, FileBadge, Construction, Cog, LogIn, CirclePlus, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon,LogOutIcon, LogInIcon, UserRound, Hand } from "@lucide/svelte";
  import * as Tabs from "$lib/components/ui/vertical-tabs/index.js";
	import Circle from "./Circle.svelte";

	const data = {
		account: [
			{ name: "Bildirimler", icon: BellIcon },
			{ name: "Profil", icon: UserRound },
			{ name: "Üyelik", icon: CirclePlus },
			{ name: "Bağışlarım", icon: HandCoins },
			{ name: "Ödüllerim", icon: FileBadge },
		],
		settings: [
			{ name: "Tema", icon: PaintbrushIcon },
			{ name: "Mesaj", icon: MessageCircleIcon },
			{ name: "Dil ve Bölge", icon: GlobeIcon },
			{ name: "Gizlilik ve Görünürlük", icon: LockIcon },
			{ name: "Gelişmiş", icon: SettingsIcon },
		],
	};

	export let open: boolean = false; // Dışarıdan gelecek prop
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
      <Sidebar.Root >
<Sidebar.Content class="overflow-y-auto">
          <Sidebar.Group>
			<Sidebar.GroupLabel class="flex flex-row gap-1 font-bold text-secondary-foreground"><UserRound class="text-primary"size={28} outline={1.75} />Hesap</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each data.account as hesapItem (hesapItem.name)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton isActive={hesapItem.name === "Mesajlar"}>
                      {#snippet child({ props })}
						<Tabs.List>
      						<Tabs.Trigger value="{hesapItem.name}" {...props}><hesapItem.icon />{hesapItem.name}</Tabs.Trigger>
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
                    <Sidebar.MenuButton isActive={settingsItem.name === "Mesajlar"}>
                      {#snippet child({ props })}
						<Tabs.List>
      						<Tabs.Trigger value="{settingsItem.name}" {...props}><settingsItem.icon/>{settingsItem.name}</Tabs.Trigger>
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
                  <Breadcrumb.Link href="#">Ayarlar</Breadcrumb.Link></Sidebar.Trigger>
<Tabs.Content value="Mesajlar">
      <main class="flex h-[480px] flex-1 flex-col overflow-hidden">

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">

        </div>
      </main>
  </Tabs.Content>
</Sidebar.Provider>
		
</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
