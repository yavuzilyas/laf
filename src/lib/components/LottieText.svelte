<script lang="ts">
  import { onMount } from 'svelte';
  import lottie from 'lottie-web';
  import { t } from '$lib/stores/i18n.svelte.js';
  import { browser } from '$app/environment';

  let textContainer: HTMLDivElement;
  let animText: any;

  // Reactive olarak locale değişimini takip ediyoruz
  $: language = t.currentLocale;

  // Language değiştiğinde animasyonu yeniden yükle
  $: if (language && browser) {
    loadAnimation(language);
  }

  async function loadAnimation(lang: string) {
    // Önce mevcut animasyonu destroy et
    if (animText) animText.destroy();

    try {
      // JSON animasyon dosyasını locale bazlı yükle
      let textAnimData;

      if (lang === 'en') {
        textAnimData = (await import('$lib/assets/text-lottie-en.json')).default;
      } else {
        textAnimData = (await import('$lib/assets/text-lottie-tr.json')).default;
      }

      // Lottie animasyon başlat
      animText = lottie.loadAnimation({
        container: textContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: textAnimData
      });
    } catch (error) {
      console.error(`Animation for locale '${lang}' could not be loaded:`, error);
    }
  }

</script>

<div bind:this={textContainer} class="w-34 h-full"></div>
