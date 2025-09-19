<script lang="ts">
  import favicon from '$lib/assets/laf1.svg';
  import "../app.css";
  import ToastHost from "$lib/components/ToastHost.svelte";
  import Preloader from "$lib/components/Preloader.svelte";
  import { onMount } from 'svelte';
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import { ModeWatcher } from "mode-watcher";

  // Props declaration import'lardan sonra gelir
  let { children } = $props();

  onMount(async () => {
    // Sayfa yüklendiğinde mevcut locale'i yükle
    await i18n.loadLocale(i18n.currentLocale);
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Preloader />
<ToastHost />

<ModeWatcher />
{@render children?.()}
