<script lang="ts">
  import { onMount } from 'svelte';
  import { Loader } from "@lucide/svelte";
  import logo from "$lib/assets/laf1.svg";
  import { fade, scale } from 'svelte/transition';

  let showLoader = true; // DOM’da kalıp animasyonla çıkacak

  onMount(() => {
    // sayfa yüklenince loader animasyonu başlasın
    setTimeout(() => {
      showLoader = false;
    }, 1); // istediğin süreye göre ayarla
  });
</script>

{#if showLoader}
  <div
    class="overflow-none fixed w-full h-full pb-28 z-1000 inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl"
    out:fade={{ duration: 333 }}
  >
    <img src={logo} alt="LAF" class="h-20 w-20" />
    <Loader size="32" class="text-primary animate-spin" />
  </div>
{/if}
