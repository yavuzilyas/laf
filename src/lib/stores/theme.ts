import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const theme = writable<'light' | 'dark'>('light');

if (browser) {
    // Initialize theme based on current document class
    const updateTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        theme.set(isDark ? 'dark' : 'light');
    };

    // Initial check
    updateTheme();

    // Watch for changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}
