import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const highContrast = writable<boolean>(false);

if (browser) {
    let isUpdating = false; // Prevent infinite loop
    
    // Load from localStorage
    const stored = localStorage.getItem('highContrast');
    if (stored !== null) {
        const isEnabled = JSON.parse(stored);
        highContrast.set(isEnabled);
        // Apply to DOM immediately
        if (isEnabled) {
            document.documentElement.classList.add('highcontrast');
        }
    }

    // Initialize high contrast based on current document class
    const updateHighContrast = () => {
        if (isUpdating) return; // Prevent recursive updates
        
        isUpdating = true;
        const isHighContrast = document.documentElement.classList.contains('highcontrast');
        highContrast.set(isHighContrast);
        // Save to localStorage
        localStorage.setItem('highContrast', JSON.stringify(isHighContrast));
        isUpdating = false;
    };

    // Initial check
    updateHighContrast();

    // Watch for changes
    const observer = new MutationObserver((mutations) => {
        // Only update if the change wasn't triggered by our store
        const hasRelevantChange = mutations.some(mutation => 
            mutation.type === 'attributes' && 
            mutation.attributeName === 'class'
        );
        if (hasRelevantChange) {
            updateHighContrast();
        }
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}
