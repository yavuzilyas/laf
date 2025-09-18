<script lang="ts">
  import { onMount } from 'svelte';
  import Loader from "@lucide/svelte/icons/loader";
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
    class="fixed w-full h-full z-1000 inset-0 flex flex-col gap-1 items-center justify-center bg-neutral-900"
    out:fade={{ duration: 250 }}
  >
    <img src={logo} alt="LAF" class="h-20 w-20" />
    <Loader size="32" class="text-primary animate-spin" />
  </div>
{/if}
