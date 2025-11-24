<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
  import { Separator } from "$lib/components/ui/separator";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import DateRangePicker from "$lib/components/DateRangePicker.svelte";
  import { t } from '$lib/stores/i18n.svelte.ts';
  import { Filter, Calendar, Globe, BookOpen, Users } from "@lucide/svelte";
  import { CategoryTree } from '$lib/components/ui/category-tree';
  import { categoryTree } from '$lib/data/categories';

  interface FilterOptions {
    languages: { label: string; value: string }[];
    categories: string[];
    dateRanges: { label: string; value: string }[];
  }

  interface ActiveFilters {
    language?: string;
    category?: string;
    dateRange?: string;
    customDateRange?: any; // For DateRangePicker value
    nickname?: string;
    onlyFollowing?: boolean;
  }

  let {
    options,
    activeFilters = {},
    onFiltersChange,
    enableFollowingFilter = false,
    class: className,
    ...restProps
  }: {
    options: FilterOptions;
    activeFilters?: ActiveFilters;
    onFiltersChange?: (filters: ActiveFilters) => void;
    enableFollowingFilter?: boolean;
    class?: string;
  } = $props();

  const defaultFilters: ActiveFilters = {
    language: "",
    category: "",
    dateRange: "",
    customDateRange: undefined,
    nickname: "",
    onlyFollowing: false
  };

  // Default empty filters
  let filters = $state<ActiveFilters>({
    ...defaultFilters,
    ...activeFilters
  });
  
  // Track selected category for the tree
  let selectedCategory = $state('');
  let open = $state(false);

  const clearAllFilters = () => {
    filters = { ...defaultFilters };
    selectedCategory = '';
  };
  
  const handleCategorySelect = (category: string) => {
    selectedCategory = category;
    filters = { ...filters, category };
  };

  const hasActiveFilters = $derived(
    filters.language || 
    filters.category || 
    filters.dateRange ||
    filters.customDateRange ||
    filters.nickname
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
      "relative h-9 w-9 p-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-bold outline-none transition-all hover:scale-101 active:scale-97 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 border shadow-xs hover:bg-accent hover:text-accent-foreground",
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
  
  <PopoverContent class="w-80 p-0" align="start">
    <ScrollArea class="h-96 p-4">
      <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-xs flex items-center gap-2">
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



      <!-- Category Filter -->
      <div class="space-y-2 overflow-hidden">
        <div class="flex items-center gap-2 text-xs font-medium">
          <BookOpen class="h-4 w-4" />
          {t('articles.filters.category')}
        </div>

          <CategoryTree 
            categories={categoryTree} 
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />


      </div>

      <!-- Nickname Filter -->
      <div class="space-y-2">
        <label class="text-xs font-medium flex items-center gap-2">
          <Users class="h-3 w-3" />
          {t('articles.filters.nickname') ?? 'Yazar Kullanıcı Adı'}
        </label>
        <input
          type="text"
          placeholder={t('articles.filters.nicknamePlaceholder') ?? 'Kullanıcı adı ara...'}
          bind:value={filters.nickname}
          class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {#if enableFollowingFilter}
        <Separator />
        <div class="flex items-center justify-between rounded-md border px-3 py-2">
          <div class="flex flex-col text-xs font-medium">
            <span class="flex items-center gap-1">
              <Users class="h-3.5 w-3.5" />
              {t('articles.filters.following') ?? 'Takip ettiklerim'}
            </span>
            <span class="text-[11px] text-muted-foreground">
              {t('articles.filters.followingHint') ?? 'Sadece takip ettiğin yazarları göster'}
            </span>
          </div>
          <Switch
            aria-label={t('articles.filters.following') ?? 'Takip ettiklerim'}
            bind:checked={filters.onlyFollowing}
          />
        </div>
      {/if}
      </div>
    </ScrollArea>
  </PopoverContent>
</Popover>
