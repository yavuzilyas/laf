<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
  import * as Select from "$lib/components/ui/select";
  import { Separator } from "$lib/components/ui/separator";
  import DateRangePicker from "$lib/components/DateRangePicker.svelte";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import { Filter, Calendar, Globe, BookOpen, Tag } from "@lucide/svelte";

  interface FilterOptions {
    languages: { label: string; value: string }[];
    categories: string[];
    types: string[];
    dateRanges: { label: string; value: string }[];
  }

  interface ActiveFilters {
    language?: string;
    category?: string;
    type?: string;
    dateRange?: string;
    customDateRange?: any; // For DateRangePicker value
  }

  let {
    options,
    activeFilters = {},
    onFiltersChange,
    class: className,
    ...restProps
  }: {
    options: FilterOptions;
    activeFilters?: ActiveFilters;
    onFiltersChange?: (filters: ActiveFilters) => void;
    class?: string;
  } = $props();

  // Varsayılan olarak tüm filtreler boş (hepsi seçili)
  let filters = $state<ActiveFilters>({
    language: "",
    category: "",
    type: "",
    dateRange: "",
    customDateRange: undefined
  });
  let open = $state(false);

  const clearAllFilters = () => {
    filters = {
      language: "",
      category: "",
      type: "",
      dateRange: "",
      customDateRange: undefined
    };
  };

  const hasActiveFilters = $derived(
    filters.language || 
    filters.category || 
    filters.type || 
    filters.dateRange ||
    filters.customDateRange
  );

  const getActiveFilterCount = $derived(
    Object.values(filters).filter(Boolean).length
  );

  // Propagate changes when date range is updated via binding
  $effect(() => {
    onFiltersChange?.(filters);
  });
</script>

<Popover bind:open>
  <PopoverTrigger
    class={cn(
      "relative h-9 w-9 p-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold outline-none transition-all hover:scale-101 active:scale-97 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
      hasActiveFilters && "border-primary text-primary",
      className
    )}
    {...restProps}
  >
    <Filter class="h-4 w-4" />
    {#if getActiveFilterCount > 0}
      <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
        {getActiveFilterCount}
      </span>
    {/if}
  </PopoverTrigger>
  
  <PopoverContent class="w-80 p-4" align="start">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-sm flex items-center gap-2">
          <Filter class="h-4 w-4" />
          {t('articles.filters.title')}
        </h4>
        {#if hasActiveFilters}
          <Button
            variant="ghost"
            size="sm"
            onclick={clearAllFilters}
            class="h-6 px-2 text-xs"
          >
            {t('articles.filters.clearAll')}
          </Button>
        {/if}
      </div>

      <Separator />

      <!-- Date Range Filter -->
      <div class="space-y-2">
        <label class="text-xs font-medium flex items-center gap-2">
          <Calendar class="h-3 w-3" />
          {t('articles.filters.dateRange')}
        </label>
        <div class="space-y-2">
          <DateRangePicker 
            bind:value={filters.customDateRange}
          />
        </div>
      </div>

      <!-- Language Filter -->
      <div class="space-y-2">
        <label class="text-xs font-medium flex items-center gap-2">
          <Globe class="h-3 w-3" />
          {t('articles.filters.language')}
        </label>
        <Select.Root 
          selected={{ value: filters.language, label: filters.language ? options.languages.find(l => l.value === filters.language)?.label : t('articles.filters.allLanguages') }}
          onSelectedChange={(v) => { if (v) filters.language = v.value; }}
        >
          <Select.Trigger class="h-8 text-xs">
            {filters.language ? options.languages.find(l => l.value === filters.language)?.label : t('articles.filters.allLanguages')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">{t('articles.filters.allLanguages')}</Select.Item>
            {#each options.languages as language}
              <Select.Item value={language.value}>{language.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Category Filter -->
      <div class="space-y-2">
        <label class="text-xs font-medium flex items-center gap-2">
          <BookOpen class="h-3 w-3" />
          {t('articles.filters.category')}
        </label>
        <Select.Root 
          selected={{ value: filters.category, label: filters.category || t('articles.filters.allCategories') }}
          onSelectedChange={(v) => { if (v) filters.category = v.value; }}
        >
          <Select.Trigger class="h-8 text-xs">
            {filters.category || t('articles.filters.allCategories')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">{t('articles.filters.allCategories')}</Select.Item>
            {#each options.categories as category}
              <Select.Item value={category}>{category}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Type Filter -->
      <div class="space-y-2">
        <label class="text-xs font-medium flex items-center gap-2">
          <Tag class="h-3 w-3" />
          {t('articles.filters.type')}
        </label>
        <Select.Root 
          selected={{ value: filters.type, label: filters.type || t('articles.filters.allTypes') }}
          onSelectedChange={(v) => { if (v) filters.type = v.value; }}
        >
          <Select.Trigger class="h-8 text-xs">
            {filters.type || t('articles.filters.allTypes')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">{t('articles.filters.allTypes')}</Select.Item>
            {#each options.types as type}
              <Select.Item value={type}>{type}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </PopoverContent>
</Popover>
