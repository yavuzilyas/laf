<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
  import { Separator } from "$lib/components/ui/separator";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import DateRangePicker from "$lib/components/DateRangePicker.svelte";
  import { t } from '$lib/stores/i18n.svelte';
  import { Filter, Calendar, HelpCircle, TrendingUp, SlidersHorizontal, CheckCircle, Clock, XCircle } from "@lucide/svelte";
  import * as Select from "$lib/components/ui/select";

  interface FilterOptions {
    topics: { id: string; name: string; slug: string }[];
    sortOptions: { label: string; value: string }[];
    statuses?: { label: string; value: string }[];
  }

  interface ActiveFilters {
    topic?: string;
    sortBy?: string;
    customDateRange?: any;
    status?: string;
  }

  let {
    options,
    activeFilters = {},
    onFiltersChange,
    enableStatusFilter = false,
    class: className,
    ...restProps
  }: {
    options: FilterOptions;
    activeFilters?: ActiveFilters;
    onFiltersChange?: (filters: ActiveFilters) => void;
    enableStatusFilter?: boolean;
    class?: string;
  } = $props();

  const defaultFilters: ActiveFilters = {
    topic: "",
    sortBy: "newest",
    customDateRange: undefined,
    status: ""
  };

  let filters = $state<ActiveFilters>({
    ...defaultFilters,
    ...activeFilters
  });
  
  // Ensure customDateRange is never null (only undefined or valid object)
  $effect(() => {
    if (filters.customDateRange === null) {
      filters.customDateRange = undefined;
    }
  });
  
  let open = $state(false);

  const clearAllFilters = () => {
    filters = { ...defaultFilters };
    onFiltersChange?.(filters);
  };

  const hasActiveFilters = $derived(
    filters.topic || 
    filters.sortBy !== 'newest' ||
    (filters.customDateRange && (filters.customDateRange.start || filters.customDateRange.end)) ||
    filters.status
  );

  const getActiveFilterCount = $derived(() => {
    let count = 0;
    if (filters.topic) count++;
    if (filters.sortBy && filters.sortBy !== 'newest') count++;
    if (filters.customDateRange && (filters.customDateRange.start || filters.customDateRange.end)) count++;
    if (filters.status) count++;
    return count;
  });

  // Handle filter changes
  const handleTopicChange = (value: string) => {
    filters = { ...filters, topic: value };
    // Delay to ensure parent component's hydration is complete
    setTimeout(() => {
      onFiltersChange?.(filters);
    }, 10);
  };

  const handleSortChange = (value: string) => {
    filters = { ...filters, sortBy: value };
    // Delay to ensure parent component's hydration is complete
    setTimeout(() => {
      onFiltersChange?.(filters);
    }, 10);
  };

  const handleStatusChange = (value: string) => {
    filters = { ...filters, status: value };
    // Delay to ensure parent component's hydration is complete
    setTimeout(() => {
      onFiltersChange?.(filters);
    }, 10);
  };

  // Watch for date range changes from DateRangePicker
  // Only trigger onFiltersChange after component is mounted (not during initialization)
  let hasMounted = $state(false);
  let lastDateRangeStart = $state(filters.customDateRange?.start);
  let lastDateRangeEnd = $state(filters.customDateRange?.end);
  
  $effect(() => {
    // Mark as mounted after first render
    hasMounted = true;
  });
  
  $effect(() => {
    const currentStart = filters.customDateRange?.start;
    const currentEnd = filters.customDateRange?.end;
    // Only call onFiltersChange if:
    // 1. Component has mounted
    // 2. Date range actually changed (check start and end separately)
    if (hasMounted && (currentStart !== lastDateRangeStart || currentEnd !== lastDateRangeEnd)) {
      lastDateRangeStart = currentStart;
      lastDateRangeEnd = currentEnd;
      // Delay to ensure parent component's hydration is complete before calling onFiltersChange
      setTimeout(() => {
        onFiltersChange?.(filters);
      }, 10);
    }
  });
</script>

