<script lang="ts">
  import * as Select from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { countries, formatLocation, parseLocation, type Country } from "$lib/data/countries";
  import { i18n } from "$lib/stores/i18n.svelte.js";

  interface Props {
    value?: string; // Format: "City, Country"
    onChange?: (value: string) => void;
    disabled?: boolean;
    id?: string;
  }

  let { value = "", onChange, disabled = false, id = "location" }: Props = $props();

  // Parse the current value
  let parsed = $derived(parseLocation(value));

  // Get current selections
  let currentCountryCode = $derived(parsed.countryCode || "");
  let currentCity = $derived(parsed.city || "");

  // Get selected country object
  let selectedCountry = $derived(
    currentCountryCode ? countries.find(c => c.code === currentCountryCode) : null
  );

  // Get available cities for selected country
  let availableCities = $derived(
    selectedCountry ? selectedCountry.cities : []
  );

  // Handle country selection
  function onCountrySelect(code: string) {
    const country = countries.find(c => c.code === code);
    if (!country) return;

    // Select first city by default when country changes
    const firstCity = country.cities[0] || "";
    const locale = i18n.currentLocale === 'tr' ? 'tr' : 'en';
    const newValue = formatLocation(country.code, firstCity, locale);
    onChange?.(newValue);
  }

  // Handle city selection
  function onCitySelect(city: string) {
    if (!selectedCountry || !city) return;

    const locale = i18n.currentLocale === 'tr' ? 'tr' : 'en';
    const newValue = formatLocation(selectedCountry.code, city, locale);
    onChange?.(newValue);
  }
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <div>
    <Select.Root type="single" {disabled} value={currentCountryCode}>
      <Select.Trigger id="{id}-country" class="w-full">
        {#if selectedCountry}
          {i18n.currentLocale === 'tr' ? selectedCountry.nameTr : selectedCountry.name}
        {:else}
          {i18n.t('SelectCountry') || 'Ülke seçin...'}
        {/if}
      </Select.Trigger>
      <Select.Content class="max-h-72 overflow-y-auto">
        {#each countries as country (country.code)}
          <Select.Item
            value={country.code}
            label={i18n.currentLocale === 'tr' ? country.nameTr : country.name}
            onclick={() => onCountrySelect(country.code)}
          >
            {i18n.currentLocale === 'tr' ? country.nameTr : country.name}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div>
    <Select.Root type="single" disabled={disabled || !selectedCountry} value={currentCity}>
      <Select.Trigger id="{id}-city" class="w-full">
        {currentCity || (i18n.t('SelectCity') || 'Şehir seçin...')}
      </Select.Trigger>
      <Select.Content class="max-h-72 overflow-y-auto">
        {#if availableCities.length > 0}
          {#each availableCities as city (city)}
            <Select.Item
              value={city}
              onclick={() => onCitySelect(city)}
            >
              {city}
            </Select.Item>
          {/each}
        {:else}
          <Select.Item value="" disabled>
            {i18n.t('SelectCountryFirst') || 'Önce ülke seçin'}
          </Select.Item>
        {/if}
      </Select.Content>
    </Select.Root>
  </div>
</div>
