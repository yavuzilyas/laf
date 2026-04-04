import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type FontSize = 'small' | 'medium' | 'large';

export const fontSize = writable<FontSize>('medium');

if (browser) {
    // Load from localStorage
    const stored = localStorage.getItem('editorFontSize');
    if (stored !== null && (stored === 'small' || stored === 'medium' || stored === 'large')) {
        fontSize.set(stored as FontSize);
        // Apply to DOM immediately
        document.documentElement.setAttribute('data-editor-font-size', stored);
    } else {
        // Default
        document.documentElement.setAttribute('data-editor-font-size', 'medium');
    }

    // Watch for changes and save to localStorage
    fontSize.subscribe((value) => {
        localStorage.setItem('editorFontSize', value);
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-editor-font-size', value);
        }
    });
}
