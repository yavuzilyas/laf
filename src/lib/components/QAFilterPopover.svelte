<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
  import { Separator } from "$lib/components/ui/separator";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import DateRangePicker from "$lib/components/DateRangePicker.svelte";
  import { t } from '$lib/stores/i18n.svelte';
  import { Filter, Calendar, HelpCircle, SlidersHorizontal, CheckCircle, Clock, XCircle, Users } from "@lucide/svelte";
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
    nickname?: string;
    onlyFollowing?: boolean;
  }

  let {
    options,
    activeFilters = {},
    onFiltersChange,
    enableStatusFilter = false,
    enableFollowingFilter = false,
    class: className,
    ...restProps
  }: {
    options: FilterOptions;
    activeFilters?: ActiveFilters;
    onFiltersChange?: (filters: ActiveFilters) => void;
    enableStatusFilter?: boolean;
    enableFollowingFilter?: boolean;
    class?: string;
  } = $props();

  const defaultFilters: ActiveFilters = {
    topic: "",
    sortBy: "newest",
    customDateRange: undefined,
    status: "",
    nickname: "",
    onlyFollowing: false
  };

  let filters = $state<ActiveFilters>({
    ...defaultFilters,
    ...activeFilters
  });
  
  // Propagate changes when any filter is updated via binding
  $effect(() => {
    onFiltersChange?.(filters);
  });
  
  let open = $state(false);

  const clearAllFilters = () => {
    filters = { ...defaultFilters };
  };

  const hasActiveFilters = $derived(
    filters.topic || 
    filters.sortBy !== 'newest' ||
    (filters.customDateRange && (filters.customDateRange.start || filters.customDateRange.end)) ||
    filters.status ||
    filters.nickname ||
    filters.onlyFollowing
  );

  const getActiveFilterCount = $derived(() => {
    let count = 0;
    if (filters.topic) count++;
    if (filters.sortBy && filters.sortBy !== 'newest') count++;
    if (filters.customDateRange && (filters.customDateRange.start || filters.customDateRange.end)) count++;
    if (filters.status) count++;
    if (filters.nickname) count++;
    if (filters.onlyFollowing) count++;
    return count;
  });

  // Handle filter changes
  const handleTopicChange = (value: string) => {
    filters = { ...filters, topic: value };
  };

  const handleStatusChange = (value: string) => {
    filters = { ...filters, status: value };
  };
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

        <!-- Nickname Filter -->
        <div class="space-y-2">
          <label class="text-xs font-medium flex items-center gap-2">
            <Users class="h-3 w-3" />
            {t('qa.filters.nickname') ?? 'Soran Kullanıcı Adı'}
          </label>
          <input
            type="text"
            placeholder={t('qa.filters.nicknamePlaceholder') ?? 'Kullanıcı adı ara...'}
            bind:value={filters.nickname}
            class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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

        <!-- Following Filter -->
        {#if enableFollowingFilter}
          <Separator />
          <div class="flex items-center justify-between rounded-md border px-3 py-2">
            <div class="flex flex-col text-xs font-medium">
              <span class="flex items-center gap-1">
                <Users class="h-3.5 w-3.5" />
                {t('qa.filters.following') ?? 'Takip ettiklerim'}
              </span>
              <span class="text-[11px] text-muted-foreground">
                {t('qa.filters.followingHint') ?? 'Sadece takip ettiğin kullanıcıların sorularını göster'}
              </span>
            </div>
            <Switch
              aria-label={t('qa.filters.following') ?? 'Takip ettiklerim'}
              bind:checked={filters.onlyFollowing}
            />
          </div>
        {/if}
      </div>
    </ScrollArea>
  </PopoverContent>
</Popover>
