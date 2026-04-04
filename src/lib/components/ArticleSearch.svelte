<script lang="ts">
  import { cn } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';
  import { Search, X, Clock, TrendingUp, Hash, BookOpen } from "@lucide/svelte";
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
	import { BarSpinner } from "$lib/components/spell/bar-spinner";

  interface ArticleSuggestion {
    id: string;
    _id?: string;
    title: string;
    slug: string;
    excerpt?: string;
    translations?: {
      [key: string]: {
        title: string;
        slug: string;
        excerpt?: string;
      };
    };
    language?: string;
  }

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
  let popoverRef: HTMLDivElement | undefined;
  let articleSuggestions = $state<ArticleSuggestion[]>([]);
  let isLoading = $state(false);
  
  // Track if the popover is mounted for animation
  let isMounted = $state(false);
  let isVisible = $state(false);

  // Keyboard navigation state
  let selectedIndex = $state(-1);
  let selectableItems = $state<HTMLElement[]>([]);

  // Debounce search
  let searchTimeout: number | null = null;
  
  // Handle popover animation states
  $effect(() => {
    if (showDropdown) {
      isMounted = true;
      // Small delay to allow for the element to be added to the DOM
      setTimeout(() => {
        isVisible = true;
        // Reset selection and update items after dropdown is visible
        selectedIndex = -1;
        updateSelectableItems();
      }, 10);
    } else {
      isVisible = false;
      selectedIndex = -1;
      // Wait for the exit animation to complete before unmounting
      if (isMounted) {
        const timer = setTimeout(() => {
          isMounted = false;
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  });

  // Get current language (non-store getter)
  let currentLanguage = getCurrentLocale?.() || 'tr';
  $effect(() => {
    // Update once on mount; if locale changes dynamically, consuming page should re-render
    currentLanguage = getCurrentLocale?.() || currentLanguage || 'tr';
  });

  // Handle search query changes with better performance
  $effect(() => {
    if (!searchQuery?.trim()) {
      articleSuggestions = [];
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      articleSuggestions = [];
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce the search
    searchTimeout = window.setTimeout(async () => {
      isLoading = true;
      
      try {
        const response = await fetch(`/api/articles?search=${encodeURIComponent(query)}&language=${currentLanguage}&limit=5&fields=id,title,slug,excerpt,translations,language,author,authorId`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and map the response data with translations
        if (data?.articles?.length) {
          articleSuggestions = data.articles
            .map(article => {
              // Get the best available title and slug from translations or fallback
              const lang = article.language || currentLanguage;
              const translation = article.translations?.[lang] || {};
              
              // Try translation first, then fallback to main article fields
              let title = translation.title || article.title;
              let slug = translation.slug || article.slug;
              
              // Handle fallback values more gracefully
              if (!title || title === 'No Title') {
                // Try other languages if current language has no title
                const availableLanguages = Object.keys(article.translations || {});
                for (const langCode of availableLanguages) {
                  const langTranslation = article.translations[langCode];
                  if (langTranslation?.title && langTranslation.title !== 'No Title') {
                    title = langTranslation.title;
                    slug = langTranslation.slug || slug;
                    break;
                  }
                }
              }
              
              // Final fallback - if still no valid title, skip this article
              if (!title || title === 'No Title') {
                return null;
              }
              
              // Generate a better slug if needed
              if (!slug || slug.startsWith('article-')) {
                // Try to extract slug from title
                slug = title.toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 50);
              }
              
              return {
                id: article.id || article._id?.toString(),
                title,
                slug,
                excerpt: translation.excerpt || article.excerpt || '',
                author: {
                  name: article.author?.name || article.author_name || article.author_nickname,
                  avatar: article.author?.avatar || article.author_avatar
                }
              };
            })
            .filter(Boolean); // Remove null entries
        } else {
          articleSuggestions = [];
        }
      } catch (error) {
        articleSuggestions = [];
      } finally {
        isLoading = false;
      }
      
      // Update popover visibility
      if (showDropdown) {
        isVisible = false;
        setTimeout(() => isVisible = true, 10);
      }
    }, 200);
    
    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  });
  
  // Update selectable items when article suggestions change
  $effect(() => {
    if (isVisible && popoverRef) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        updateSelectableItems();
      }, 50);
    }
  });
  
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
      // Keep dropdown open after triggering search
      // showDropdown = false;
      // inputRef?.blur?.();
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
    const items = selectableItems;
    
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        // Click the selected item
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
        // Keep focus on input, just scroll the item into view
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showDropdown) {
        showDropdown = true;
      }
      if (items.length > 0) {
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        // Keep focus on input, just scroll the item into view
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Tab') {
      // Tab navigates through items without moving focus from input
      if (showDropdown && items.length > 0) {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  // Helper to check if an item at given global index is selected
  const isSelected = (index: number) => selectedIndex === index;
  
  // Track the current item index across all sections
  let currentItemIndex = $state(-1);

  // Function to collect all selectable items
  const updateSelectableItems = () => {
    if (popoverRef) {
      // Get all interactive elements in the popover
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

  // Check if we have any suggestions to show
  const hasSuggestions = $derived(
    (filteredSuggestions && filteredSuggestions.length > 0) || 
    (filteredRecentSearches && filteredRecentSearches.length > 0) ||
    (articleSuggestions && articleSuggestions.length > 0)
  );
  
  
</script>

<div class={cn("relative w-full", className)} {...restProps}>
  <!-- Search Input -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    <Input
      bind:this={inputRef}
      bind:value={searchQuery}
      placeholder={placeholder || t('articles.search.placeholder')}
      class="pl-10 pr-10 text-xs cursor-text"
      onfocus={() => {
        if (showSuggestions) {
          showDropdown = true;
        }
      }}
      onkeydown={(e) => handleKeydown(e)}
      onblur={() => {
        // Small delay to allow click events on popover content
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

  <!-- Popover for Search Suggestions and Results -->
  
  {#if isMounted}
    <div 
      bind:this={popoverRef}
      class="search-popover absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md transition-all duration-200 ease-out {isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}"
      on:mousedown|preventDefault
      on:click|preventDefault
      style="pointer-events: {isVisible ? 'auto' : 'none'}"
    >
      <!-- Suggestions Dropdown -->
      {#if showSuggestions}
        <div class="p-2 ">
          <!-- Article Suggestions -->
          {#if articleSuggestions.length > 0}
            <div class="mb-4">
              <h3 class="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen class="h-3.5 w-3.5" />
                {t('articles.search.article_suggestions')}
              </h3>
              <div class="mt-1 space-y-1">
                {#each articleSuggestions as article, articleIdx (article.id)}
                  {#if article.slug}
                    <a 
                      href={`/article/${article.slug}`}
                      data-sveltekit-preload-data={article.slug ? 'hover' : false}
                      class="flex flex-col gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors {isSelected(articleIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
                      on:click|preventDefault={() => {
                        if (article.slug) {
                          goto(`/article/${article.slug}`);
                        }
                      }}
                    
                    >
                      <span class="font-medium">{article.title}</span>
                      {#if article.author?.name}
                        <span class="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {#if article.author?.avatar}
                            <img src={article.author.avatar} alt={article.author.name} class="h-4 w-4 rounded-full object-cover" />
                          {/if}
                          <span class="truncate">{article.author.name}</span>
                        </span>
                      {/if}
                      {#if article.excerpt}
                        <span class="text-xs text-muted-foreground line-clamp-1">
                          {article.excerpt}
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
                {t('articles.search.recentSearches')}
              </div>
              <div class="space-y-1">
                {#each filteredRecentSearches.slice(0, 5) as recent, recentIdx}
                  {@const globalIdx = articleSuggestions.length + recentIdx}
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
            {@const suggestionsStartIndex = articleSuggestions.length + filteredRecentSearches.length}
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
                          <Badge variant="secondary" class="ml-2 flex-shrink-0 text-xs">
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

      <!-- Loading State -->
      {#if isLoading && articleSuggestions.length === 0}
        <BarSpinner class="m-auto text-primary" />
      {/if}

      <!-- No Results -->
      {#if searchQuery && filteredSuggestions.length === 0 && filteredRecentSearches.length === 0 && articleSuggestions.length === 0}
        <div class="p-3 text-center text-xs text-muted-foreground">
                   {t('articles.search.noSuggestions')}
        </div>

      {/if}
      {#if !searchQuery}
        <div class="p-3 text-center text-xs text-muted-foreground">
                   {t('articles.search.typeForSearch')}
        </div>
      {/if}
      <!-- Search Action -->
      {#if searchQuery}
        {@const searchButtonIdx = articleSuggestions.length + filteredRecentSearches.length + filteredSuggestions.length}
        <div class="border-t p-2">
          <button
            class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground {isSelected(searchButtonIdx) ? 'bg-accent text-accent-foreground ring-2 ring-primary/30' : ''}"
            on:click={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Search class="h-3 w-3 flex-shrink-0" />
            <span class="truncate">{t('articles.search.searchFor')} "{searchQuery}"</span>
          </button>
        </div>
      {/if}

      <!-- Search Results Summary -->
      {#if value && value !== searchQuery}
        <div class="border-t p-2">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Search class="h-3 w-3 flex-shrink-0" />
            <span class="truncate">{t('articles.search.searchingFor')}:</span>
            <Badge variant="secondary" class="flex-shrink-0">{value}</Badge>
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
              {t('articles.search.clear')}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
