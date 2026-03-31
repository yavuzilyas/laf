// src/lib/stores/sound.ts
import { writable } from "svelte/store";
import { browser } from '$app/environment';
import { isIndividualSoundEnabled } from './sound-settings';
import { get } from 'svelte/store';

type SoundFiles = {
  [key: string]: {
    wav?: string;
    m4a?: string;
    mp3?: string;
  };
};

// Burada farklı variantlara özel ses dosyalarını map'le
export const sounds: SoundFiles = {
  click: {
    wav: "/sounds/navigation_backward-selection-minimal.wav",
  },
  error: {
    wav: "/sounds/alert_error-02.wav",
  },
  plink: {
    wav: "/sounds/navigation_backward-selection.wav"
  },
  pop: {
    wav: "/sounds/navigation_forward-selection-minimal.wav"
  },
  tap: {
    wav: "/sounds/navigation_backward-selection.wav"
  },
  tab: {
    wav: "/sounds/ui_tap-variant-02.wav"
  },
  lock: {
    wav: "/sounds/ui_lock.wav"
  },
  unlock: {
    wav: "/sounds/ui_unlock.wav"
  },
  success: {
    wav: "/sounds/notification_high-intensity.wav"
  },
  info: {
    wav: "/sounds/notification_ambient.wav"
  },
  errorNot: {
    wav: "/sounds/alert_error-01.wav"
  },
  swift:{
    wav: "/sounds/navigationpush.wav"
  },
  swift2:{
    wav: "/sounds/navigationpop.wav"
  },
  refresh:{
    wav: "/sounds/ui_refresh-feed.wav"
  },
  loading:{
    wav: "/sounds/ui_loading.wav"
  }
};

// Local storage'dan başlangıç değerini al
const getInitialSoundState = () => {
  if (!browser) return false;
  const stored = localStorage.getItem('soundEnabled');
  return stored ? JSON.parse(stored) : false;
};

export const soundEnabled = writable(getInitialSoundState());

// Store değiştiğinde local storage'ı güncelle
soundEnabled.subscribe((value) => {
  if (browser) {
    localStorage.setItem('soundEnabled', JSON.stringify(value));
  }
});

let audioCtx: AudioContext | null = null;
const bufferCache: Record<string, AudioBuffer> = {};

// 🔹 AudioContext'i sadece client'ta oluştur
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export async function loadSound(key: string, url: string) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch sound at ${url}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    bufferCache[key] = await ctx.decodeAudioData(arrayBuffer);
  } catch (error) {
    // no-op
  }
}

export function playSound(key: string) {
  const ctx = getAudioCtx();
  if (!ctx || !bufferCache[key]) return;

  // Check global sound enabled state (dropdown toggle) AND individual sound settings
  if (!get(soundEnabled)) return;
  if (!isIndividualSoundEnabled(key)) return;
  
  const source = ctx.createBufferSource();
  source.buffer = bufferCache[key];
  source.connect(ctx.destination);
  source.start();
}

export async function preloadSounds(sounds: Record<string, string>) {
  await Promise.all(
    Object.entries(sounds).map(([key, url]) => loadSound(key, url))
  );
}
