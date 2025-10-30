import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { derived, writable, type Writable } from 'svelte/store';
import { showToast } from '$lib/hooks/toast';
import type { NotificationRecord } from '$lib/types/notification';

const notificationsStore: Writable<NotificationRecord[]> = writable<NotificationRecord[]>([]);
const unreadCountStore: Writable<number> = writable(0);
const blockedActorIdsStore: Writable<string[]> = writable<string[]>([]);

let watcherStarted = false;
let isInitialLoad = true;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let knownIds = new Set<string>();

export const notifications = {
	subscribe: notificationsStore.subscribe
};

export const unreadCount = derived(unreadCountStore, ($value: number) => $value);
export const blockedActorIds = derived(blockedActorIdsStore, ($value: string[]) => $value);

export async function fetchNotifications(): Promise<void> {
	if (!browser) return;

	try {
		const res = await fetch('/api/notifications?page=1&pageSize=20', {
			credentials: 'include'
		});

		if (!res.ok) {
			console.error('Failed to fetch notifications', res.status);
			return;
		}

		const payload = await res.json();
		const items: NotificationRecord[] = payload?.data ?? [];
		const unread = payload?.unreadCount ?? 0;
		const blocked: string[] = Array.isArray(payload?.blockedActorIds) ? payload.blockedActorIds : [];

		notificationsStore.set(items);
		unreadCountStore.set(unread);
		blockedActorIdsStore.set(blocked);

		const nextIds = new Set(items.map((i) => i.id));

		if (!isInitialLoad) {
			for (const item of items) {
				if (!knownIds.has(item.id) && !item.read) {
					showToast(item.title || item.message, 'info', 6000, {
						link: item.link || undefined
					});
				}
			}
		}

		knownIds = nextIds;
		isInitialLoad = false;
	} catch (error) {
		console.error('Failed to fetch notifications', error);
	}
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
	if (!browser || !ids.length) return;

	try {
		const res = await fetch('/api/notifications', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ ids })
		});

		if (!res.ok) {
			console.error('Failed to mark notifications as read', res.status);
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		notificationsStore.update((items: NotificationRecord[]) =>
			items.map((item: NotificationRecord) =>
				ids.includes(item.id)
					? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
					: item
			)
		);
	} catch (error) {
		console.error('Failed to mark notifications as read', error);
	}
}

export async function markAllNotificationsRead(): Promise<void> {
	if (!browser) return;

	try {
		const res = await fetch('/api/notifications', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'markAllRead' })
		});

		if (!res.ok) {
			console.error('Failed to mark all notifications as read', res.status);
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		// Update local store
		notificationsStore.update((items: NotificationRecord[]) =>
			items.map((item: NotificationRecord) => ({ ...item, read: true, readAt: new Date().toISOString() }))
		);
	} catch (error) {
		console.error('Failed to mark all notifications as read', error);
	}
}

export async function deleteNotification(notificationId: string): Promise<void> {
	if (!browser || !notificationId) return;

	try {
		const res = await fetch('/api/notifications', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'delete', notificationId })
		});

		if (!res.ok) {
			console.error('Failed to delete notification', res.status);
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		// Update local store
		notificationsStore.update((items: NotificationRecord[]) =>
			items.filter((item: NotificationRecord) => item.id !== notificationId)
		);
	} catch (error) {
		console.error('Failed to delete notification', error);
	}
}

export async function blockUserNotifications(actorId: string): Promise<void> {
	if (!browser || !actorId) return;

	try {
		const res = await fetch('/api/notifications', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'blockUser', actorId })
		});

		if (!res.ok) {
			console.error('Failed to block user notifications', res.status);
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		// Update local store - remove all notifications from this user
		notificationsStore.update((items: NotificationRecord[]) =>
			items.filter((item: NotificationRecord) => item.actor?.id !== actorId)
		);

		blockedActorIdsStore.update((ids: string[]) => (ids.includes(actorId) ? ids : ids.concat(actorId)));
	} catch (error) {
		console.error('Failed to block user notifications', error);
	}
}

export async function unblockUserNotifications(actorId: string): Promise<void> {
	if (!browser || !actorId) return;

	try {
		const res = await fetch('/api/notifications', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'unblockUser', actorId })
		});

		if (!res.ok) {
			console.error('Failed to unblock user notifications', res.status);
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		blockedActorIdsStore.update((ids: string[]) => ids.filter((id) => id !== actorId));
	} catch (error) {
		console.error('Failed to unblock user notifications', error);
	}
}

export function startNotificationsWatcher(): void {
	if (!browser || watcherStarted) return;

	watcherStarted = true;
	fetchNotifications();

	pollTimer = setInterval(fetchNotifications, 15000);
}

export function stopNotificationsWatcher(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	watcherStarted = false;
}

function getCurrentNotifications(): NotificationRecord[] {
	let current: NotificationRecord[] = [];
	notificationsStore.subscribe((value) => {
		current = value;
	})().unsubscribe?.();
	return current;
}

export async function goToNotificationLink(link?: string | null): Promise<void> {
	if (!browser || !link) return;

	try {
		const url = new URL(link, window.location.origin);
		const hash = url.hash?.replace(/^#/, '') ?? '';
		const pathWithQuery = `${url.pathname}${url.search}`;

		if (pathWithQuery !== `${window.location.pathname}${window.location.search}`) {
			await goto(hash ? `${pathWithQuery}#${hash}` : pathWithQuery, {
				replaceState: false,
				noscroll: !!hash
			});
		} else if (hash) {
			window.history.replaceState(window.history.state, '', `${pathWithQuery}#${hash}`);
		}

		if (hash) {
			const scrollToTarget = (attempts: number): void => {
				const target = document.getElementById(hash) as HTMLElement | null;
				if (target) {
					target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
					return;
				}
				if (attempts > 0) {
					setTimeout(() => scrollToTarget(attempts - 1), 100);
				}
			};
			scrollToTarget(20);
		}
	} catch (error) {
		console.error('Failed to navigate to notification link', error);
	}
}
