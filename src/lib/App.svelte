<script lang="ts">
  import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
  import { MorphingText } from '$lib/components/magic/morphing-text';
    import {ContactRoundIcon} from 'svelte-animate-icons';
import { Pointer } from "$lib/components/magic/pointer";
	import { motion } from "motion-sv";
  import Spotlight from "$lib/components/Spotlight.svelte";
import { cn } from "$lib/utils";
  // import Timeline from "$lib/components/timeline/Timeline.svelte";
  // import Content1 from "$lib/components/timeline/Content1.svelte";
  // import Content2 from "$lib/components/timeline/Content2.svelte";
  // import Content3 from "$lib/components/timeline/Content3.svelte";
  // import Content4 from "$lib/components/timeline/Content4.svelte";
  // import Content5 from "$lib/components/timeline/Content5.svelte";
  // import Content6 from "$lib/components/timeline/Content6.svelte";
  // import Content7 from "$lib/components/timeline/Content7.svelte";

  // let timelineData = [
  //   {
  //     title: "1. Eğitim Aşaması",
  //     content: Content1,
  //   },
  //   {
  //     title: "2. Fikir Geliştirme",
  //     content: Content2,
  //   },
  //   {
  //     title: "3. Agitasyon",
  //     content: Content3,
  //   },
  //   {
  //     title: "4. Siyasi Eylem",
  //     content: Content4,
  //   },
  //   {
  //     title: "5. Ekonomik Direniş",
  //     content: Content5,
  //   },
  //   {
  //     title: "6. Kurumsal Değişim",
  //     content: Content6,
  //   },
  //   {
  //     title: "7. Toplumsal Devrim",
  //     content: Content7,
  //   },
  // ];
  import { t, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';

  // Locale-aware URL helper
  const currentLocale = $derived((t as any).currentLocale || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
  import DonationsSection from '$lib/components/donations-section.svelte';
  import ArticleRecommendation from '$lib/components/ArticleRecommendation.svelte';
  import DitheredImageSlider from '$lib/components/magic/dithered-image-slider.svelte';
  import logo from '$lib/assets/laf1.svg';
  import ContactForm from '$lib/components/ContactForm.svelte';
  import { Button } from "$lib/components/ui/button";
  import { Link } from '@lucide/svelte';
  import { showToast } from '$lib/hooks/toast';
  import BookList from '$lib/components/BookList.svelte';

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Copy RSS URL to clipboard
  const copyRssUrl = async (url: string) => {
    if (!browser) return;
    try {
      // Add ?lang=tr only for Turkish locale
      const fullUrl = currentLocale === 'tr'
        ? `${window.location.origin}${url}?lang=tr`
        : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      showToast('RSS URL kopyalandı!', 'success', 2000);
    } catch (err) {
      showToast('Kopyalama başarısız oldu', 'error', 2000);
    }
  };

  let { data } = $props();

  const sliderImages = Object.keys(import.meta.glob('/static/government-is-violence/*.{jpg,jpeg,png,webp,avif}')).map(path => path.replace(/^\/static/, ''));

  // WebGL desteğini kontrol et
  let webglSupported = $state(false); // Başta hiç yükleme, kontrol sonrası varsa göster

  const checkWebGLSupport = (): boolean => {
    if (!browser) return false; // SSR'da yükleme
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  };

  // WebGL kontrolünü effect ile yap
  $effect(() => {
    if (browser) {
      webglSupported = checkWebGLSupport();
    }
  });

  onMount(() => {
    if (browser) {
      // Check if there's a hash in the URL and scroll to it
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  });

</script>

<Navbar />
<main class="w-full h-full flex flex-col overflow-x-hidden">

  {#if webglSupported}
  <div class="h-[95vh] sm:h-[99vh] w-full mt-7.5 sm:mt-5 flex flex-col items-center justify-center antialiased bg-grid-white/[0.02] relative overflow-hidden"
>
      <DitheredImageSlider  images={sliderImages} />

      <MorphingText class="absolute sm:top-4/9 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" texts={[t('firstPart'), t('secondPart')]} />



</div>
  {/if}

<section class="w-full py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative">
    <!-- Hero Section --><div class="w-full absolute top-0 h-40 bg-gradient-to-b from-primary/25 to-background py-12 -z-1"></div>

  <img class="h-16 w-auto mb-5 text-primary" src="{logo}" alt="LAF" />
<h1 class="text-center text-3xl font-bold mb-12">{t('lafFull')}</h1>

  <div class="max-w-7xl mx-auto">
    <!-- Three Column Layout -->
    <div class="grid gap-12 items-start">
      
      <div class="md:max-w-2xl m-auto">
        <h2 class="text-xl font-bold mb-1 text-primary text-start">{t('whoWeAre')}</h2>
        <p class="text-base text-foreground leading-relaxed text-start">
          {t('whoWeAreDescription')}
          
        </p>
          
    <!-- Discord & Telegram Buttons - Turkish only -->
    {#if t.currentLocale === 'tr'}
    <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
      <!-- <Button variant="outline" size="sm" class="gap-2" href="https://discord.gg/laf" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        {t('donations.joinDiscord')}
      </Button> -->
      <Button variant="outline" size="xs" class="gap-2" href="{l("/links")}" target="_blank" rel="noopener noreferrer">
        <Link />
        {t('Links')}
      </Button>
    </div>
    {/if}
      </div>

      <img class="w-full md:w-1/2 h-auto mx-auto" src="AnarchoCapitalism_Waving_Flag_Icon1.svg" alt="An Austrian School crest" />

      <!-- Why Anarcho Capitalism Column -->
      <div class="md:max-w-2xl m-auto">
        <h2 class="text-xl font-bold mb-1 text-primary text-start">{t('whyAnarchoCapitalism')}</h2>
        <p class="text-base text-foreground leading-relaxed text-start">
          {t('whyAnarchoCapitalismDescription')}
        </p>

      </div>
      <BookList />

      <img class="w-full md:w-1/2 h-auto mx-auto" src="An_Austrian_School_crest_-_Grey1.png" alt="An Austrian School crest" />
      <!-- Our Goal Column -->
      <div class="md:max-w-2xl m-auto mb-6">
        <h2 class="text-xl font-bold mb-1 text-primary text-start">{t('ourGoal')}</h2>
        <p class="text-base text-foreground leading-relaxed text-start">
          {t('ourGoalDescription')}
        </p>
      </div>
    </div>

    
  </div>
</section>



<!-- CTA Section - We Need You (only for non-logged in users) -->
{#if !data.user}
  <section class="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
        {t('cta.weNeedYou')}
      </h2>
      <p class="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
        {t('cta.joinUs')}
      </p>
      <Button size="xs" class="cursor-none" href={l("/register")} >
        {t('cta.registerNow')}
      </Button>
    </div>
    <Pointer>
    <motion.div
				animate={{
					scale: [0.8, 1, 0.8],
					rotate: [0, 5, -5, 0],
				}}
				transition={{
					duration: 1.5,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			>
							<div class="text-2xl">✊</div>

			</motion.div>
		</Pointer>
  </section>
{/if}
<!-- Popular Articles Section -->
{#if data.popularArticles && data.popularArticles.length > 0}
  <section class="w-full py-12 px-4 sm:px-6 lg:px-8 ">
    <div class="max-w-7xl mx-auto">
      <ArticleRecommendation
        articles={data.popularArticles}
        title={t('articles.popularArticles') || 'Popüler Makaleler'}
      />
    </div>
  </section>
{/if}

<!-- RSS Feed Section -->
<section class="w-full my-8 py-8 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border/50">
  <div class="max-w-4xl mx-auto text-center">
    <div class="flex items-center justify-center gap-2 mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
        <path d="M4 11a9 9 0 0 1 9 9"/>
        <path d="M4 4a16 16 0 0 1 16 16"/>
        <circle cx="5" cy="19" r="1"/>
      </svg>
      <h3 class="text-lg font-semibold text-foreground">{t('articles.rssFeed.title') || 'RSS Feed'}</h3>
    </div>
    <p class="text-sm text-muted-foreground mb-4">
      {t('articles.rssFeed.description', { url: `/rss/articles.xml` })}
    </p>
    <div class="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="sm" onclick={() => copyRssUrl('/rss/articles.xml')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
          <path d="M4 11a9 9 0 0 1 9 9"/>
          <path d="M4 4a16 16 0 0 1 16 16"/>
          <circle cx="5" cy="19" r="1"/>
        </svg>
        {t('seo.articles.rssFeed.articlesButton') || 'Makaleler RSS'}
      </Button>
      <Button variant="outline" size="sm" onclick={() => copyRssUrl('/rss/all.xml')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
          <path d="M4 11a9 9 0 0 1 9 9"/>
          <path d="M4 4a16 16 0 0 1 16 16"/>
          <circle cx="5" cy="19" r="1"/>
        </svg>
        {t('seo.articles.rssFeed.allContentButton') || 'Tüm İçerik RSS'}
      </Button>
    </div>
  </div>
</section>

<!-- Contact Section - Modern Form Design -->
<div class="px-4 sm:px-6 lg:px-8">
  <div class="text-center mb-10">
              <ContactRoundIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />

    <h2 class="text-3xl font-bold mb-4 text-foreground">{t('contactForm.title')}</h2>
    <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
      {t('contactForm.subtitle')}
    </p>
  </div>

  <ContactForm />
</div>


<DonationsSection />


</main>
<Footer />
