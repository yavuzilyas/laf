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
  import DonationsSection from '$lib/components/donations-section.svelte';
  import ArticleRecommendation from '$lib/components/ArticleRecommendation.svelte';
  import DitheredImageSlider from '$lib/components/magic/dithered-image-slider.svelte';
  import logo from '$lib/assets/laf1.svg';
  import ContactForm from '$lib/components/ContactForm.svelte';
  import { Button } from "$lib/components/ui/button";

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let { data } = $props();

  const sliderImages = Object.keys(import.meta.glob('/static/government-is-violence/*.{jpg,jpeg,png,webp,avif}')).map(path => path.replace(/^\/static/, ''));

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
<main class="w-full h-full flex flex-col gap-12 overflow-x-hidden">
  <div class="h-[95vh] sm:h-[99vh] w-full mt-7.5 sm:mt-5 mb-12 flex flex-col items-center justify-center antialiased bg-grid-white/[0.02] relative overflow-hidden"
>
      <DitheredImageSlider  images={sliderImages} />    

      <MorphingText class="absolute sm:top-1/2 top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2" texts={[t('firstPart'), t('secondPart')]} />    
    
  

</div>

<section class="w-full py-12 px-4 sm:px-6 lg:px-8 bg-background flex flex-col items-center justify-center relative">
<img class="h-16 w-auto mb-5 text-primary" src="{logo}" alt="LAF" />
<h1 class=" text-3xl font-bold mb-24">{t('lafFull')}</h1>
  <div class="max-w-7xl mx-auto">
    <!-- Three Column Layout -->
    <div class="grid md:grid-cols-3 gap-12 items-start">
      
      <!-- Who We Are Column -->
      <div class="text-center">
        <h1 class="text-xl  font-bold mb-6 text-primary">{t('whoWeAre')}</h1>
        <p class="text-base text-foreground leading-relaxed">
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
      <Button variant="outline" size="sm" class="gap-2" href="https://t.me/lafturkiye" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        {t('donations.joinTelegram')}
      </Button>
    </div>
    {/if}
      </div>


      <!-- Why Anarcho Capitalism Column -->
      <div class="text-center">
        <h1 class="text-xl font-bold mb-6 text-primary">{t('whyAnarchoCapitalism')}</h1>
        <p class="text-base text-foreground leading-relaxed">
          {t('whyAnarchoCapitalismDescription')}
        </p>

      </div>

      <!-- Our Goal Column -->
      <div class="text-center">
        <h1 class="text-xl  font-bold mb-6 text-primary">{t('ourGoal')}</h1>
        <p class="text-base text-foreground leading-relaxed">
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
      <p class="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        {t('cta.joinUs')}
      </p>
      <Button class="cursor-none" href="/register" >
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
<!-- Contact Section - Modern Form Design -->
<div class="px-4 sm:px-6 lg:px-8">
  <div class="text-center mb-10">
              <ContactRoundIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />

    <h1 class="text-3xl font-bold mb-4 text-foreground">{t('contactForm.title')}</h1>
    <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
      {t('contactForm.subtitle')}
    </p>
  </div>

  <ContactForm />
</div>
<DonationsSection />


</main>
<Footer />
