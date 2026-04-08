<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import logo from "$lib/assets/laf1.svg";
  import { Button } from "$lib/components/ui/button";
  import { t } from '$lib/stores/i18n.svelte.js';
  import LottieText from "$lib/components/LottieText.svelte";
</script>
<footer class="relative border-t sm:hidden w-full px-6 pt-6">
  <!-- Bottom gradient fade for mobile footer -->
            <h1 class="sm:hidden text-center font-semibold sm:text-sm text-primary ">{t('FooterQuote-1')} {t('FooterQuote-2')}</h1>
</footer>
<footer class="relative w-full text-secondary-foreground border-none sm:border-solid sm:border-t-1 sm:px-6">
  <!-- Bottom gradient fade -->
  <div class="sm:hidden absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex gap-3 md:gap-0 md:flex-row  items-center justify-around">
          <div class="text-xs flex flex-row justify-center items-center gap-4 ">

          
<div class="flex flex-row justify-center items-center">
    <img class="w-10 h-full"src={logo} alt="LAF">
<LottieText />
</div>              
          </div>

          <p class="hidden sm:block font-semibold sm:max-w-full text-[0.7rem] sm:text-sm text-hard-primary">{t('FooterQuote-1')}<br>{t('FooterQuote-2')}</p>
        </div>
  </div>
    <div class="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none"></div>

</footer>
