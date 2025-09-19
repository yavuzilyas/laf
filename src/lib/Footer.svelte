<script lang="ts">
        import * as Tooltip from "$lib/components/ui/tooltip/index.js";
      import logo from "$lib/assets/laf1.svg";
    import { Button } from "$lib/components/ui/button";
          import { i18n, dativeSuffix, locativeSuffix } from '$lib/stores/i18n.svelte.js';
</script>

<footer class="w-full text-secondary-foreground border-t-1 p-6">
  <div class="max-w-7xl mx-auto py-1 sm:py-0 px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col-reverse gap-6.5 md:gap-0 md:flex-row  items-center justify-around">
          <div class="text-xs flex flex-row justify-center items-center gap-3 ">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>   
                <a href="/" ><img class="max-h-7.5 sm:max-h-7 fill-primary" src="{logo}" alt="LAF" /></a>
              </Tooltip.Trigger>
            <Tooltip.Content>
              <p>{i18n.t('GoToHomePage')}</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <div class="border-l-1 pl-3 border-white/75">
          <h1 class="font-bold">{i18n.t('E-mail')}:</h1>
          <a href="mailto:contact@laf.de" class="hover:underline underline-offset-3">contact@laf.de</a>
          </div>
        </div>
          <p class="font-bold text-sm text-end italic text-primary">{i18n.t('FooterQuote-1')}<br>{i18n.t('FooterQuote-2')}</p>
        </div>
  </div>
</footer>