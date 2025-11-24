<script lang="ts">
  import { cn } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { t } from '$lib/stores/i18n.svelte';
  import { Search, X, Clock, TrendingUp, Hash } from "@lucide/svelte";

  interface SearchSuggestion {
    type: 'recent' | 'popular' | 'tag' | 'category';
    value: string;
    count?: number;
  }

  let {
    value = "",
    placeholder,
    suggestions = [],
    recentSearches = [],
    showSuggestions = true,
    onSearch,
    onClear,
    class: className,
    ...restProps
  }: {
    value?: string;
    placeholder?: string;
    suggestions?: SearchSuggestion[];
    recentSearches?: string[];
    showSuggestions?: boolean;
    onSearch?: (query: string) => void;
    onClear?: () => void;
    class?: string;
  } = $props();

  let searchQuery = $state(value);
  let showDropdown = $state(false);
  let inputRef: HTMLInputElement | undefined;

  // Reactive search - her tuş vuruşunda otomatik arama (devre dışı)
  // $effect(() => {
  //   if (searchQuery !== undefined) {
  //     onSearch?.(searchQuery.trim());
  //   }
  // });

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      onSearch?.(searchTerm.trim());
      showDropdown = false;
    }
  };

  const handleClear = () => {
    searchQuery = "";
    onClear?.();
    // Focus input if it exists and has focus method
    if (inputRef && typeof inputRef.focus === 'function') {
      inputRef.focus();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    searchQuery = suggestion.value;
    handleSearch(suggestion.value);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    } else if (event.key === 'Escape') {
      showDropdown = false;
      // Blur input if it exists and has blur method
      if (inputRef && typeof inputRef.blur === 'function') {
        inputRef.blur();
      }
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return Clock;
      case 'popular':
        return TrendingUp;
      case 'tag':
        return Hash;
      case 'category':
        return Hash;
      default:
        return Search;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return t('articles.search.recent');
      case 'popular':
        return t('articles.search.popular');
      case 'tag':
        return t('articles.search.tag');
      case 'category':
        return t('articles.search.category');
      default:
        return '';
    }
  };

  // Group suggestions by type
  const groupedSuggestions = $derived(() => {
    const groups: Record<SearchSuggestion['type'], SearchSuggestion[]> = {
      recent: [],
      popular: [],
      tag: [],
      category: []
    };
    filteredSuggestions.forEach(suggestion => {
      groups[suggestion.type].push(suggestion);
    });
    return groups;
  });

  // Filtered suggestions based on search query
  const filteredSuggestions = $derived(() => {
    if (!searchQuery.trim()) {
      return suggestions;
    }
    const query = searchQuery.toLowerCase();
    return suggestions.filter(suggestion => 
      suggestion.value.toLowerCase().includes(query)
    );
  });

  // Filtered recent searches based on search query
  const filteredRecentSearches = $derived(() => {
    const recentArray = Array.isArray(recentSearches) ? recentSearches : [];
    if (!searchQuery.trim()) {
      return recentArray;
    }
    const query = searchQuery.toLowerCase();
    return recentArray.filter(search => 
      search.toLowerCase().includes(query)
    );
  });
</script>

<div class={cn("relative w-full", className)} {...restProps}>
  <!-- Search Input -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      bind:this={inputRef}
      bind:value={searchQuery}
      placeholder={placeholder || t('articles.search.placeholder')}
      class="pl-10 pr-10 text-xs"
      onfocus={() => showSuggestions && (showDropdown = true)}
      onblur={() => setTimeout(() => showDropdown = false, 200)}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearch();
        } else if (e.key === 'Escape') {
          showDropdown = false;
          inputRef?.blur();
        }
      }}
    />
    {#if searchQuery}
      <Button
        variant="ghost"
        size="sm"
        onclick={handleClear}
        class="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
      >
        <X class="h-4 w-4" />
      </Button>
    {/if}

    <!-- Search Suggestions Dropdown -->
    {#if showDropdown && showSuggestions && (filteredSuggestions.length > 0 || filteredRecentSearches.length > 0)}
      <div class="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
        <!-- Recent Searches -->
        {#if filteredRecentSearches.length > 0}
          <div class="mb-3">
            <div class="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              <Clock class="h-3 w-3" />
              {t('articles.search.recentSearches')}
            </div>
            <div class="space-y-1">
              {#each filteredRecentSearches.slice(0, 5) as recent}
                <button
                  class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
                  onclick={() => handleSuggestionClick({ type: 'recent', value: recent })}
                >
                  <Clock class="h-3 w-3 text-muted-foreground" />
                  {recent}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Filtered Suggestions -->
        {#if filteredSuggestions.length > 0}
          {#each Object.entries(groupedSuggestions) as [type, items]}
            {#if items.length > 0}
              <div class="mb-3">
                <div class="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <svelte:component this={getSuggestionIcon(type)} class="h-3 w-3" />
                  {getSuggestionLabel(type)}
                </div>
                <div class="space-y-1">
                  {#each items.slice(0, 5) as suggestion}
                    <button
                      class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
                      onclick={() => handleSuggestionClick(suggestion)}
                    >
                      <div class="flex items-center gap-2">
                        <svelte:component this={getSuggestionIcon(suggestion.type)} class="h-3 w-3 text-muted-foreground" />
                        <span>{suggestion.value}</span>
                      </div>
                      {#if suggestion.count}
                        <Badge variant="secondary" class="text-xs">
                          {suggestion.count}
                        </Badge>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <!-- No Results -->
  {#if searchQuery && suggestions.length === 0}
    <div class="px-2 py-3 text-center text-xs text-muted-foreground">
      {t('articles.search.noSuggestions')}
    </div>
  {/if}

  <!-- Search Action -->
  {#if searchQuery}
    <div class="border-t pt-2 mt-2">
      <button
        class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
        onclick={() => handleSearch()}
      >
        <Search class="h-3 w-3" />
        {t('articles.search.searchFor')} "{searchQuery}"
      </button>
    </div>
  {/if}
</div>

<!-- Search Results Summary (if needed) -->
{#if value && value !== searchQuery}
  <div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
    <Search class="h-4 w-4" />
    {t('articles.search.searchingFor')}: 
    <Badge variant="secondary">{value}</Badge>
    <Button
      variant="ghost"
      size="sm"
      onclick={handleClear}
      class="h-6 px-2 text-xs"
    >
      <X class="h-3 w-3 mr-1" />
      {t('articles.search.clear')}
    </Button>
  </div>
{/if}
