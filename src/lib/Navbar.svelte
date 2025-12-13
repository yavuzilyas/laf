<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import { Button } from "$lib/components/ui/button";
  import { showToast, persistToast } from "$lib/hooks/toast";
import SettingsDialog from "$lib/components/settings-dialog.svelte";
import NotificationDialog from "$lib/components/NotificationDialog.svelte";
import A from "$lib/components/ui/a.svelte";

    import {HandCoins, BadgeInfo, Cog, BellIcon,LogOutIcon, LogInIcon, UserRound, Shield } from "@lucide/svelte";
  import logo from '$lib/assets/hatlaf.svg';
      import { t, tJoin, tMany, dativeSuffix } from '$lib/stores/i18n.svelte.js';
  import { page } from "$app/stores";
  import {
    notifications as notificationsStore,
    unreadCount as unreadCountStore,
    blockedActorIds as blockedActorIdsStore,
    fetchNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
    deleteNotification,
    blockUserNotifications,
    unblockUserNotifications,
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
    image?: string;
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
  let blockedIds = $state<string[]>([]);
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

  $effect(() => {
    const unsubscribe = blockedActorIdsStore.subscribe((value) => {
      blockedIds = value;
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

  async function handleNotificationDelete(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification) return;

    await deleteNotification(notification.id);
  }

  async function handleNotificationBlock(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification || !notification.actor?.id) return;

    await blockUserNotifications(notification.actor.id);
  }

  async function handleNotificationUnblock(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification || !notification.actor?.id) return;

    await unblockUserNotifications(notification.actor.id);
  }

  async function handleMarkAllNotifications() {
    await markAllNotificationsRead();
  }

  let openSettings = $state(false);
  // Ve fonksiyonu ekleyin:
  function handleSettingsClick() {
    console.log('Settings clicked, current state:', openSettings);
    openSettings = true;
    console.log('Settings state after:', openSettings);
  }

    type LayoutData = {
      user?: {
        id: string;
        email?: string;
        nickname?: string;
        avatar?: string | null;
        role?: string;
      } | null;
    };

    let { data } = $props();
    const currentUser = $derived(data?.user ?? $page.data.user);
    const accountImage = $derived(
      currentUser && typeof currentUser.avatar === 'string' && currentUser.avatar.trim().length > 0
        ? currentUser.avatar
        : undefined
    );
    const accountHref = $derived(currentUser?.nickname ? `/${currentUser.nickname}` : '/profile');

  const isModerator = $derived(currentUser?.role === 'moderator' || currentUser?.role === 'admin');
  
  const loggedInItems = $derived<MenuItem[]>([
    { icon: accountImage ? undefined : UserRound, image: accountImage, name: t('Account'), href: accountHref },
    { icon: Cog, name: t('Settings'), onClick: handleSettingsClick },
    { icon: BellIcon, name: t('Notifications'), onClick: openNotificationsDialog, badge: unreadTotal },
    ...(isModerator ? [{ icon: Shield, name: t('Moderation'), href: "/moderation" }] : []),
    { icon: HandCoins, name: t('Donations'), href: "/donations" },
    { icon: BadgeInfo, name: t('Help'), href: "/help" },
    { icon: LogOutIcon, name: t('Logout'), href: '/logout', customStyle: "!text-red-500"},
  ]);

  // Reaktif logged-out items - dil değiştiğinde otomatik güncellenir
  const baseLoggedOut = $derived<MenuItem[]>([
    { icon: LogInIcon, name: t('Login'), href: "/login" },
    { icon: HandCoins, name: t('Donations'), href: "/donations" },
    { icon: BadgeInfo, name: t('Help'), href: "/help" },
  ]);

  // Locale-aware login path: /giris for tr, /login otherwise
  const currentLocale = $derived((t as any).currentLocale || 'tr');
  const loginPath = $derived(currentLocale === 'tr' ? '/giris' : '/login');
  const loginHref = $derived(`${loginPath}?redirectTo=${encodeURIComponent($page.url.pathname + $page.url.search)}`);

  let items = $state<MenuItem[]>(baseLoggedOut);
  $effect(() => {
    if (currentUser) {
      items = loggedInItems;
    } else {
      items = baseLoggedOut.map((it) => ({ ...it, href: loginHref }));
    }
  });
import HammerLottie from "$lib/components/hammerIcon.svelte";
</script>
<SettingsDialog bind:open={openSettings} on:close={() => openSettings = false} />
<NotificationDialog
  bind:open={showNotificationsDialog}
  notifications={notificationsList}
  unreadCount={unreadTotal}
  blockedActorIds={blockedIds}
  on:select={handleNotificationSelect}
  on:markAll={handleMarkAllNotifications}
  on:delete={handleNotificationDelete}
  on:block={handleNotificationBlock}
  on:unblock={handleNotificationUnblock}
/>

<nav class="w-full fixed border-b top-0 z-45 text-secondary-foreground  rounded-xl">
    <div class="absolute -z-1 inset-0 bg-background/44 backdrop-blur-sm"></div>
  <div class="max-w-7xl mx-auto  py-0 sm:pt-1 sm:pb-1.5 px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <Tooltip.Provider>
 <Tooltip.Root>
  <Tooltip.Trigger>   
    <A href="/" ><img class="max-h-6.5 fill-primary" src="{logo}" alt="LAF" /></A>
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
      <A href={item.href} class="text-shadow-xs text-shadow-background/44 text-secondary-foreground/75 group flex items-center gap-0.5 font-bold cursor-pointer"><HammerLottie />{item.name}
      </A>
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
<A href={item.href} class="group text-shadow-xs text-shadow-background/44 flex items-center font-bold cursor-pointer">
  {item.name} 
</A>
</Tooltip.Trigger>
    <Tooltip.Content>
      <p>{#if currentLocale === 'tr'}<span class="font-bold text-secondary-foreground">{dativeSuffix(item.name)}</span> {t('goto')}{:else}{t('goto')} <span class="font-bold text-secondary-foreground">{item.name}</span>{/if}</p> 
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

<div class="relative h-8.5 sm:h-7"></div>    
