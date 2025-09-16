<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  let { children } = $props();
  import ToastHost from "$lib/components/ToastHost.svelte";
  import Preloader from "$lib/components/Preloader.svelte";

  
  import { setLocale, currentLocale, availableLocales } from '$lib/stores/locale';
  
  import { onMount } from 'svelte';
  
  // Store'dan değeri almak için
  let selectedLocale = $state('en');
  
  // Store'daki değişiklikleri izle
  const unsubscribe = currentLocale.subscribe(value => {
    selectedLocale = value;
  });
  
  // Dil değiştirme işlevi
  function handleLocaleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLocale = target.value;
    setLocale(newLocale);
  }
  
  // Sayfa yüklendiğinde HTML dil attribute'unu güncelle
  onMount(() => {
    const unsubscribe = currentLocale.subscribe(locale => {
      document.documentElement.lang = locale;
    });
    
    return () => unsubscribe();
  });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Preloader />
<ToastHost />
{@render children?.()}