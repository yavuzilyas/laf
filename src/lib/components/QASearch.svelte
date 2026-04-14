<script lang="ts">
  import { cn } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';

  const currentLocale = $derived(getCurrentLocale() || 'tr');
  const l = (path: string) => `/${currentLocale}${path}`;
  import { Search, X, Clock, TrendingUp, HelpCircle, MessageCircle } from "@lucide/svelte";
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { BarSpinner } from "$lib/components/spell/bar-spinner";

  interface QuestionSuggestion {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    authorName?: string;
    topicName?: string;
  }

  interface SearchSuggestion {
    type: 'recent' | 'popular';
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
  let popoverRef: HTMLDivElement | undefined;
  let questionSuggestions = $state<QuestionSuggestion[]>([]);
  let isLoading = $state(false);
  
  let isMounted = $state(false);
  let isVisible = $state(false);

  let selectedIndex = $state(-1);
  let selectableItems = $state<HTMLElement[]>([]);

  let searchTimeout: number | null = null;
  
  $effect(() => {
    if (showDropdown) {
      isMounted = true;
      setTimeout(() => {
        isVisible = true;
        selectedIndex = -1;
        updateSelectableItems();
      }, 10);
    } else {
      isVisible = false;
      selectedIndex = -1;
      if (isMounted) {
        const timer = setTimeout(() => {
          isMounted = false;
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  });

  let currentLanguage = getCurrentLocale?.() || 'tr';
  $effect(() => {
    currentLanguage = getCurrentLocale?.() || currentLanguage || 'tr';
  });

  $effect(() => {
    if (!searchQuery?.trim()) {
      questionSuggestions = [];
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      questionSuggestions = [];
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = window.setTimeout(async () => {
      isLoading = true;
      
      try {
        const response = await fetch(`/api/qa?search=${encodeURIComponent(query)}&limit=5`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data?.questions?.length) {
          questionSuggestions = data.questions
            .map((question: any) => {
              if (!question.title) return null;
              
              return {
                id: question.id,
                title: question.title,
                slug: question.slug,
                excerpt: question.content?.text?.substring(0, 100) || '',
                authorName: question.authorName,
                topicName: question.topic?.name
              };
            })
            .filter(Boolean);
        } else {
          questionSuggestions = [];
        }
      } catch (error) {
        questionSuggestions = [];
      } finally {
        isLoading = false;
      }
      
      if (showDropdown) {
        isVisible = false;
        setTimeout(() => isVisible = true, 10);
      }
    }, 200);
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  });
  
  $effect(() => {
    if (isVisible && popoverRef) {
      setTimeout(() => {
        updateSelectableItems();
      }, 50);
    }
  });

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      onSearch?.(searchTerm.trim());
    }
  };

  const handleClear = () => {
    searchQuery = "";
    onClear?.();
    if (inputRef && typeof inputRef.focus === 'function') {
      inputRef.focus();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    searchQuery = suggestion.value;
    handleSearch(suggestion.value);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const items = selectableItems;
    
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click();
      } else {
        handleSearch();
      }
    } else if (event.key === 'Escape') {
      showDropdown = false;
      selectedIndex = -1;
      if (inputRef && typeof inputRef.blur === 'function') {
        inputRef.blur();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showDropdown) {
        showDropdown = true;
      }
      if (items.length > 0) {
        selectedIndex = (selectedIndex + 1) % items.length;
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showDropdown) {
        showDropdown = true;
      }
      if (items.length > 0) {
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Tab') {
      if (showDropdown && items.length > 0) {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const isSelected = (index: number) => selectedIndex === index;
  
  let currentItemIndex = $state(-1);

  const updateSelectableItems = () => {
    if (popoverRef) {
      const links = popoverRef.querySelectorAll('a[href], button:not([disabled])');
      selectableItems = Array.from(links) as HTMLElement[];
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return Clock;
      case 'popular':
        return TrendingUp;
      default:
        return Search;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return t('articles.search.recent') || 'Son Aramalar';
      case 'popular':
        return t('articles.search.popular') || 'Popüler';
      default:
        return '';
    }
  };

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

  const filteredSuggestions = $derived(() => {
    if (!searchQuery.trim()) {
      return suggestions;
    }
    const query = searchQuery.toLowerCase();
    return suggestions.filter(suggestion => 
      suggestion.value.toLowerCase().includes(query)
    );
  });

  const groupedSuggestions = $derived(() => {
    const groups: Record<SearchSuggestion['type'], SearchSuggestion[]> = {
      recent: [],
      popular: []
    };
    filteredSuggestions.forEach(suggestion => {
      groups[suggestion.type].push(suggestion);
    });
    return groups;
  });

  const hasSuggestions = $derived(
    (filteredSuggestions && filteredSuggestions.length > 0) || 
    (filteredRecentSearches && filteredRecentSearches.length > 0) ||
    (questionSuggestions && questionSuggestions.length > 0)
  );
</script>

<div class={cn("relative w-full", className)} {...restProps}>
  <!-- Search Input -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    <Input
      bind:this={inputRef}
      bind:value={searchQuery}
      placeholder={placeholder || t('qa.searchPlaceholder') || 'Soru ara...'}
      class="pl-10 pr-10 text-xs cursor-text"
      onfocus={() => {
        if (showSuggestions) {
          showDropdown = true;
        }
      }}
      onkeydown={(e) => handleKeydown(e)}
      onblur={() => {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (!popoverRef?.contains(activeElement) && activeElement !== inputRef) {
            showDropdown = false;
          }
        }, 200);
      }}
    />
    {#if searchQuery}
      <Button
        variant="ghost"
        size="sm"
        onclick={(e) => {
          e.preventDefault();
          handleClear();
        }}
        class="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
      >
        <X class="h-4 w-4" />
      </Button>
    {/if}
  </div>

  {#if isMounted}
    <div 
      bind:this={popoverRef}
      class="search-popover absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md transition-all duration-200 ease-out {isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}"
      on:mousedown|preventDefault
      on:click|preventDefault
      style="pointer-events: {isVisible ? 'auto' : 'none'}"
    >
      {#if showSuggestions}
        <div class="p-2">
          <!-- Question Suggestions -->
          {#if questionSuggestions.length > 0}
            <div class="mb-4">
              <h3 class="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageCircle class="h-3.5 w-3.5" />
                {t('qa.search.questionSuggestions') || 'Soru Önerileri'}
              </h3>
              <div class="mt-1 space-y-1">
                {#each questionSuggestions as question, questionIdx (question.id)}
                  {#if question.slug}
                    <a 
                      href={`/qa/${question.slug}`}
                      data-sveltekit-preload-data={question.slug ? 'hover' : false}
                      class="flex flex-col gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors {isSelected(questionIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
                    >
                      <span class="font-medium">{question.title}</span>
                      {#if question.topicName}
                        <span class="text-[11px] text-muted-foreground">
                          {question.topicName}
                        </span>
                      {/if}
                      {#if question.excerpt}
                        <span class="text-xs text-muted-foreground line-clamp-1">
                          {question.excerpt}
                        </span>
                      {/if}
                    </a>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

          <!-- Recent Searches -->
          {#if filteredRecentSearches.length > 0}
            <div class="mb-3">
              <div class="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                <Clock class="h-3 w-3" />
                {t('articles.search.recentSearches') || 'Son Aramalar'}
              </div>
              <div class="space-y-1">
                {#each filteredRecentSearches.slice(0, 5) as recent, recentIdx}
                  {@const globalIdx = questionSuggestions.length + recentIdx}
                  <button
                    class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground {isSelected(globalIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
                    on:mousedown|preventDefault
                    on:click|preventDefault={() => handleSuggestionClick({ type: 'recent', value: recent })}
                  >
                    <Clock class="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span class="truncate">{recent}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Filtered Suggestions -->
          {#if filteredSuggestions.length > 0}
            {@const suggestionsStartIndex = questionSuggestions.length + filteredRecentSearches.length}
            {#each Object.entries(groupedSuggestions) as [type, items], groupIdx}
              {#if items.length > 0}
                {@const groupStartIndex = suggestionsStartIndex + Object.values(groupedSuggestions).slice(0, groupIdx).flat().length}
                <div class="mb-3">
                  <div class="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <svelte:component this={getSuggestionIcon(type as SearchSuggestion['type'])} class="h-3 w-3" />
                    {getSuggestionLabel(type as SearchSuggestion['type'])}
                  </div>
                  <div class="space-y-1">
                    {#each items.slice(0, 5) as suggestion, idx}
                      {@const globalIdx = groupStartIndex + idx}
                      <button
                        class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground {isSelected(globalIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
                        on:mousedown|preventDefault
                        on:click|preventDefault={() => handleSuggestionClick(suggestion)}
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          <svelte:component this={getSuggestionIcon(suggestion.type)} class="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                          <span class="truncate">{suggestion.value}</span>
                        </div>
                        {#if suggestion.count}
                          <span class="ml-2 flex-shrink-0 text-[10px] text-muted-foreground">
                            {suggestion.count}
                          </span>
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

      <!-- Loading State -->
      {#if isLoading && questionSuggestions.length === 0}
        <BarSpinner class="m-auto text-primary" />
      {/if}

      <!-- No Results -->
      {#if searchQuery && filteredSuggestions.length === 0 && filteredRecentSearches.length === 0 && questionSuggestions.length === 0}
        <div class="p-3 text-center text-xs text-muted-foreground">
          {t('qa.search.noSuggestions') || 'Sonuç bulunamadı'}
        </div>
      {/if}
      {#if !searchQuery}
        <div class="p-3 text-center text-xs text-muted-foreground">
          {t('qa.search.typeForSearch') || 'Aramak için yazmaya başlayın'}
        </div>
      {/if}
      
      <!-- Search Action -->
      {#if searchQuery}
        {@const searchButtonIdx = questionSuggestions.length + filteredRecentSearches.length + filteredSuggestions.length}
        <div class="border-t p-2">
          <button
            class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground {isSelected(searchButtonIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
            on:click={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Search class="h-3 w-3 flex-shrink-0" />
            <span class="truncate">{t('articles.search.searchFor') || 'Ara'} "{searchQuery}"</span>
          </button>
        </div>
      {/if}

      <!-- Search Results Summary -->
      {#if value && value !== searchQuery}
        <div class="border-t p-2">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Search class="h-3 w-3 flex-shrink-0" />
            <span class="truncate">{t('articles.search.searchingFor') || 'Aranıyor'}:</span>
            <span class="flex-shrink-0 px-2 py-0.5 bg-secondary rounded text-secondary-foreground">{value}</span>
            <Button
              variant="ghost"
              size="sm"
              onclick={(e) => {
                e.preventDefault();
                handleClear();
              }}
              class="ml-auto h-6 px-2 text-xs"
            >
              <X class="h-3 w-3 mr-1" />
              {t('articles.search.clear') || 'Temizle'}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
