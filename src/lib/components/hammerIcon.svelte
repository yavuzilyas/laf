<script lang="ts">
  import { onMount } from 'svelte';
  import lottie from 'lottie-web';
  import { browser } from '$app/environment';

  let textContainer: HTMLDivElement;
  let animText: any;

  async function loadAnimation(lang: string) {

      // JSON animasyon dosyasını locale bazlı yükle
      let textAnimData;
        textAnimData = (await import('$lib/assets/hammer-lottie.json')).default;
      // Lottie animasyon başlat
      animText = lottie.loadAnimation({
        container: textContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: textAnimData
      });
  }
  onMount(() => {
    loadAnimation();
  });
</script>

<div bind:this={textContainer} class="w-4 h-4 text-primary"></div>
