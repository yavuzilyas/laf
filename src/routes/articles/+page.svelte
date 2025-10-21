<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import ArticleHero from "$lib/components/ArticleHero.svelte";
    import ArticleList from "$lib/components/ArticleList.svelte";
    import ArticleFilterPopover from "$lib/components/ArticleFilterPopover.svelte";
    import ArticleSearch from "$lib/components/ArticleSearch.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { t } from '$lib/stores/i18n.svelte.ts';
    import { PenLine, TrendingUp, Clock, Users, Grid, List } from "@lucide/svelte";

    // Mock data for testing
    const mockArticles = [
        {
            id: '1',
            slug: 'test-article-1',
            title: 'Anarşizm ve Özgürlük Felsefesi',
            excerpt: 'Anarşizmin temel prensipleri ve özgürlük kavramı üzerine detaylı bir inceleme.',
            author: { name: 'Ahmet Yılmaz', avatar: null },
            publishedAt: '2024-01-01T00:00:00Z',
            readTime: 5,
            category: 'Teori',
            tags: ['anarşizm', 'özgürlük', 'felsefe'],
            views: 100,
            comments: 10,
            likes: 25,
            dislikes: 3,
            featured: true,
            coverImage: null,
            language: 'tr'
        },
        {
            id: '2',
            slug: 'test-article-2',
            title: 'Serbest Piyasa Ekonomisi',
            excerpt: 'Liberteryen ekonomi teorisi ve serbest piyasa mekanizmaları hakkında kapsamlı analiz.',
            author: { name: 'Mehmet Demir', avatar: null },
            publishedAt: '2024-01-02T00:00:00Z',
            readTime: 3,
            category: 'Ekonomi',
            tags: ['ekonomi', 'serbest piyasa', 'liberteryen'],
            views: 50,
            comments: 5,
            likes: 15,
            dislikes: 1,
            featured: false,
            coverImage: null,
            language: 'tr'
        },
        {
            id: '3',
            slug: 'test-article-3',
            title: 'Devletsiz Toplum Modelleri',
            excerpt: 'Tarih boyunca var olmuş devletsiz toplum örnekleri ve modern uygulamaları.',
            author: { name: 'Ayşe Kaya', avatar: null },
            publishedAt: '2024-01-03T00:00:00Z',
            readTime: 7,
            category: 'Tarih',
            tags: ['tarih', 'devletsiz toplum', 'anarşizm'],
            views: 75,
            comments: 8,
            likes: 20,
            dislikes: 2,
            featured: false,
            coverImage: null,
            language: 'tr'
        },
        {
            id: '4',
            slug: 'test-article-4',
            title: 'Freedom and Anarchism',
            excerpt: 'An in-depth analysis of freedom concepts in anarchist philosophy.',
            author: { name: 'John Smith', avatar: null },
            publishedAt: '2024-01-04T00:00:00Z',
            readTime: 6,
            category: 'Teori',
            tags: ['anarchism', 'freedom', 'philosophy'],
            views: 120,
            comments: 15,
            likes: 30,
            dislikes: 4,
            featured: true,
            coverImage: null,
            language: 'en'
        },
        {
            id: '5',
            slug: 'test-article-5',
            title: 'Teknoloji ve Özgürlük',
            excerpt: 'Dijital çağda teknolojinin özgürlük ve mahremiyet üzerindeki etkileri.',
            author: { name: 'Zeynep Arslan', avatar: null },
            publishedAt: '2024-01-05T00:00:00Z',
            readTime: 4,
            category: 'Teknoloji',
            tags: ['teknoloji', 'özgürlük', 'mahremiyet'],
            views: 90,
            comments: 12,
            likes: 22,
            dislikes: 1,
            featured: false,
            coverImage: null,
            language: 'tr'
        },
        {
            id: '6',
            slug: 'test-article-6',
            title: 'Politik Felsefe Temelleri',
            excerpt: 'Liberteryen politik felsefenin temel kavramları ve ilkeleri.',
            author: { name: 'Can Öztürk', avatar: null },
            publishedAt: '2024-01-06T00:00:00Z',
            readTime: 8,
            category: 'Felsefe',
            tags: ['felsefe', 'politika', 'liberteryen'],
            views: 110,
            comments: 18,
            likes: 28,
            dislikes: 5,
            featured: false,
            coverImage: null,
            language: 'tr'
        }
    ];

    // Get data from server
    let { data } = $props();
    
    // State variables
    let allArticles = $state(data?.articles ?? mockArticles);
    let filteredArticles = $state([...allArticles]);
    let displayedArticles = $state([...allArticles]);
    let searchQuery = $state("");
    let activeFilters = $state<any>({});
    let loading = $state(false);
    let hasMore = $state(false);
    let layoutMode = $state("grid");

    const filterOptions = {
        languages: [
            { label: "Türkçe", value: "tr" },
            { label: "English", value: "en" },
            { label: "Deutsch", value: "de" },
            { label: "Français", value: "fr" }
        ],
        categories: ["Teori", "Tarih", "Ekonomi", "Felsefe", "Teknoloji", "Politika"],
        types: ["Makale", "Analiz", "Görüş", "Çeviri", "Röportaj", "İnceleme"],
        dateRanges: [
            { label: "Son hafta", value: "week" },
            { label: "Son ay", value: "month" },
            { label: "Son yıl", value: "year" }
        ]
    };

    const searchSuggestions = [
        { type: 'popular', value: 'anarşizm', count: 15 },
        { type: 'popular', value: 'özgürlük', count: 12 },
        { type: 'tag', value: 'ekonomi', count: 8 },
        { type: 'category', value: 'Teori', count: 6 }
    ];

    const recentSearches = ["liberteryen", "devletsiz toplum", "serbest piyasa"];

    // Apply filters and search
    function applyFiltersAndSearch() {
        let result = [...allArticles];

        // Apply search filter
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(article =>
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                article.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        if (activeFilters.category && activeFilters.category !== "") {
            result = result.filter(article =>
                article.category === activeFilters.category
            );
        }

        // Apply language filter
        if (activeFilters.language && activeFilters.language !== "") {
            result = result.filter(article =>
                article.language === activeFilters.language
            );
        }

        // Apply type filter
        if (activeFilters.type && activeFilters.type !== "") {
            // Type filtering can be added when article type field exists
        }

        // Apply tags filter
        if (activeFilters.tags && activeFilters.tags.length > 0) {
            result = result.filter(article =>
                activeFilters.tags.some((tag: string) => article.tags.includes(tag))
            );
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
        applyFiltersAndSearch();
    };

    // Reactive search - her değişiklikte otomatik arama
    $effect(() => {
        if (searchQuery !== undefined) {
            applyFiltersAndSearch();
        }
    });

    const handleFiltersChange = (filters: any) => {
        activeFilters = filters;
        applyFiltersAndSearch();
    };

    const handleLoadMore = async () => {
        // Not implemented for mock data
        hasMore = false;
    };
  import Loader from '$lib/components/load.svelte';
  import {BookTextIcon, NotebookPenIcon} from 'svelte-animate-icons';
  let notebookPenIcon;
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
            <!-- Page Header -->
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