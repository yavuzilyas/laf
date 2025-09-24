import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
    id: number;
    // Either provide a plain message OR i18n key(s)
    message?: string;
    key?: string;        // single i18n key
    keys?: string[];     // multiple i18n keys to be joined with a separator
    sep?: string;        // optional separator for keys (default: space)
    type: ToastType;
    duration?: number;
};

const { subscribe, update } = writable<Toast[]>([]);

let idCounter = 1;

export const toasts = { subscribe };

export function showToast(message: string, type: ToastType = 'info', duration = 3000): number {
    const id = idCounter++;
    update((list) => [...list, { id, message, type, duration }]);
    if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
    }
    return id;
}

export function showToastKey(key: string, type: ToastType = 'info', duration = 3000): number {
    const id = idCounter++;
    update((list) => [...list, { id, key, type, duration }]);
    if (duration > 0) setTimeout(() => dismissToast(id), duration);
    return id;
}

export function showToastKeys(keys: string[], type: ToastType = 'info', duration = 3000, sep = ' '): number {
    const id = idCounter++;
    update((list) => [...list, { id, keys, sep, type, duration }]);
    if (duration > 0) setTimeout(() => dismissToast(id), duration);
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
