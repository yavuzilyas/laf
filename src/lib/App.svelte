<script lang="ts">
  import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
  import { MorphingText } from '$lib/components/magic/morphing-text';
    import {ContactRoundIcon} from 'svelte-animate-icons';

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
  import DitheredImageSlider from '$lib/components/magic/dithered-image-slider.svelte';
  import logo from '$lib/assets/laf1.svg';
  import ContactForm from '$lib/components/ContactForm.svelte';

  const sliderImages = Object.keys(import.meta.glob('/static/government-is-violence/*.{jpg,jpeg,png,webp,avif}')).map(path => path.replace(/^\/static/, ''));

</script>

<Navbar />
<main class="w-full h-full">
  <div class="h-[95vh] sm:h-[99vh] w-full  mt-7.5 sm:mt-5  mb-12 flex flex-col items-center justify-center  antialiased bg-grid-white/[0.02] relative overflow-hidden"
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
        <h1 class="text-xl  font-bold mb-6 text-foreground">{t('whoWeAre')}</h1>
        <p class="text-base text-muted-foreground leading-relaxed">
          {t('whoWeAreDescription')}
        </p>
      </div>


      <!-- Why Anarcho Capitalism Column -->
      <div class="text-center">
        <h1 class="text-xl font-bold mb-6 text-foreground">{t('whyAnarchoCapitalism')}</h1>
        <p class="text-base text-muted-foreground leading-relaxed">
          {t('whyAnarchoCapitalismDescription')}
        </p>

      </div>

      <!-- Our Goal Column -->
      <div class="text-center">
        <h1 class="text-xl  font-bold mb-6 text-foreground">{t('ourGoal')}</h1>
        <p class="text-base text-muted-foreground leading-relaxed">
          {t('ourGoalDescription')}
        </p>
      </div>
    </div>

    
  </div>
</section>

<DonationsSection />

<!-- Contact Section - Modern Form Design -->
<div>
  <div class="text-center mb-10">
              <ContactRoundIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />

    <h1 class="text-3xl font-bold mb-4 text-foreground">{t('contactForm.title')}</h1>
    <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
      {t('contactForm.subtitle')}
    </p>
  </div>

  <ContactForm />
</div>
</main>
<Footer />
