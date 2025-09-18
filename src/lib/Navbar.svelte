<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import { Button } from "$lib/components/ui/button";
  import { showToast, persistToast } from "$lib/hooks/toast";
import SettingsDialog from "$lib/components/settings-dialog.svelte";
    import {HandCoins, BadgeInfo, Construction, Cog, LogIn, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon,LogOutIcon, LogInIcon, UserRound } from "@lucide/svelte";
  import logo from '$lib/assets/laf1.svg';
    import { dativeSuffix } from './utils/turkish-suffix'; // türkçe ekler için
    const nameWithDative = (n: string) => dativeSuffix(n, { apostrophe: true });
  import { page } from "$app/stores";
  
  type MenuItem = {
    icon?: any;
    name?: string;
    href?: string;
    custom?: boolean;
    element?: () => any;
    customStyle?: string;
  };

  let menu = [
    { isconstruction: "false", name: "Makale", href: "makale" },
    { isconstruction: "true", name: "Nutuk", href: "" },
    { isconstruction: "true", name: "Lügat", href: "" },
    { isconstruction: "true", name: "Külliyât", href: "" },
    { isconstruction: "true", name: "Tahkikat", href: "" },
  ];

    const loggedInItems: MenuItem[] = [
    { icon: UserRound, name: "Hesap", href: "/hesap" },
    { icon: Cog, name: "Ayarlar", onClick: () => { openSettings = true; } },
    { icon: BellIcon, name: "Bildirimler", href: "/bildirimler"},
    { icon: HandCoins, name: "Bağışlar", href: "/login" },
    { icon: BadgeInfo, name: "Yardım", href: "/login" },
    { icon: LogOutIcon, name: "Çıkış Yap", href: "/logout", customStyle: "!text-red-500"},
  ];

  const baseLoggedOut: MenuItem[] = [
    { icon: LogInIcon, name: "Giriş", href: "/login" },
    { icon: HandCoins, name: "Bağışlar", href: "/login" },
    { icon: BadgeInfo, name: "Yardım", href: "/login" },
  ];

  const loginHref = $derived(`/login?redirectTo=${encodeURIComponent($page.url.pathname + $page.url.search)}`);

  let items = $state<MenuItem[]>(baseLoggedOut);
  $effect(() => {
    if ($page.data.user) {
      items = loggedInItems;
    } else {
      items = baseLoggedOut.map((it) => ({ ...it, href: loginHref }));
    }
  });
let openSettings = $state(false);
</script>

<SettingsDialog bind:open={openSettings} />
<nav class="w-full text-secondary-foreground border-b-1">
  <div class="max-w-7xl mx-auto  py-0 sm:py-1 px-3 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <Tooltip.Provider>
 <Tooltip.Root>
  <Tooltip.Trigger>   
    <a href="/" ><img class="max-h-4.5 fill-primary" src="{logo}" alt="LAF" /></a>
  </Tooltip.Trigger>
  <Tooltip.Content>
   <p>Ana sayfaya git.</p>
  </Tooltip.Content>
 </Tooltip.Root>
</Tooltip.Provider>

      <div class=" pb-2 pt-2.5 max-w-50 sm:p-0 sm:max-w-full overflow-auto flex text-secondary-foreground space-x-4 text-xs">
        {#each menu as item}

{#if item.isconstruction == "true"}
            <Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <a href={item.href} class="text-secondary-foreground/75 group flex items-center gap-0.5 font-bold cursor-pointer">{item.name}<Construction size={16} strokeWidth={1.75} />
      </a>
      </Tooltip.Trigger>
    <Tooltip.Content class="align-center text-center flex items-center gap-1.5">
      <p class="text-secondary-foreground group flex items-center gap-0.5 font-bold cursor-pointer">
        {item.name} 
        <Construction size={16} strokeWidth={1.75} /> </p><span class="text-secondary-foreground font-medium"> imar merhalesindedir.</span>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
{:else}
            <Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
<a href={item.href} class="group flex items-center font-bold cursor-pointer">
  {item.name} 
</a>
</Tooltip.Trigger>
    <Tooltip.Content>
      <p><span class="font-bold text-secondary-foreground">{nameWithDative(item.name)}</span> git.</p> 
<!-- son harfine göre ek alır -->
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
{/if}


        {/each}
      </div>

<div>
    <DropdownMenuMotion {items} /></div>
    </div>
  </div>
</nav>