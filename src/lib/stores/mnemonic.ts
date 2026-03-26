import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'laf.mnemonicPhrase';

function normalizeMnemonic(phrase: string): string {
	return (phrase || '')
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.join(' ');
}

function getInitialMnemonic(): string {
	if (!browser) return '';
	return sessionStorage.getItem(STORAGE_KEY) || '';
}

export const mnemonicPhraseStore = writable<string>(getInitialMnemonic());

if (browser) {
	mnemonicPhraseStore.subscribe((value) => {
		const normalized = normalizeMnemonic(value);
		if (!normalized) {
			sessionStorage.removeItem(STORAGE_KEY);
			return;
		}
		sessionStorage.setItem(STORAGE_KEY, normalized);
	});
}

export function setMnemonicPhrase(phrase: string) {
	mnemonicPhraseStore.set(normalizeMnemonic(phrase));
}

export function clearMnemonicPhrase() {
	mnemonicPhraseStore.set('');
	if (browser) {
		sessionStorage.removeItem(STORAGE_KEY);
	}
}
