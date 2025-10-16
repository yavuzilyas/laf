<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Select from "$lib/components/ui/select";
  import { Separator } from "$lib/components/ui/separator";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import { Filter, X, Calendar, Tag, User, TrendingUp } from "@lucide/svelte";

  interface FilterOptions {
    categories: string[];
    tags: string[];
    authors: string[];
    dateRanges: { label: string; value: string }[];
    sortOptions: { label: string; value: string }[];
  }

  interface ActiveFilters {
    category?: string;
    tags: string[];
    author?: string;
    dateRange?: string;
    sortBy?: string;
  }

  let {
    options,
    activeFilters = { tags: [] },
    onFiltersChange,
    showClearAll = true,
    compact = false,
    class: className,
    ...restProps
  }: {
    options: FilterOptions;
    activeFilters?: ActiveFilters;
    onFiltersChange?: (filters: ActiveFilters) => void;
    showClearAll?: boolean;
    compact?: boolean;
    class?: string;
  } = $props();

  let filters = $state<ActiveFilters>({ ...activeFilters });

  const updateFilters = (newFilters: Partial<ActiveFilters>) => {
    filters = { ...filters, ...newFilters };
    onFiltersChange?.(filters);
  };

  const clearAllFilters = () => {
    filters = { tags: [] };
    onFiltersChange?.(filters);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove);
    updateFilters({ tags: newTags });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] });
    }
  };

  const hasActiveFilters = $derived(
    filters.category || 
    filters.tags.length > 0 || 
    filters.author || 
    filters.dateRange || 
    filters.sortBy
  );
</script>

<div class={cn("space-y-4", className)} {...restProps}>
  {#if !compact}
    <!-- Full Filter Panel -->
    <div class="rounded-lg border bg-card p-6">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="h-5 w-5 text-primary" />
        <h3 class="font-semibold">{t('articles.filters.title')}</h3>
        {#if hasActiveFilters && showClearAll}
          <Button
            variant="ghost"
            size="sm"
            onclick={clearAllFilters}
            class="ml-auto text-xs"
          >
            <X class="h-3 w-3 mr-1" />
            {t('articles.filters.clearAll')}
          </Button>
        {/if}
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Category Filter -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-2">
            <Tag class="h-4 w-4" />
            {t('articles.filters.category')}
          </label>
          <Select.Root
            value={filters.category}
            onValueChange={(value) => updateFilters({ category: value })}
          >
            <Select.Trigger>
              {filters.category || t('articles.filters.selectCategory')}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">{t('articles.filters.allCategories')}</Select.Item>
              {#each options.categories as category}
                <Select.Item value={category}>{category}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Author Filter -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-2">
            <User class="h-4 w-4" />
            {t('articles.filters.author')}
          </label>
          <Select.Root
            value={filters.author}
            onValueChange={(value) => updateFilters({ author: value })}
          >
            <Select.Trigger>
              {filters.author || t('articles.filters.selectAuthor')}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">{t('articles.filters.allAuthors')}</Select.Item>
              {#each options.authors as author}
                <Select.Item value={author}>{author}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Date Range Filter -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-2">
            <Calendar class="h-4 w-4" />
            {t('articles.filters.dateRange')}
          </label>
          <Select.Root
            value={filters.dateRange}
            onValueChange={(value) => updateFilters({ dateRange: value })}
          >
            <Select.Trigger>
              {filters.dateRange ? options.dateRanges.find(r => r.value === filters.dateRange)?.label : t('articles.filters.selectDate')}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">{t('articles.filters.allTime')}</Select.Item>
              {#each options.dateRanges as range}
                <Select.Item value={range.value}>{range.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Sort Filter -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-2">
            <TrendingUp class="h-4 w-4" />
            {t('articles.filters.sortBy')}
          </label>
          <Select.Root
            value={filters.sortBy}
            onValueChange={(value) => updateFilters({ sortBy: value })}
          >
            <Select.Trigger>
              {filters.sortBy ? options.sortOptions.find(o => o.value === filters.sortBy)?.label : t('articles.filters.selectSort')}
            </Select.Trigger>
            <Select.Content>
              {#each options.sortOptions as option}
                <Select.Item value={option.value}>{option.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <Separator class="my-4" />

      <!-- Tags Section -->
      <div class="space-y-3">
        <label class="text-sm font-medium">{t('articles.filters.tags')}</label>
        
        <!-- Selected Tags -->
        {#if filters.tags.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each filters.tags as tag}
              <Badge variant="default" class="gap-1">
                #{tag}
                <button
                  onclick={() => removeTag(tag)}
                  class="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                >
                  <X class="h-3 w-3" />
                </button>
              </Badge>
            {/each}
          </div>
        {/if}

        <!-- Available Tags -->
        <div class="flex flex-wrap gap-2">
          {#each options.tags.filter(tag => !filters.tags.includes(tag)) as tag}
            <Button
              variant="outline"
              size="sm"
              onclick={() => addTag(tag)}
              class="h-7 text-xs"
            >
              #{tag}
            </Button>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <!-- Compact Filter Bar -->
    <div class="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <div class="flex items-center gap-2 text-sm font-medium">
        <Filter class="h-4 w-4" />
        {t('articles.filters.title')}:
      </div>

      <!-- Quick Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <Select.Root
          value={filters.category}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <Select.Trigger class="h-8 w-auto min-w-32">
            {filters.category || t('articles.filters.category')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">{t('articles.filters.allCategories')}</Select.Item>
            {#each options.categories as category}
              <Select.Item value={category}>{category}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        <Select.Root
          value={filters.sortBy}
          onValueChange={(value) => updateFilters({ sortBy: value })}
        >
          <Select.Trigger class="h-8 w-auto min-w-32">
            {filters.sortBy ? options.sortOptions.find(o => o.value === filters.sortBy)?.label : t('articles.filters.sortBy')}
          </Select.Trigger>
          <Select.Content>
            {#each options.sortOptions as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        {#if hasActiveFilters && showClearAll}
          <Button
            variant="ghost"
            size="sm"
            onclick={clearAllFilters}
            class="h-8 text-xs"
          >
            <X class="h-3 w-3 mr-1" />
            {t('articles.filters.clear')}
          </Button>
        {/if}
      </div>
    </div>

    <!-- Active Filters Display -->
    {#if filters.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each filters.tags as tag}
          <Badge variant="secondary" class="gap-1">
            #{tag}
            <button
              onclick={() => removeTag(tag)}
              class="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
            >
              <X class="h-3 w-3" />
            </button>
          </Badge>
        {/each}
      </div>
    {/if}
  {/if}
</div>
