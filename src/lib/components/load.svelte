<script lang="ts">
  import { onMount } from 'svelte';
  import { Loader } from "@lucide/svelte";
  import logo from "$lib/assets/hatlaf.svg";
  import { fade } from 'svelte/transition';
  import lottie from 'lottie-web';
  import animationData from '$lib/assets/Negative-mask-effect-1.json'; // kendi Lottie JSON'unun yolu

  let showLoader = true;     // tüm loader ekranı
  let showLottie = false;    // Lottie görünürlüğü
  let spinnerVisible = true; // logo + çark
  let lottieContainer: HTMLDivElement;

  onMount(() => {
    // Simülasyon: sayfa yükleniyor
    setTimeout(() => {
      // önce logo + çarkı kaybet
      spinnerVisible = false;
      
      // Lottie'yi göster
      setTimeout(() => {
        showLottie = true;
        
        // Container'ın var olduğundan emin ol
        if (lottieContainer) {
          // Lottie başlat
          const anim = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            animationData
          });
          anim.setSpeed(1.33);

          // Lottie bitince loader'ı kapat
          anim.addEventListener('complete', () => {
            setTimeout(() => {
              showLoader = false;
            }, 750);
          });
        }
      }, 500);
    }, 1); // site yüklenme süresi gibi düşün
  });
</script>

{#if showLoader}
  <div
    class="fixed p-10 inset-0 z-500 w-18 h-18 flex flex-col items-center mx-auto mt-10 border justify-center rounded-xl bg-background/33 backdrop-filter backdrop-blur-sm"
    out:fade={{ duration: 175 }}
  >
    <!-- 1️⃣ Logo + çark (opacity ile gizleniyor) -->
    <div
      class="flex flex-col items-center justify-center absolute transition-opacity duration-175"
      style="opacity: {spinnerVisible ? 1 : 0};"
    >
      <Loader size="32" class="text-primary animate-spin" />
    </div>

    <!-- 2️⃣ Lottie (opacity ile gösteriliyor) -->
    <div
      bind:this={lottieContainer}
      class="w-23.5 h-23.5 transition-opacity duration-175"
      style="opacity: {showLottie ? 1 : 0};"
    ></div>
  </div>
    {/if}
