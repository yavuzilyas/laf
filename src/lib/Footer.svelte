<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import logo from "$lib/assets/laf1.svg";
  import { Button } from "$lib/components/ui/button";
  import { t } from '$lib/stores/i18n.svelte.js';
  import LottieText from "$lib/components/LottieText.svelte";
</script>

<footer class="w-full text-secondary-foreground border-t-1 px-6">
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
</footer>
<footer class="sm:hidden w-full bg-muted/44 p-6 pb-16">
            <p class="sm:hidden text-center font-semibold text-sm sm:text-sm text-hard-primary">{t('FooterQuote-1')}<br>{t('FooterQuote-2')}</p>
</footer>