<Popover bind:open>
  <PopoverTrigger
    class={cn(
      "relative p-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-bold outline-none transition-all hover:scale-101 active:scale-97 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 border shadow-xs hover:bg-accent hover:text-accent-foreground",
      hasActiveFilters && "border-primary text-primary",
      className
    )}
    {...restProps}
  >
    <SlidersHorizontal size={16}/>
    {#if getActiveFilterCount() > 0}
      <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
        {getActiveFilterCount()}
      </span>
    {/if}
  </PopoverTrigger>
  
  <PopoverContent class="w-75 p-0" align="start">
    <ScrollArea class="h-96 p-4">
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-xs flex items-center gap-2">
            <Filter class="h-4 w-4" />
            {t('qa.filters.title') || 'Filtreler'}
          </h4>
          {#if hasActiveFilters}
            <Button
              variant="ghost"
              size="xs"
              onclick={clearAllFilters}
              class="h-6 px-2 text-xs"
            >
              {t('articles.filters.clearAll') || 'Temizle'}
            </Button>
          {/if}
        </div>

        <Separator />

        <!-- Date Range Filter -->
        <div class="space-y-2">
          <label class="text-xs font-medium flex items-center gap-2">
            <Calendar class="h-3 w-3" />
            {t('articles.filters.dateRange') || 'Tarih Aralığı'}
          </label>
          <div class="space-y-2">
            <DateRangePicker 
              bind:value={filters.customDateRange}
            />
          </div>
        </div>

        <Separator />

        <!-- Topic Filter -->
        <div class="space-y-2">
          <label class="text-xs font-medium flex items-center gap-2">
            <HelpCircle class="h-3 w-3" />
            {t('qa.filters.topic') || 'Konu'}
          </label>
          <Select.Root type="single" value={filters.topic} onValueChange={handleTopicChange}>
            <Select.Trigger class="w-full text-xs">
              {filters.topic ? options.topics.find((t: any) => t.slug === filters.topic)?.name : (t('qa.filters.allTopics') || 'Tüm Konular')}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">{t('qa.filters.allTopics') || 'Tüm Konular'}</Select.Item>
              {#each options.topics as topic (topic.id)}
                <Select.Item value={topic.slug}>{topic.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <Separator />

        <!-- Sort Order -->
        <div class="space-y-2">
          <label class="text-xs font-medium flex items-center gap-2">
            <TrendingUp class="h-3 w-3" />
            {t('qa.filters.sort') || 'Sıralama'}
          </label>
          <Select.Root type="single" value={filters.sortBy} onValueChange={handleSortChange}>
            <Select.Trigger class="w-full text-xs">
              {#if filters.sortBy === 'newest'}
                {t('qa.sort.newest') || 'En Yeni'}
              {:else if filters.sortBy === 'popular'}
                {t('qa.sort.popular') || 'Popüler'}
              {:else if filters.sortBy === 'unanswered'}
                {t('qa.sort.unanswered') || 'Cevapsız'}
              {:else}
                {t('qa.sort.newest') || 'En Yeni'}
              {/if}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="newest">{t('qa.sort.newest') || 'En Yeni'}</Select.Item>
              <Select.Item value="popular">{t('qa.sort.popular') || 'Popüler'}</Select.Item>
              <Select.Item value="unanswered">{t('qa.sort.unanswered') || 'Cevapsız'}</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <!-- Status Filter (Moderators only) -->
        {#if enableStatusFilter && options.statuses && options.statuses.length > 0}
          <Separator />
          <div class="space-y-2">
            <label class="text-xs font-medium flex items-center gap-2">
              <CheckCircle class="h-3 w-3" />
              {t('qa.filters.status') || 'Durum'}
            </label>
            <Select.Root type="single" value={filters.status} onValueChange={handleStatusChange}>
              <Select.Trigger class="w-full text-xs">
                {#if filters.status === 'pending'}
                  <span class="flex items-center gap-1"><Clock class="h-3 w-3" /> {t('qa.status.pending') || 'Bekliyor'}</span>
                {:else if filters.status === 'answered'}
                  <span class="flex items-center gap-1"><CheckCircle class="h-3 w-3" /> {t('qa.status.answered') || 'Cevaplandı'}</span>
                {:else if filters.status === 'published'}
                  <span class="flex items-center gap-1"><CheckCircle class="h-3 w-3" /> {t('qa.status.published') || 'Yayında'}</span>
                {:else if filters.status === 'rejected'}
                  <span class="flex items-center gap-1"><XCircle class="h-3 w-3" /> {t('qa.status.rejected') || 'Reddedildi'}</span>
                {:else}
                  {t('qa.filters.allStatuses') || 'Tümü'}
                {/if}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">{t('qa.filters.allStatuses') || 'Tümü'}</Select.Item>
                <Select.Item value="pending">{t('qa.status.pending') || 'Bekliyor'}</Select.Item>
                <Select.Item value="answered">{t('qa.status.answered') || 'Cevaplandı'}</Select.Item>
                <Select.Item value="published">{t('qa.status.published') || 'Yayında'}</Select.Item>
                <Select.Item value="rejected">{t('qa.status.rejected') || 'Reddedildi'}</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        {/if}
      </div>
    </ScrollArea>
  </PopoverContent>
</Popover>
