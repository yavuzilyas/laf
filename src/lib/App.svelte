<script>
  import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";

  import Spotlight from "$lib/components/Spotlight.svelte";
import { cn } from "$lib/utils";
  import Timeline from "$lib/components/timeline/Timeline.svelte";
  import Content1 from "$lib/components/timeline/Content1.svelte";
  import Content2 from "$lib/components/timeline/Content2.svelte";
  import Content3 from "$lib/components/timeline/Content3.svelte";

  let timelineData = [
    {
      title: "Svelte 5",
      content: Content1,
    },
    {
      title: "Early 2023",
      content: Content2,
    },
    {
      title: "Changelog",
      content: Content3,
    },
  ];
  import { i18n, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';

</script>

<Navbar />
<main class="w-full h-full">
  <div class="md:h-[30rem] w-full  flex flex-col md:items-center md:justify-center  antialiased bg-grid-white/[0.02] relative overflow-hidden"
>
  <Spotlight class="-top-3 left-1 md:left-40 md:-top-8" fill="white" />
  <div class=" max-w-8xl mx-auto  relative z-10 w-full px-2 pt-12 md:p-4">
    <h1
      class="text-3xl md:text-7xl md:h-38 font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-hard-primary to-hard-primary/50 bg-opacity-50"
    >
      Liberteryen Anarşist<br />  Faaliyet.
    </h1>
    <p
      class="mt-2 md:mt-4 font-bold text-sm md:text-base text-secondary-foreground/66 max-w-lg text-center mx-auto"
    >
      {i18n.t('MainPageDescription')}
    </p>
  </div>
  

</div>

<Timeline {timelineData} />
</main>
<Footer />
