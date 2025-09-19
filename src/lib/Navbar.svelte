<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import { Button } from "$lib/components/ui/button";
  import { showToast, persistToast } from "$lib/hooks/toast";
import SettingsDialog from "$lib/components/settings-dialog.svelte";
    import {HandCoins, BadgeInfo, Construction, Cog, LogIn, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon,LogOutIcon, LogInIcon, UserRound } from "@lucide/svelte";
  import logo from '$lib/assets/laf1.svg';
      import { i18n, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';

  import { page } from "$app/stores";
  
  type MenuItem = {
    icon?: any;
    name?: string;
    href?: string;
    custom?: boolean;
    element?: () => any;
    customStyle?: string;
  };

  // Reaktif menu array'i - dil değiştiğinde otomatik güncellenir
  let menu = $derived([
    { isconstruction: "false", name: i18n.t('Articles'), href: "articles" },
    { isconstruction: "true", name: i18n.t('Lugath'), href: "lugath" },
    { isconstruction: "true", name: i18n.t('Bicorpus'), href: "bicorpus" },
    { isconstruction: "true", name: i18n.t('Tacicat'), href: "tacicat" },
  ]);

  // Reaktif logged-in items - dil değiştiğinde otomatik güncellenir
  const loggedInItems = $derived<MenuItem[]>([
    { icon: UserRound, name: i18n.t('Account'), href: "hesap" },
    { icon: Cog, name: i18n.t('Settings'), onClick: () => { openSettings = true; } },
    { icon: BellIcon, name: i18n.t('Notifications'), href: "bildirimler"},
    { icon: HandCoins, name: i18n.t('Donations'), href: "donations" },
    { icon: BadgeInfo, name: i18n.t('Help'), href: "help" },
    { icon: LogOutIcon, name: i18n.t('Logout'), href: "logout", customStyle: "!text-red-500"},
  ]);

  // Reaktif logged-out items - dil değiştiğinde otomatik güncellenir
  const baseLoggedOut = $derived<MenuItem[]>([
    { icon: LogInIcon, name: i18n.t('Login'), href: "login" },
    { icon: HandCoins, name: i18n.t('Donations'), href: "donations" },
    { icon: BadgeInfo, name: i18n.t('Help'), href: "help" },
  ]);

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
   <p>{i18n.t('GoToHomePage')}</p>
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
        <Construction size={16} strokeWidth={1.75} /> </p><span class="text-secondary-foreground font-medium"> {i18n.t('DevelopmentStage')}</span>
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
      <p>{#if i18n.currentLocale === 'tr'}<span class="font-bold text-secondary-foreground">{dativeSuffix(item.name)}</span> {i18n.t('goto')}{:else}{i18n.t('goto')} <span class="font-bold text-secondary-foreground">{item.name}</span>{/if}</p> 
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