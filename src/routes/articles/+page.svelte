<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import ArticleList from "$lib/components/ArticleList.svelte";
    import ArticleFilterPopover from "$lib/components/ArticleFilterPopover.svelte";
    import ArticleSearch from "$lib/components/ArticleSearch.svelte";
    import { Button } from "$lib/components/ui/button";
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';
    import { Grid, List } from "@lucide/svelte";

    import Loader from '$lib/components/load.svelte';
    import {BookTextIcon, NotebookPenIcon} from 'svelte-animate-icons';

    let notebookPenIcon;

    let { data } = $props();

    const serverArticles = data?.articles ?? [];
    const categories = data?.categories ?? [];
    const tags = data?.popularTags ?? [];
    const currentUser = data?.user ?? null;
    const followingUserIds = data?.followingUserIds ?? [];
    const languageOptions = (data?.availableLanguages ?? []).map((lang: string) => ({
        value: lang,
        label: lang.toUpperCase()
    }));

    // Language-aware article list reacting to current locale
    // Extract all unique languages from all articles and their translations
    const allAvailableLanguages = $derived(
        Array.from(
            new Set(
                serverArticles.flatMap(article => {
                    const translations = article.translations || {};
                    return [
                        ...Object.keys(translations),
                        article.language,
                        article.defaultLanguage
                    ].filter(Boolean);
                })
            )
        ).map(lang => ({
            value: lang,
            label: lang.toUpperCase()
        }))
    );

    const allArticles = $derived(
        serverArticles.map((article) => {
            const translations = article.translations || {};
            const translationKeys = Object.keys(translations);
            const currentLocale = getCurrentLocale();
            const fallbackKey = translationKeys[0] || article.language || article.defaultLanguage || 'tr';
            const displayLanguage = currentLocale && translations[currentLocale]
                ? currentLocale
                : fallbackKey;

            const translation = translations[displayLanguage] || translations[fallbackKey] || {};

            return {
                ...article,
                title: translation.title || article.title || 'Başlıksız',
                excerpt: translation.excerpt || article.excerpt || '',
                slug: translation.slug || article.slug,
                language: displayLanguage,
                translations
            };
        })
    );

    let filteredArticles = $state([...allArticles]);
    let displayedArticles = $state([...allArticles]);
    let searchQuery = $state("");
    let activeFilters = $state<any>({
        language: '',
        category: '',
        type: '',
        dateRange: '',
        customDateRange: undefined,
        tags: [],
        nickname: '',
        onlyFollowing: false
    });
    let loading = $state(false);
    let hasMore = $state(false);
    let layoutMode = $state("grid");

    const filterOptions = {
        languages: allAvailableLanguages.length
            ? allAvailableLanguages
            : languageOptions,
        categories: categories.length
            ? categories
            : Array.from(new Set(allArticles.map(article => article.category).filter(Boolean))),
        dateRanges: [
            { label: "Son hafta", value: "week" },
            { label: "Son ay", value: "month" },
            { label: "Son yıl", value: "year" }
        ]
    };

    const searchSuggestions = [
        { type: 'popular' as const, value: 'anarşizm', count: 15 },
        { type: 'popular' as const, value: 'özgürlük', count: 12 },
        { type: 'tag' as const, value: 'ekonomi', count: 8 },
        { type: 'category' as const, value: 'Teori', count: 6 }
    ];

    // Recent searches from localStorage
    let recentSearches = $state<string[]>([]);
    
    // Initialize recent searches from localStorage
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('recentSearches');
        recentSearches = stored ? JSON.parse(stored) : [];
    }

    // Add search to recent searches
    const addToRecentSearches = (query: string) => {
        if (!query.trim()) return;
        
        const trimmed = query.trim();
        const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 10);
        recentSearches = updated;
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('recentSearches', JSON.stringify(updated));
        }
    };

    // Apply filters and search
    function applyFiltersAndSearch() {
        let result = [...allArticles];

        // Apply search filter
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(article =>
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                (article.tags || []).some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply category filter (case insensitive partial match)
        if (activeFilters.category) {
            const categoryLower = activeFilters.category.toLowerCase();
            result = result.filter(article => 
                article.category && article.category.toLowerCase().includes(categoryLower)
            );
        }

        // Apply language filter - check both article.language and translations
        if (activeFilters.language && activeFilters.language !== "") {
            result = result.filter(article => {
                // Check if the article's main language matches
                if (article.language === activeFilters.language) return true;
                
                // Check if the article has a translation in the selected language
                const translations = article.translations || {};
                return Object.keys(translations).includes(activeFilters.language);
            });
        }

        // Apply tags filter
        if (activeFilters.tags && activeFilters.tags.length > 0) {
            result = result.filter(article =>
                activeFilters.tags.some((tag: string) => (article.tags || []).includes(tag))
            );
        }

        // Apply nickname filter (author username)
        if (activeFilters.nickname && activeFilters.nickname.trim()) {
            const nicknameLower = activeFilters.nickname.toLowerCase().trim();
            result = result.filter(article => 
                article.author && article.author.nickname && 
                article.author.nickname.toLowerCase().includes(nicknameLower)
            );
        }

        // Apply onlyFollowing filter
        if (activeFilters.onlyFollowing && followingUserIds.length > 0) {
            console.log('Following filter active:', {
                activeFiltersOnlyFollowing: activeFilters.onlyFollowing,
                followingUserIds,
                followingLength: followingUserIds.length,
                sampleArticleAuthorId: result[0]?.authorId
            });
            result = result.filter(article => {
                const articleAuthorId = article.authorId?.toString?.() || article.authorId;
                const isFollowed = articleAuthorId && followingUserIds.includes(articleAuthorId);
                if (!isFollowed) {
                    console.log('Not followed article:', article.title, 'authorId:', articleAuthorId);
                }
                return isFollowed;
            });
            console.log('Filtered result count:', result.length);
        }

        // Apply date range filter (supports CalendarDate, plain objects, ISO strings)
        if (activeFilters.customDateRange && (activeFilters.customDateRange.start || activeFilters.customDateRange.end)) {
            const toJSDate = (d: any): Date | null => {
                if (!d) return null;
                if (d instanceof Date) return d;
                if (typeof d === 'string' || typeof d === 'number') return new Date(d);
                if (typeof d === 'object') {
                    if (typeof d.toDate === 'function') {
                        // @internationalized/date CalendarDate
                        try { return d.toDate('UTC'); } catch { /* fallthrough */ }
                    }
                    if ('year' in d && 'month' in d && 'day' in d) {
                        // Plain date-like object
                        return new Date(d.year, (d.month as number) - 1, d.day as number);
                    }
                }
                return null;
            };

            const startDate = toJSDate(activeFilters.customDateRange.start);
            const endDateRaw = toJSDate(activeFilters.customDateRange.end);
            // If only start is present, treat it as single-day range
            const endDate = endDateRaw ?? startDate;

            if (startDate && endDate) {
                const startMs = startDate.setHours(0, 0, 0, 0);
                const endMs = endDate.setHours(23, 59, 59, 999);
                result = result.filter(article => {
                    const pub = new Date(article.publishedAt);
                    const pubMs = pub.getTime();
                    return pubMs >= startMs && pubMs <= endMs;
                });
            }
        }

        filteredArticles = result;
        displayedArticles = result;
        hasMore = false; // No pagination for mock data
    }

    const handleSearch = (query: string) => {
        searchQuery = query;
        addToRecentSearches(query);
        applyFiltersAndSearch();
    };

    // Reactive search - her değişiklikte otomatik arama
    $effect(() => {
        if (searchQuery !== undefined) {
            applyFiltersAndSearch();
        }
    });

    // Re-apply filters when article representations update with locale changes
    $effect(() => {
        allArticles;
        applyFiltersAndSearch();
    });

    const handleFiltersChange = (filters: any) => {
        activeFilters = filters;
        applyFiltersAndSearch();
    };

    const handleLoadMore = async () => {
        // Not implemented for mock data
        hasMore = false;
    };
</script>

{#if loading}
  <Loader />
{/if}
<svelte:head>
    <title>{t('Articles')}</title>
    <meta name="description" content={t('articles.description')} />
</svelte:head>

<Navbar />
<main class="flex flex-col min-h-screen">
    <!-- Main Content -->
    <section class="container max-w-7xl mx-auto space-y-4 px-3 sm:px-6 py-6 sm:pt-10">
        <div class="space-y-8 flex flex-col items-center">
            <div class="text-center space-y-3">
                <div class="flex flex-col items-center gap-3">
                    <BookTextIcon triggers={{ hover: false }} duration={2500} animationState="loading" size={48} class="text-primary" />
                    <h1 class="text-xl font-bold tracking-tight md:text-4xl">
                        {t('articles.allArticles')}
                    </h1>
                    <p class="text-sm  text-muted-foreground max-w-2xl">
                        {t('articles.subtitle')}
                    </p>
                    <Button  onmouseenter={() => notebookPenIcon?.start()} onmouseleave={() => notebookPenIcon?.stop()} href="/write" size="sm" class="shrink-0">
                        <NotebookPenIcon loop="true" triggers={{ custom: true }}  bind:this={notebookPenIcon} class="w-4 h-4" />
                        {t('articles.writeArticle')}
                    </Button>
                </div>
            </div>
                <div class="flex flex-col sm:flex-row items-center gap-3">

                    <ArticleSearch
                        value={searchQuery}
                        suggestions={searchSuggestions}
                        recentSearches={recentSearches}
                        onSearch={handleSearch}
                        onClear={() => searchQuery = ""}
                        class="w-full "
                    />
       
                    <div class="flex items-center gap-1 rounded-lg border p-1">
                                                <ArticleFilterPopover
                            options={filterOptions}
                            activeFilters={activeFilters}
                            onFiltersChange={handleFiltersChange}
                            enableFollowingFilter={!!currentUser}
                        />

                        <Button
                            variant={layoutMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onclick={() => layoutMode = "grid"}
                            class="h-8 w-8 p-0"
                        >
                            <Grid class="h-4 w-4" />
                        </Button>
                        <Button
                            variant={layoutMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onclick={() => layoutMode = "list"}
                            class="h-8 w-8 p-0"
                        >
                            <List class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Articles List -->
            <ArticleList
                articles={displayedArticles}
                loading={loading}
                layout={layoutMode}
                variant="default"
                showLoadMore={false}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
            />

    </section>
</main>

<Footer />