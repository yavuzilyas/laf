import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { derived, writable, type Writable } from 'svelte/store';
import { showToast, showToastKey } from '$lib/hooks/toast';
import type { NotificationRecord, TranslationObject } from '$lib/types/notification';
import { t } from '$lib/stores/i18n.svelte';
import { notificationPreferences, loadNotificationPreferences } from '$lib/stores/notification-preferences';

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

	// Ensure notification preferences are loaded
	loadNotificationPreferences();

	try {
		const res = await fetch('/api/notifications?page=1&pageSize=20', {
			credentials: 'include'
		});

		if (!res.ok) {
			
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
					const text = item.title || item.message;
					
					// Check notification preferences before showing
					let shouldShowNotification = false;
					let currentPreferences = {
						follow: true,
						like: true,
						comment: true,
						reply: true,
						announcement: true,
						emailNotifications: true,
						pushNotifications: true,
						messageSounds: true,
						systemNotifications: true
					};
					
					// Get current preferences
					const unsubscribe = notificationPreferences.subscribe(pref => {
						currentPreferences = pref;
					});
					unsubscribe();
					
					// Check if this notification type should be shown
					switch (item.type) {
						case 'follow':
							shouldShowNotification = currentPreferences.follow;
							break;
						case 'like':
							shouldShowNotification = currentPreferences.like;
							break;
						case 'comment':
							shouldShowNotification = currentPreferences.comment;
							break;
						case 'reply':
							shouldShowNotification = currentPreferences.reply;
							break;
						case 'announcement':
							shouldShowNotification = currentPreferences.announcement;
							break;
						default:
							shouldShowNotification = true;
					}
					
					// If notification type is disabled, skip showing
					if (!shouldShowNotification) {
						continue;
					}
					
					// Handle JSON strings
					let processedText = text;
					if (typeof text === 'string') {
						try {
							const parsed = JSON.parse(text);
							if (parsed && typeof parsed === 'object' && parsed.key) {
								processedText = parsed;
							}
						} catch {
							// If parsing fails, keep as string
						}
					}
					
					if (typeof processedText === 'string') {
						showToast(processedText, 'info', 6000, {
							link: item.link || undefined
						});
					} else {
						// Process values and replace {user} with actor name
						const processedValues: Record<string, string | number> = {};
						
						// First, process existing values (skip user values)
						if (processedText.values) {
							for (const [key, value] of Object.entries(processedText.values)) {
								if (key === 'user' || key === 'user1' || key === 'user2') {
									// Skip user values - we'll add them from actor/meta
									continue;
								} else if (typeof value === 'string' && value.startsWith('notifications.')) {
									processedValues[key] = t(value);
								} else if (value !== null && value !== undefined) {
									processedValues[key] = value;
								}
							}
						}
						
						// Get translation template to check what placeholders are needed
						const translationTemplate = t(processedText.key);
						
						// Add user values from actor/meta based on what's needed in template
						if (translationTemplate.includes('{user}') && !processedValues.user) {
							if (item.actor) {
								processedValues.user = item.actor.nickname || item.actor.name || t('notifications.messages.unknownUser');
							} else {
								processedValues.user = t('notifications.messages.unknownUser');
							}
						}
						
						// Handle user1 and user2 for multiple user notifications
						if (translationTemplate.includes('{user1}') && !processedValues.user1) {
							if (item.meta?.likerNames && Array.isArray(item.meta.likerNames) && item.meta.likerNames.length > 0) {
								processedValues.user1 = item.meta.likerNames[0] || t('notifications.messages.unknownUser');
							} else if (item.actor) {
								processedValues.user1 = item.actor.nickname || item.actor.name || t('notifications.messages.unknownUser');
							} else {
								processedValues.user1 = t('notifications.messages.unknownUser');
							}
						}
						
						if (translationTemplate.includes('{user2}') && !processedValues.user2) {
							if (item.meta?.likerNames && Array.isArray(item.meta.likerNames) && item.meta.likerNames.length > 1) {
								processedValues.user2 = item.meta.likerNames[1] || t('notifications.messages.unknownUser');
							} else {
								processedValues.user2 = t('notifications.messages.unknownUser');
							}
						}
						
						const translatedText = t(processedText.key, processedValues);
						showToast(translatedText, 'info', 6000, {
							link: item.link || undefined
						});
					}
				}
			}
		}

		knownIds = nextIds;
		isInitialLoad = false;
	} catch (error) {
		
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
			
			return;
		}

		const payload = await res.json();
		const unread = payload?.unreadCount ?? 0;
		unreadCountStore.set(unread);

		blockedActorIdsStore.update((ids: string[]) => ids.filter((id) => id !== actorId));
	} catch (error) {
		
	}
}

export async function approveTranslation(notification: NotificationRecord): Promise<boolean> {
	if (!browser || !notification?.meta?.translationStatusId) return false;

	try {
		const res = await fetch(`/api/translations/${notification.meta.translationStatusId}/review`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'approve' })
		});

		if (!res.ok) {
			const error = await res.json();
			showToast(error.error || 'Çeviri onaylanırken hata oluştu', 'error', 3000);
			return false;
		}

		const payload = await res.json();
		
		// Remove the notification from store
		notificationsStore.update((items: NotificationRecord[]) =>
			items.filter((item: NotificationRecord) => item.id !== notification.id)
		);
		
		showToastKey('notifications.messages.translationApproved', 'success', 3000);
		return true;
	} catch (error) {
		showToast('Çeviri onaylanırken hata oluştu', 'error', 3000);
		return false;
	}
}

export async function rejectTranslation(notification: NotificationRecord, reviewNotes?: string): Promise<boolean> {
	if (!browser || !notification?.meta?.translationStatusId) return false;

	try {
		const res = await fetch(`/api/translations/${notification.meta.translationStatusId}/review`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ action: 'reject', reviewNotes })
		});

		if (!res.ok) {
			const error = await res.json();
			showToast(error.error || 'Çeviri reddedilirken hata oluştu', 'error', 3000);
			return false;
		}

		const payload = await res.json();
		
		// Remove the notification from store
		notificationsStore.update((items: NotificationRecord[]) =>
			items.filter((item: NotificationRecord) => item.id !== notification.id)
		);
		
		showToastKey('notifications.messages.translationRejected', 'success', 3000);
		return true;
	} catch (error) {
		showToast('Çeviri reddedilirken hata oluştu', 'error', 3000);
		return false;
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
			try {
				await goto(hash ? `${pathWithQuery}#${hash}` : pathWithQuery, {
					noscroll: !!hash
				});
			} catch (error) {
				// Fallback to direct navigation if goto fails
				window.location.href = hash ? `${pathWithQuery}#${hash}` : pathWithQuery;
			}
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
		
	}
}
