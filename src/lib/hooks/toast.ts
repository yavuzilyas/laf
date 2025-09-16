import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
};

const { subscribe, update } = writable<Toast[]>([]);

let idCounter = 1;

export const toasts = { subscribe };

export function showToast(message: string, type: ToastType = 'info', duration = 2500): number {
	const id = idCounter++;
	update((list) => [...list, { id, message, type, duration }]);
	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}
	return id;
}

export function dismissToast(id: number): void {
	update((list) => list.filter((t) => t.id !== id));
}

const PENDING_TOAST_KEY = '__pending_toast__';

export function persistToast(message: string, type: ToastType = 'info', duration = 2500): void {
	try {
		sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, type, duration }));
	} catch {}
}

export function readAndClearPendingToast(): { message: string; type: ToastType; duration: number } | null {
	try {
		const raw = sessionStorage.getItem(PENDING_TOAST_KEY);
		if (!raw) return null;
		sessionStorage.removeItem(PENDING_TOAST_KEY);
		const parsed = JSON.parse(raw);
		return { message: parsed.message, type: parsed.type, duration: parsed.duration };
	} catch {
		return null;
	}
}
