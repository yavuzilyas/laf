// src/lib/stores/fullscreen.ts
import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isFullscreen = writable(false);

export function toggleFullscreen() {
  if (!browser) return;

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

if (browser) {
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.set(!!document.fullscreenElement);
  });
}
