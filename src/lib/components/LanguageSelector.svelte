<script lang="ts">
  import { i18n } from '$lib/stores/i18n.svelte.js';
  import * as Select from "$lib/components/ui/select/index.js";

  const localeNames: Record<string, string> = {
    // de: 'Deutsch',
    en: 'English',
    // es: 'Español',
    // fr: 'Français',
    tr: 'Türkçe'
  };

  let currentLocale = $state(i18n.currentLocale);
  
  const triggerContent = $derived(
    localeNames[currentLocale] || "Diller"
  );
</script>
  <Select.Root 

    type="single" 
    name="language" 
    bind:value={currentLocale}
    onValueChange={(val: string) => i18n.setLocale(val)}
    disabled={i18n.loading}
  >
    <Select.Trigger class="w-28.5 text-xs">
      {triggerContent}
    </Select.Trigger>
    <Select.Content   class="max-w-28.5 text-xs">
      <Select.Group>
        <Select.Label class="text-xs">Diller</Select.Label>
        {#each i18n.availableLocales as locale}
          <Select.Item class="text-xs" value={locale}>
            {localeNames[locale] || locale}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
