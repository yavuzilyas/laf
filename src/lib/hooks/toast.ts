import { writable } from 'svelte/store';
import { notificationPreferences } from '$lib/stores/notification-preferences';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
    id: number;
    // Either provide a plain message OR i18n key(s)
    message?: string;
    key?: string;        // single i18n key
    keys?: string[];     // multiple i18n keys to be joined with a separator
    sep?: string;        // optional separator for keys (default: space)
    type: ToastType;
    duration?: number;
    link?: string;
};

const { subscribe, update } = writable<Toast[]>([]);

let idCounter = 1;

export const toasts = { subscribe };

export function showToast(
    message: string,
    type: ToastType = 'info',
    duration = 3000,
    options?: { link?: string }
): number {
    // Check notification preferences before showing toast
    let shouldShowToast = true;
    let currentPreferences = {
        successToasts: true,
        errorToasts: true,
        infoToasts: true,
        warningToasts: true
    };
    
    // Get current preferences
    const unsubscribe = notificationPreferences.subscribe(pref => {
        currentPreferences = pref;
    });
    unsubscribe();
    
    // Check if this toast type should be shown
    switch (type) {
        case 'success':
            shouldShowToast = currentPreferences.successToasts;
            break;
        case 'error':
            shouldShowToast = currentPreferences.errorToasts;
            break;
        case 'info':
            shouldShowToast = currentPreferences.infoToasts;
            break;
        case 'warning':
            shouldShowToast = currentPreferences.warningToasts;
            break;
        default:
            shouldShowToast = true;
    }
    
    // If toast type is disabled, skip showing
    if (!shouldShowToast) return -1;
    
    // Check if same message is already in queue
    let toastExists = false;
    const unsubscribe2 = toasts.subscribe(list => {
        toastExists = list.some(t => t.message === message && t.type === type && t.link === options?.link);
    });
    unsubscribe2();
    
    if (toastExists) return -1; // Skip if same message is already showing
    
    const id = idCounter++;
    update((list) => [...list, { id, message, type, duration, link: options?.link }]);
    // ToastHost.svelte kendi zamanlayıcısını kullanıyor, burada setTimeout yok
    return id;
}

export function showToastKey(key: string, type: ToastType = 'info', duration = 3000): number {
    // Check notification preferences before showing toast
    let shouldShowToast = true;
    let currentPreferences = {
        successToasts: true,
        errorToasts: true,
        infoToasts: true,
        warningToasts: true
    };
    
    // Get current preferences
    const unsubscribe = notificationPreferences.subscribe(pref => {
        currentPreferences = pref;
    });
    unsubscribe();
    
    // Check if this toast type should be shown
    switch (type) {
        case 'success':
            shouldShowToast = currentPreferences.successToasts;
            break;
        case 'error':
            shouldShowToast = currentPreferences.errorToasts;
            break;
        case 'info':
            shouldShowToast = currentPreferences.infoToasts;
            break;
        case 'warning':
            shouldShowToast = currentPreferences.warningToasts;
            break;
        default:
            shouldShowToast = true;
    }
    
    // If toast type is disabled, skip showing
    if (!shouldShowToast) return -1;
    
    // Check if same key is already in queue
    let toastExists = false;
    const unsubscribe2 = toasts.subscribe(list => {
        toastExists = list.some(t => t.key === key && t.type === type);
    });
    unsubscribe2();
    
    if (toastExists) return -1; // Skip if same key is already showing
    
    const id = idCounter++;
    update((list) => [...list, { id, key, type, duration }]);
    // ToastHost.svelte kendi zamanlayıcısını kullanıyor, burada setTimeout yok
    return id;
}

export function showToastKeys(keys: string[], type: ToastType = 'info', duration = 3000, sep = ' '): number {
    // Check notification preferences before showing toast
    let shouldShowToast = true;
    let currentPreferences = {
        successToasts: true,
        errorToasts: true,
        infoToasts: true,
        warningToasts: true
    };
    
    // Get current preferences
    const unsubscribe = notificationPreferences.subscribe(pref => {
        currentPreferences = pref;
    });
    unsubscribe();
    
    // Check if this toast type should be shown
    switch (type) {
        case 'success':
            shouldShowToast = currentPreferences.successToasts;
            break;
        case 'error':
            shouldShowToast = currentPreferences.errorToasts;
            break;
        case 'info':
            shouldShowToast = currentPreferences.infoToasts;
            break;
        case 'warning':
            shouldShowToast = currentPreferences.warningToasts;
            break;
        default:
            shouldShowToast = true;
    }
    
    // If toast type is disabled, skip showing
    if (!shouldShowToast) return -1;
    
    const keysStr = keys.join(',');
    
    // Check if same keys combination is already in queue
    let toastExists = false;
    const unsubscribe2 = toasts.subscribe(list => {
        toastExists = list.some(t => 
            t.keys && 
            t.keys.join(',') === keysStr && 
            t.type === type && 
            t.sep === sep
        );
    });
    unsubscribe2();
    
    if (toastExists) return -1; // Skip if same keys combination is already showing
    
    const id = idCounter++;
    update((list) => [...list, { id, keys, sep, type, duration }]);
    // ToastHost.svelte kendi zamanlayıcısını kullanıyor, burada setTimeout yok
    return id;
}

export function dismissToast(id: number): void {
	update((list) => list.filter((t) => t.id !== id));
}

const PENDING_TOAST_KEY = '__pending_toast__';

export function persistToast(message: string, type: ToastType = 'info', duration = 3000): void {
    try {
        sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, type, duration }));
    } catch {}
}

export function persistToastKey(key: string, type: ToastType = 'info', duration = 3000): void {
    try {
        sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ key, type, duration }));
    } catch {}
}

export function persistToastKeys(keys: string[], type: ToastType = 'info', duration = 3000, sep = ' '): void {
    try {
        sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ keys, sep, type, duration }));
    } catch {}
}

export function readAndClearPendingToast(): { message?: string; key?: string; keys?: string[]; sep?: string; type: ToastType; duration: number } | null {
    try {
        const raw = sessionStorage.getItem(PENDING_TOAST_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(PENDING_TOAST_KEY);
        const parsed = JSON.parse(raw);
        return { message: parsed.message, key: parsed.key, keys: parsed.keys, sep: parsed.sep, type: parsed.type, duration: parsed.duration };
    } catch {
        return null;
    }
}
