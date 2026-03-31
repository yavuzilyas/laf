import { writable, type Writable } from 'svelte/store';

export interface NotificationPreferences {
	// Bildirim türleri
	follow: boolean;
	like: boolean;
	comment: boolean;
	reply: boolean;
	announcement: boolean;
	
	// Genel bildirim ayarları
	emailNotifications: boolean;
	pushNotifications: boolean;
	messageSounds: boolean;
	
	// Sistem bildirimleri
	systemNotifications: boolean;
	
	// Toast bildirim tipleri
	successToasts: boolean;
	errorToasts: boolean;
	infoToasts: boolean;
	warningToasts: boolean;
}

const defaultPreferences: NotificationPreferences = {
	follow: true,
	like: true,
	comment: true,
	reply: true,
	announcement: true,
	emailNotifications: true,
	pushNotifications: true,
	messageSounds: true,
	systemNotifications: true,
	successToasts: true,
	errorToasts: true,
	infoToasts: true,
	warningToasts: true
};

// Store for notification preferences
const notificationPreferencesStore: Writable<NotificationPreferences> = writable<NotificationPreferences>(defaultPreferences);

// Export the store
export const notificationPreferences = {
	subscribe: notificationPreferencesStore.subscribe,
	set: notificationPreferencesStore.set,
	update: notificationPreferencesStore.update
};

// Helper functions to toggle specific notification types
export function toggleNotificationType(type: keyof Omit<NotificationPreferences, 'emailNotifications' | 'pushNotifications' | 'messageSounds' | 'systemNotifications'>): void {
	notificationPreferencesStore.update(pref => ({
		...pref,
		[type]: !pref[type]
	}));
}

export function toggleGeneralSetting(setting: keyof Pick<NotificationPreferences, 'emailNotifications' | 'pushNotifications' | 'messageSounds' | 'systemNotifications'>): void {
	notificationPreferencesStore.update(pref => ({
		...pref,
		[setting]: !pref[setting]
	}));
}

// Enable/disable all notifications
export function setAllNotifications(enabled: boolean): void {
	notificationPreferences.set({
		follow: enabled,
		like: enabled,
		comment: enabled,
		reply: enabled,
		announcement: enabled,
		emailNotifications: enabled,
		pushNotifications: enabled,
		messageSounds: enabled,
		systemNotifications: enabled,
		successToasts: enabled,
		errorToasts: enabled,
		infoToasts: enabled,
		warningToasts: enabled
	});
}

// Get notification preference
export function getNotificationPreference(type: keyof NotificationPreferences): boolean {
	let current: NotificationPreferences = defaultPreferences;
	const unsubscribe = notificationPreferences.subscribe(value => {
		current = value;
	});
	unsubscribe();
	return current[type];
}

// Save preferences to localStorage
export function saveNotificationPreferences(): void {
	if (typeof window !== 'undefined') {
		let pref: NotificationPreferences = defaultPreferences;
		const unsubscribe = notificationPreferences.subscribe(value => {
			pref = value;
		});
		unsubscribe();
		localStorage.setItem('notificationPreferences', JSON.stringify(pref));
	}
}

// Load preferences from localStorage
export function loadNotificationPreferences(): void {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('notificationPreferences');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				notificationPreferencesStore.set({ ...defaultPreferences, ...parsed });
			} catch (error) {
				notificationPreferencesStore.set(defaultPreferences);
			}
		}
	}
}
