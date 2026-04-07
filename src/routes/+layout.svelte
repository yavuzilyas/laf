<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import "../app.css";
  import NotificationToastWrapper from '$lib/components/NotificationToastWrapper.svelte';
  import Preloader from "$lib/components/Preloader.svelte";
  import { onMount } from 'svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import { ModeWatcher } from "mode-watcher";
  import SEO from '$lib/components/SEO.svelte';
  // Props declaration import'lardan sonra gelir
  let { children, data } = $props();
  import { preloadSounds } from "$lib/stores/sound";
  import { soundFiles } from "$lib/sounds";
  import { soundEnabled } from "$lib/stores/sound";
  import { browser } from '$app/environment';

  // Initialize i18n from server-side rendered data
  // This ensures translations are ready immediately (no client-side loading flash)
  i18n.initFromSSR(data.locale, data.translations);

  onMount(() => {
    // Ses durumunu local storage'dan yükle
    if (browser) {
      const storedSoundState = localStorage.getItem('soundEnabled');
      if (storedSoundState !== null) {
        soundEnabled.set(JSON.parse(storedSoundState));
      }
    }

    // Defer sound preloading to reduce main-thread work
    // Use requestIdleCallback with timeout fallback for browser compatibility
    const schedulePreload = () => {
      preloadSounds(soundFiles);
    };

    if (browser) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(schedulePreload, { timeout: 2000 });
      } else {
        // Fallback: delay preloading until after initial render
        setTimeout(schedulePreload, 100);
      }
    }
  });
  import Loader from "$lib/components/load.svelte";
  import { page } from '$app/stores';

  // Global QR Entry Tracking - works on all pages
  $effect(() => {
    if (browser && typeof window !== 'undefined') {
      // Check if URL contains #q hash
      if (window.location.hash === '#q') {
        // Get the full URL (without the hash)
        const sourceUrl = window.location.href.replace(/#q$/, '');
        
        // Record QR entry
        fetch('/api/qr-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl })
        }).catch(() => {
          // Silently fail - don't disrupt user experience
        });
      }
    }
  });
</script>
<Loader />
<SEO />
<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Preloader />
<NotificationToastWrapper user={data.user} />

<ModeWatcher />
{@render children?.()}