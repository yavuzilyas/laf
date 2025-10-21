import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { derived, writable } from 'svelte/store';
import { showToast } from '$lib/hooks/toast';
import type { NotificationRecord } from '$lib/types/notification';

const notificationsStore = writable<NotificationRecord[]>([]);
const unreadCountStore = writable(0);

let watcherStarted = false;
let isInitialLoad = true;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let knownIds = new Set<string>();

export const notifications = {
	subscribe: notificationsStore.subscribe
};

export const unreadCount = derived(unreadCountStore, ($value) => $value);

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

		notificationsStore.set(items);
		unreadCountStore.set(unread);

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

		notificationsStore.update((items) =>
			items.map((item) =>
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
	const current = getCurrentNotifications();
	const unreadIds = current.filter((item) => !item.read).map((item) => item.id);
	await markNotificationsRead(unreadIds);
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
