<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import "../app.css";
  import ToastHost from "$lib/components/ToastHost.svelte";
  import Preloader from "$lib/components/Preloader.svelte";
  import { onMount } from 'svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import { ModeWatcher } from "mode-watcher";
  import Loader from "$lib/components/load.svelte";
  // Props declaration import'lardan sonra gelir
  let { children, data } = $props();
  import { preloadSounds } from "$lib/stores/sound";
  import { soundFiles } from "$lib/sounds";
  import { soundEnabled } from "$lib/stores/sound";
  import { browser } from '$app/environment';


  onMount(async () => {
    // Ses durumunu local storage'dan yükle
    if (browser) {
      const storedSoundState = localStorage.getItem('soundEnabled');
      if (storedSoundState !== null) {
        soundEnabled.set(JSON.parse(storedSoundState));
      }
    }

    await i18n.loadLocale(i18n.currentLocale);
    await preloadSounds(soundFiles);
  });
</script>
<Loader />
<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Preloader />
<ToastHost />

<ModeWatcher />
{@render children?.()}
