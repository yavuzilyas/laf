<script lang="ts">
  import { onMount } from 'svelte';
  import { Loader } from "@lucide/svelte";
  import logo from "$lib/assets/laf1.svg";
  import { fade } from 'svelte/transition';
  import lottie from 'lottie-web';
  import animationData from '$lib/assets/logo-lottie.json'; // kendi Lottie JSON'unun yolu

  let showLoader = true;     // tüm loader ekranı
  let showLottie = false;    // Lottie görünürlüğü
  let spinnerVisible = true; // logo + çark
  let lottieContainer: HTMLDivElement;

  onMount(() => {
    // Simülasyon: sayfa yükleniyor
    setTimeout(() => {
      // önce logo + çarkı kaybet
      spinnerVisible = false;
      // Lottie bitince loader'ı kapat
        setTimeout(() => {
      showLottie = true;
        }, 500);
      // Lottie’yi göster

      // Lottie başlat
      const anim = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData
      });

      // Lottie bitince loader'ı kapat
      anim.addEventListener('complete', () => {
        setTimeout(() => {
          showLoader = false;
        }, 550);
      });
    }, 1); // site yüklenme süresi gibi düşün
  });
</script>

{#if showLoader}
  <div
    class="fixed pb-10 inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-3xl"
    out:fade={{ duration: 500 }}
  >
    <!-- 1️⃣ Logo + çark (opacity ile gizleniyor) -->
    <div
      class="flex flex-col items-center justify-center absolute transition-opacity duration-500"
      style="opacity: {spinnerVisible ? 1 : 0};"
    >
      <img src={logo} alt="LAF" class="h-20 w-20" />
      <Loader size="32" class="text-primary animate-spin" />
    </div>

    <!-- 2️⃣ Lottie (opacity ile gösteriliyor) -->
    <div
      bind:this={lottieContainer}
      class="w-full h-full transition-opacity duration-500"
      style="opacity: {showLottie ? 1 : 0};"
    ></div>
  </div>
{/if}
