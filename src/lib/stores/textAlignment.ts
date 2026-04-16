import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type TextAlignment = 'justify' | 'left' | 'center' | 'right';

export const textAlignment = writable<TextAlignment>('justify');

if (browser) {
    // Load from localStorage
    const stored = localStorage.getItem('editorTextAlignment');
    if (stored !== null && ['justify', 'left', 'center', 'right'].includes(stored)) {
        textAlignment.set(stored as TextAlignment);
        // Apply to DOM immediately
        document.documentElement.setAttribute('data-editor-text-align', stored);
    } else {
        // Default
        document.documentElement.setAttribute('data-editor-text-align', 'justify');
    }

    // Watch for changes and save to localStorage
    textAlignment.subscribe((value) => {
        localStorage.setItem('editorTextAlignment', value);
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-editor-text-align', value);
        }
    });
}
