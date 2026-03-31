// src/lib/stores/sound-settings.ts
import { writable } from "svelte/store";
import { browser } from '$app/environment';

// Individual sound effect settings
type SoundSettings = {
  [key: string]: boolean;
};

// Default sound settings - all enabled initially
const defaultSoundSettings: SoundSettings = {
  click: true,
  error: true,
  plink: true,
  pop: true,
  tap: true,
  tab: true,
  lock: true,
  unlock: true,
  success: true,
  info: true,
  errorNot: true,
  swift: true,
  swift2: true,
  refresh: true,
  loading: true
};

// Get initial sound settings from localStorage
const getInitialSoundSettings = (): SoundSettings => {
  if (!browser) return defaultSoundSettings;
  
  try {
    const stored = localStorage.getItem('individualSoundSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any new sounds added
      return { ...defaultSoundSettings, ...parsed };
    }
  } catch (error) {
  }
  
  return defaultSoundSettings;
};

export const individualSoundSettings = writable<SoundSettings>(getInitialSoundSettings());

// Subscribe to changes and save to localStorage
if (browser) {
  individualSoundSettings.subscribe((value) => {
    try {
      localStorage.setItem('individualSoundSettings', JSON.stringify(value));
    } catch (error) {
    }
  });
}

// Helper function to check if a specific sound is enabled
export function isIndividualSoundEnabled(soundKey: string): boolean {
  let enabled = true;
  const unsubscribe = individualSoundSettings.subscribe((settings) => {
    enabled = settings[soundKey] !== false; // Default to true if not explicitly set
  });
  unsubscribe();
  return enabled;
}

// Helper function to toggle a specific sound
export function toggleIndividualSound(soundKey: string) {
  individualSoundSettings.update((settings) => ({
    ...settings,
    [soundKey]: !settings[soundKey]
  }));
}

// Helper function to enable/disable all individual sounds
export function setAllIndividualSounds(enabled: boolean) {
  individualSoundSettings.update((settings) => {
    const newSettings = { ...settings };
    Object.keys(newSettings).forEach(key => {
      newSettings[key] = enabled;
    });
    return newSettings;
  });
}
