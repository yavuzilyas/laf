<script lang="ts">
  import { t } from '$lib/stores/i18n.svelte.js';
  import * as Select from "$lib/components/ui/select/index.js";

  const localeNames: Record<string, string> = {
    // de: 'Deutsch',
    en: 'English',
    // es: 'Español',
    // fr: 'Français',
    tr: 'Türkçe'
  };

  // t store'dan reaktif olarak currentLocale'i al
  const currentLocale = $derived(t.currentLocale);
  
  const triggerContent = $derived(
    localeNames[currentLocale] || "Diller"
  );
</script>
  <Select.Root 
    type="single" 
    name="language" 
    value={currentLocale}
    onValueChange={(val: string) => t.setLocale(val)}
    disabled={t.loading}
  >
    <Select.Trigger size="sm" class="text-secondary-foreground  !bg-background/44 w-full md:w-32 text-xs font-bold">
      {triggerContent}
    </Select.Trigger>
    <Select.Content class="!bg-background/44 -bottom-2 !backdrop-blur-sm text-xs font-bold">
      <Select.Group >
        <Select.Label class=" text-secondary-foreground  text-xs">{t('Languages')}</Select.Label>
        {#each t.availableLocales as locale}
          <Select.Item class="text-secondary-foreground mt-1 !bg-background/44 text-xs" value={locale}>
            {localeNames[locale] || locale}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
