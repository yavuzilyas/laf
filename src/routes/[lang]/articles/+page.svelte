<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import ArticleList from "$lib/components/ArticleList.svelte";
    import ArticleFilterPopover from "$lib/components/ArticleFilterPopover.svelte";
    import ArticleSearch from "$lib/components/ArticleSearch.svelte";
    import { Button } from "$lib/components/ui/button";
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';

    // Locale-aware URL helper
    const currentLocale = $derived(getCurrentLocale() || 'tr');
    const l = (path: string) => `/${currentLocale}${path}`;

    import Loader from '$lib/components/load.svelte';
    import {BookTextIcon, NotebookPenIcon} from 'svelte-animate-icons';

    let notebookPenIcon: any;

    let { data } = $props();

    // SEO Meta computation
    const seoMeta = $derived((() => {
        const siteName = 'LAF - Libertarian Anarchist Foundation';
        const siteUrl = 'https://laf.international';
        const url = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/articles`;

        const title = 'Makaleler | LAF - Liberteryen Anarşist Faaliyet';
        const description = 'Liberter anarşizm, özgürlük ve bireysel haklar üzerine makalelerimizi keşfedin. Felsefe, iktisat, devlet teorisi, doğal hukuk ve daha fazlası.';

        return {
            title,
            description,
            canonical: url,
            og: {
                title,
                description,
                type: 'website',
                url,
                site_name: siteName,
                image: `${siteUrl}/og-articles.png`,
                image_alt: 'LAF Articles'
            },
            twitter: {
                card: 'summary_large_image',
                site: '@lafoundation',
                title,
                description,
                image: `${siteUrl}/og-articles.png`,
                image_alt: 'LAF Articles'
            },
            structuredData: {
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: title,
                description,
                url,
                isPartOf: {
                    '@type': 'WebSite',
                    name: siteName,
                    url: siteUrl
                },
                about: {
                    '@type': 'Thing',
                    name: 'Liberteryen Anarşizm'
                }
            },
            breadcrumbs: {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Ana Sayfa',
                        item: siteUrl
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Makaleler',
                        item: url
                    }
                ]
            }
        };
    })());

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
            const fallbackKey = translationKeys[0] || article.defaultLanguage || 'tr';
            const translation = translations[fallbackKey] || {};

            return {
                ...article,
                title: translation.title || article.title || 'Başlıksız',
                excerpt: translation.excerpt || article.excerpt || '',
                slug: translation.slug || article.slug,
                language: fallbackKey,
                translations
            };
        })
    );

    let filteredArticles = $state([...allArticles]);
    let searchQuery = $state("");
    let currentPage = $state(1);
    const itemsPerPage = 12;
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

        // Apply search filter - search in all translations, prioritize selected language
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(article => {
                const translations = article.translations || {};
                
                // Check all translations for matches
                const allTranslationValues = Object.values(translations).flatMap((t: any) => [
                    t.title || '',
                    t.excerpt || '',
                    t.content || ''
                ]).join(' ').toLowerCase();
                
                // Check tags
                const tagsMatch = (article.tags || []).some(tag => tag.toLowerCase().includes(query));
                
                // Check current display title/excerpt
                const currentMatch = (article.title || '').toLowerCase().includes(query) || 
                                    (article.excerpt || '').toLowerCase().includes(query);
                
                // Check all translations combined
                const translationsMatch = allTranslationValues.includes(query);
                
                return currentMatch || tagsMatch || translationsMatch;
            }).sort((a, b) => {
                // Prioritize: selected language matches first, then others
                const query = searchQuery.toLowerCase().trim();
                const aTranslations = a.translations || {};
                const bTranslations = b.translations || {};
                
                // Get current language from article
                const currentLang = a.language || 'tr';
                
                // Check if current language translation matches
                const aCurrentMatch = (aTranslations[currentLang]?.title || '').toLowerCase().includes(query) ||
                                     (aTranslations[currentLang]?.excerpt || '').toLowerCase().includes(query);
                const bCurrentMatch = (bTranslations[currentLang]?.title || '').toLowerCase().includes(query) ||
                                     (bTranslations[currentLang]?.excerpt || '').toLowerCase().includes(query);
                
                if (aCurrentMatch && !bCurrentMatch) return -1;
                if (!aCurrentMatch && bCurrentMatch) return 1;
                return 0;
            });
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
                if (article.defaultLanguage === activeFilters.language) return true;
                
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
                }
                return isFollowed;
            });
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
        currentPage = 1; // Reset to first page when filters change
    }

    const handleSearch = (query: string) => {
        searchQuery = query;
        currentPage = 1; // Reset to first page on search
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
        currentPage = 1; // Reset to first page when filters change
        applyFiltersAndSearch();
    };

    const handlePageChange = (page: number) => {
        currentPage = page;
    };

</script>

{#if loading}
  <Loader />
{/if}
<svelte:head>
    <title>{seoMeta.title}</title>
    <meta name="description" content={seoMeta.description} />
    <link rel="canonical" href={seoMeta.canonical} />

    <!-- Open Graph -->
    <meta property="og:title" content={seoMeta.og.title} />
    <meta property="og:description" content={seoMeta.og.description} />
    <meta property="og:type" content={seoMeta.og.type} />
    <meta property="og:url" content={seoMeta.og.url} />
    <meta property="og:site_name" content={seoMeta.og.site_name} />
    <meta property="og:image" content={seoMeta.og.image} />
    <meta property="og:image:alt" content={seoMeta.og.image_alt} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content={seoMeta.twitter.card} />
    <meta name="twitter:site" content={seoMeta.twitter.site} />
    <meta name="twitter:title" content={seoMeta.twitter.title} />
    <meta name="twitter:description" content={seoMeta.twitter.description} />
    <meta name="twitter:image" content={seoMeta.twitter.image} />
    <meta name="twitter:image:alt" content={seoMeta.twitter.image_alt} />

    <!-- Structured Data -->
    {@html `<script type="application/ld+json">${JSON.stringify(seoMeta.structuredData)}</script>`}
    {@html `<script type="application/ld+json">${JSON.stringify(seoMeta.breadcrumbs)}</script>`}
</svelte:head>

<Navbar />
<main class="flex flex-col min-h-screen">
    <!-- Main Content -->
    <section class="container max-w-7xl mx-auto space-y-4 px-3 sm:px-6 py-10">
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
                    <Button size="xs"  onmouseenter={() => notebookPenIcon?.start()} onmouseleave={() => notebookPenIcon?.stop()} href={l('/write')}  class="shrink-0">
                        <NotebookPenIcon loop={true} triggers={{ custom: true }}  bind:this={notebookPenIcon} class="w-4 h-4" />
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
                    </div>
                </div>
            </div>

            <!-- Articles List -->
            <div id="article-list" class="w-full">
                <ArticleList
                    articles={filteredArticles}
                    loading={loading}
                    layout="grid"
                    variant="default"
                    usePagination={true}
                    {itemsPerPage}
                    bind:currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>

    </section>
</main>

<Footer />