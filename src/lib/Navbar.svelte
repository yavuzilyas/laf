<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import DropdownMenuMotion from "$lib/components/DropdownMenuMotion.svelte";
    import { Button } from "$lib/components/ui/button";
  import { showToast, persistToast } from "$lib/hooks/toast";
import SettingsDialog from "$lib/components/settings-dialog.svelte";
import NotificationDialog from "$lib/components/NotificationDialog.svelte";
import A from "$lib/components/ui/a.svelte";
import { ScrollProgress } from "$lib/components/magic/scroll-progress";
    import {HandCoins, BadgeInfo, Cog, BellIcon,LogOutIcon, LogInIcon, UserRound, Shield, Link } from "@lucide/svelte";
  import logo from '$lib/assets/laf1.svg';
      import { t, tJoin, tMany, dativeSuffix } from '$lib/stores/i18n.svelte.js';
  import { goto } from '$app/navigation';
  import { page } from "$app/stores";
  import { userStore } from "$lib/stores/user";
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
    goToNotificationLink,
    approveTranslation,
    rejectTranslation
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

  // Locale-aware URL helper
  const currentLocale = $derived((t as any).currentLocale || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;

  // Reaktif menu array'i - dil değiştiğinde otomatik güncellenir
  let menu = $derived([
    { isconstruction: "false", name: t('Articles'), href: l("/articles") },
    { isconstruction: "false", name: t('Events'), href: l("/events") },
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
    playSound('swift2');
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

  async function handleEditArticle(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification || !notification.meta?.articleId) return;

    // Navigate to edit page with query parameters
    goto(l(`/write?articleId=${notification.meta.articleId}&mode=edit`));
    showNotificationsDialog = false;
  }

  async function handleApproveTranslation(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification || !notification.meta?.translationStatusId) return;

    const success = await approveTranslation(notification);
    if (success) {
      showNotificationsDialog = false;
    }
  }

  async function handleRejectTranslation(event: CustomEvent<{ notification: NotificationRecord }>) {
    const notification = event.detail.notification;
    if (!notification || !notification.meta?.translationStatusId) return;

    const success = await rejectTranslation(notification);
    if (success) {
      showNotificationsDialog = false;
    }
  }

  async function handleMarkAllNotifications() {
    await markAllNotificationsRead();
    // Refresh the notifications list to reflect the changes
    notificationsList = await fetchNotifications();
    // Update the unread count
    unreadTotal = 0;
  }

  let openSettings = $state(false);
  // Ve fonksiyonu ekleyin:
  function handleSettingsClick() {

    openSettings = true;

  }

  function scrollToDonations() {
    const element = document.getElementById('donations');
    if (element) {
      // Already on homepage, just scroll
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Not on homepage, navigate first with hash
      goto(l('/#donations'));
    }
  }
 import { playSound } from "$lib/stores/sound"; // 🔥 ekle
 let prevOpen = openSettings;

  $effect(() => {
    if (openSettings !== prevOpen) {
      playSound("swift2");
      prevOpen = openSettings;
    }
  });
    // Subscribe to user store
  const currentUser = $derived($userStore.user);
  const userLoading = $derived($userStore.loading);

  $effect(() => {
  });

  // Fetch user data on component mount
  $effect(() => {
    userStore.fetchUser();
  });
    const accountImage = $derived(
      currentUser && typeof currentUser.avatar === 'string' && currentUser.avatar.trim().length > 0
        ? currentUser.avatar
        : undefined
    );
    const accountHref = $derived(currentUser?.nickname ? l(`/${currentUser.nickname}`) : l('/account'));

  const isModerator = $derived(currentUser?.role === 'moderator' || currentUser?.role === 'admin');
  
  const loggedInItems = $derived<MenuItem[]>([
    { icon: accountImage ? undefined : UserRound, image: accountImage, name: t('Account'), href: accountHref },
    { icon: Cog, name: t('Settings'), onClick: handleSettingsClick },
    { icon: BellIcon, name: t('Notifications'), onClick: openNotificationsDialog, badge: unreadTotal },
    ...(isModerator ? [{ icon: Shield, name: t('Moderation'), href: l("/moderation") }] : []),
    { icon: Link, name: t('Links'), href: l("/links") },
    { icon: HandCoins, name: t('Donate'), onClick: () => scrollToDonations() },
    { icon: LogOutIcon, name: t('Logout'), href: l('/logout'), customStyle: "!text-red-500"},
  ]);

  // Reaktif logged-out items - dil değiştiğinde otomatik güncellenir
  const baseLoggedOut = $derived<MenuItem[]>([
    { icon: LogInIcon, name: t('Login'), href: l("/login") },
    { icon: Link, name: t('Links'), href: l("/links") },
    { icon: HandCoins, name: t('Donations'), onClick: () => scrollToDonations() },
  ]);

  // Locale-aware paths
  const loginHref = $derived(`${l('/login')}?redirectTo=${encodeURIComponent($page.url.pathname)}`);

  let items = $state<MenuItem[]>(baseLoggedOut);
  $effect(() => {
    if (currentUser) {
      items = loggedInItems;
    } else {
      items = baseLoggedOut.map((it) => ({ ...it, href: loginHref }));
    }
  }); 

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
  on:editArticle={handleEditArticle}
  on:approveTranslation={handleApproveTranslation}
  on:rejectTranslation={handleRejectTranslation}
/>

<nav class="w-full fixed border-b top-0 z-39 text-secondary-foreground  rounded-xl">
    <div class="absolute -z-1 inset-0 bg-background/44 backdrop-blur-sm"></div>
  <div class="max-w-7xl mx-auto  py-0 sm:py-0.5 px-5 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <Tooltip.Provider>
 <Tooltip.Root>
  <Tooltip.Trigger>   
    <A href={l("/")} ><img class="h-3.5 sm:h-4 text-primary" src="{logo}" alt="LAF" /></A> 
  </Tooltip.Trigger>
  <Tooltip.Content>
   <p>{t('GoToHomePage')}</p>
  </Tooltip.Content>
 </Tooltip.Root>
</Tooltip.Provider>

      <div class="py-2 max-w-50 sm:p-0 sm:max-w-full overflow-auto flex text-secondary-foreground space-x-4 text-xs">
        {#each menu as item}

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


        {/each}
      </div>

<div>
    <DropdownMenuMotion {items} /></div>
    </div>
  </div>
</nav> 
<ScrollProgress />
