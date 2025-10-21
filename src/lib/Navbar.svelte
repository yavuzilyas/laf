<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import { Button } from "$lib/components/ui/button";
  import { showToast, persistToast } from "$lib/hooks/toast";
import SettingsDialog from "$lib/components/settings-dialog.svelte";
import NotificationDialog from "$lib/components/NotificationDialog.svelte";
    import { HammerIcon, ShieldCheckIcon, BlocksIcon } from 'svelte-animate-icons';

    import {HandCoins, BadgeInfo, Construction, Cog, LogIn, UserCircleIcon, LayoutGridIcon, TrashIcon, BellIcon,LogOutIcon, LogInIcon, UserRound } from "@lucide/svelte";
  import logo from '$lib/assets/laf1.svg';
      import { t, tJoin, tMany, dativeSuffix } from '$lib/stores/i18n.svelte.ts';
  import { page } from "$app/stores";
  import {
    notifications as notificationsStore,
    unreadCount as unreadCountStore,
    fetchNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
    goToNotificationLink
  } from '$lib/stores/notifications';
  import type { NotificationRecord } from '$lib/types/notification';
  
  type MenuItem = {
    icon?: any;
    name?: string;
    href?: string;
    custom?: boolean;
    element?: () => any;
    customStyle?: string;
    onClick?: () => void;
    badge?: number;
  };

  // Reaktif menu array'i - dil değiştiğinde otomatik güncellenir
  let menu = $derived([
    { isconstruction: "false", name: t('Articles'), href: "/articles" },
    { isconstruction: "true", name: t('Lexicon'), href: "/lugath" },
    // { isconstruction: "true", name: t('Bicorpus'), href: "bicorpus" },
    // { isconstruction: "true", name: t('Tacicat'), href: "tacicat" },
  ]);

  // Reaktif logged-in items - dil değiştiğinde otomatik güncellenir
  let notificationsList = $state<NotificationRecord[]>([]);
  let unreadTotal = $state(0);
  let showNotificationsDialog = $state(false);

  $effect(() => {
    const unsubscribe = notificationsStore.subscribe((value) => {
      notificationsList = value;
    });
    return () => unsubscribe();
  });

  $effect(() => {
    const unsubscribe = unreadCountStore.subscribe((value) => {
      unreadTotal = value;
    });
    return () => unsubscribe();
  });

  async function openNotificationsDialog() {
    await fetchNotifications();
    showNotificationsDialog = true;
  }

  async function handleNotificationSelect(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification) return;

    if (!notification.read) {
      await markNotificationsRead([notification.id]);
    }

    if (notification.link) {
      goToNotificationLink(notification.link);
    }

    showNotificationsDialog = false;
  }

  async function handleMarkAllNotifications() {
    await markAllNotificationsRead();
  }

  const loggedInItems = $derived<MenuItem[]>([
    { icon: UserRound, name: t('Account'), href: "/profile" },
    { icon: Cog, name: t('Settings'), onClick: handleSettingsClick },
    { icon: BellIcon, name: t('Notifications'), onClick: openNotificationsDialog, badge: unreadTotal },
    { icon: HandCoins, name: t('Donations'), href: t('/donations') },
    { icon: BadgeInfo, name: t('Help'), href: t('/help') },
    { icon: LogOutIcon, name: t('Logout'), href: '/logout', customStyle: "!text-red-500"},
  ]);
// Ve fonksiyonu ekleyin:
function handleSettingsClick() {
    console.log('Settings clicked, current state:', openSettings);
    openSettings = true;
    console.log('Settings state after:', openSettings);
}
  // Reaktif logged-out items - dil değiştiğinde otomatik güncellenir
  const baseLoggedOut = $derived<MenuItem[]>([
    { icon: LogInIcon, name: t('Login'), href: "/login" },
    { icon: HandCoins, name: t('Donations'), href: "/donations" },
    { icon: BadgeInfo, name: t('Help'), href: "/help" },
  ]);

  // Locale-aware login path: /giris for tr, /login otherwise
  const loginPath = $derived(t.currentLocale === 'tr' ? '/giris' : '/login');
  const loginHref = $derived(`${loginPath}?redirectTo=${encodeURIComponent($page.url.pathname + $page.url.search)}`);

  let items = $state<MenuItem[]>(baseLoggedOut);
  $effect(() => {
    if ($page.data.user) {
      items = loggedInItems;
    } else {
      items = baseLoggedOut.map((it) => ({ ...it, href: loginHref }));
    }
  });
let openSettings = $state(false);
import HammerLottie from "$lib/components/hammerIcon.svelte";
</script>
<SettingsDialog bind:open={openSettings} on:close={() => openSettings = false} />
<NotificationDialog
  bind:open={showNotificationsDialog}
  notifications={notificationsList}
  unreadCount={unreadTotal}
  on:select={handleNotificationSelect}
  on:markAll={handleMarkAllNotifications}
/>

<nav class="w-full sticky top-0 z-40 bg-background text-secondary-foreground border-b-1">
  <div class="max-w-7xl mx-auto  py-0 sm:py-1 px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <Tooltip.Provider>
 <Tooltip.Root>
  <Tooltip.Trigger>   
    <a href="/" ><img class="max-h-4.5 fill-primary" src="{logo}" alt="LAF" /></a>
  </Tooltip.Trigger>
  <Tooltip.Content>
   <p>{t('GoToHomePage')}</p>
  </Tooltip.Content>
 </Tooltip.Root>
</Tooltip.Provider>

      <div class=" pb-2 pt-2.5 max-w-50 sm:p-0 sm:max-w-full overflow-auto flex text-secondary-foreground space-x-4 text-xs">
        {#each menu as item}

{#if item.isconstruction == "true"}
            <Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <a href={item.href} class="text-secondary-foreground/75 group flex items-center gap-0.5 font-bold cursor-pointer"><HammerLottie />{item.name}
      </a>
      </Tooltip.Trigger>
    <Tooltip.Content class="align-center text-center flex items-center gap-1.5">
        <p class="text-secondary-foreground group flex items-center gap-0.5 font-bold cursor-pointer">
        {item.name} 
        </p><span class="text-secondary-foreground font-medium"> {t('DevelopmentStage')}</span>
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
      <p>{#if t.currentLocale === 'tr'}<span class="font-bold text-secondary-foreground">{dativeSuffix(item.name)}</span> {t('goto')}{:else}{t('goto')} <span class="font-bold text-secondary-foreground">{item.name}</span>{/if}</p> 
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