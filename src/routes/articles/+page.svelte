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

    // Get data from server
    let { data } = $props();

    // Mock data - replace with real data from your API
    const featuredArticle = {
        id: "1",
        title: "Liberteryen Anarşizmin Temel İlkeleri ve Modern Topluma Etkisi",
        excerpt: "Özgürlük ve bireysel haklar temelinde şekillenen liberteryen anarşizmin, günümüz toplumsal yapılarına nasıl alternatif sunduğunu keşfedin.",
        author: {
            name: "Hoppe",
            avatar: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.kzKgWfenuiLQvNlGpenU1AHaGo%3Fpid%3DApi&f=1&ipt=54bca2141ed5e0dbef988821abc0123c47a86c873e94c5d7655735f297c84976&ipo=images"
        },
        publishedAt: "2024-01-15",
        readTime: 8,
        category: "Teori",
        tags: ["anarşizm", "özgürlük", "bireycilik", "toplum"],
        views: 1250,
        comments: 23,
        likes: 89,
        featured: true,
        coverImage: "https://www.wiwo.de/politik/konjunktur/hans-hermann-hoppe-steuern-sind-enteignung/9282336.html"
    };

    const articles = [
        {
                    id: "1",
        title: "Liberteryen Anarşizmin Temel İlkeleri ve Modern Topluma Etkisi",
        excerpt: "Özgürlük ve bireysel haklar temelinde şekillenen liberteryen anarşizmin, günümüz toplumsal yapılarına nasıl alternatif sunduğunu keşfedin.",
        author: {
            name: "Hoppe",
            avatar: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.kzKgWfenuiLQvNlGpenU1AHaGo%3Fpid%3DApi&f=1&ipt=54bca2141ed5e0dbef988821abc0123c47a86c873e94c5d7655735f297c84976&ipo=images"
        },
        publishedAt: "2024-01-15",
        readTime: 8,
        category: "Teori",
        tags: ["anarşizm", "özgürlük", "bireycilik", "toplum"],
        views: 1250,
        comments: 23,
        likes: 89,
        featured: true,
        coverImage: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.wiwo.de%2Fimages%2Fiv_hans-hermann_hoppe_sr-pr%2F9285006%2F2-format11240.jpg&f=1&nofb=1&ipt=e3b327d90efeb0041c31d4752e25534a52a665144a01148efdccbf3461d80edb"
        },
        {
                    id: "2",
        title: "Liberteryen Anarşizmin Temel İlkeleri ve Modern Topluma Etkisi",
        excerpt: "Özgürlük ve bireysel haklar temelinde şekillenen liberteryen anarşizmin, günümüz toplumsal yapılarına nasıl alternatif sunduğunu keşfedin.",
        author: {
            name: "Hoppe",
            avatar: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.kzKgWfenuiLQvNlGpenU1AHaGo%3Fpid%3DApi&f=1&ipt=54bca2141ed5e0dbef988821abc0123c47a86c873e94c5d7655735f297c84976&ipo=images"
        },
        publishedAt: "2024-01-15",
        readTime: 8,
        category: "Teori",
        tags: ["anarşizm", "özgürlük", "bireycilik", "toplum"],
        views: 1250,
        comments: 23,
        likes: 89,
        featured: true,
        coverImage: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.wiwo.de%2Fimages%2Fiv_hans-hermann_hoppe_sr-pr%2F9285006%2F2-format11240.jpg&f=1&nofb=1&ipt=e3b327d90efeb0041c31d4752e25534a52a665144a01148efdccbf3461d80edb"
        },

        {
                    id: "3",
        title: "Liberteryen Anarşizmin Temel İlkeleri ve Modern Topluma Etkisi",
        excerpt: "Özgürlük ve bireysel haklar temelinde şekillenen liberteryen anarşizmin, günümüz toplumsal yapılarına nasıl alternatif sunduğunu keşfedin.",
        author: {
            name: "Hoppe",
            avatar: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.kzKgWfenuiLQvNlGpenU1AHaGo%3Fpid%3DApi&f=1&ipt=54bca2141ed5e0dbef988821abc0123c47a86c873e94c5d7655735f297c84976&ipo=images"
        },
        publishedAt: "2024-01-15",
        readTime: 8,
        category: "Teori",
        tags: ["anarşizm", "özgürlük", "bireycilik", "toplum"],
        views: 1250,
        comments: 23,
        likes: 89,
        featured: true,
        coverImage: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.wiwo.de%2Fimages%2Fiv_hans-hermann_hoppe_sr-pr%2F9285006%2F2-format11240.jpg&f=1&nofb=1&ipt=e3b327d90efeb0041c31d4752e25534a52a665144a01148efdccbf3461d80edb"
        },
    ];

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

    let searchQuery = $state("");
    let activeFilters = $state({});
    let loading = $state(false);
    let layoutMode = $state("grid");

    const handleSearch = (query: string) => {
        searchQuery = query;
        // Implement search logic here
        console.log("Searching for:", query);
    };

    const handleFiltersChange = (filters: any) => {
        activeFilters = filters;
        // Implement filter logic here
        console.log("Filters changed:", filters);
    };

    const handleLoadMore = () => {
        loading = true;
        // Simulate loading more articles
        setTimeout(() => {
            loading = false;
        }, 1000);
    };
  import Loader from '$lib/components/load.svelte';
</script>

<Loader />
<svelte:head>
    <title>{t('Articles')}</title>
    <meta name="description" content={t('articles.description')} />
</svelte:head>

<Navbar />
<main class="flex flex-col min-h-screen">
    <!-- Main Content -->
    <section class="container mx-auto space-y-4 px-4 pt-6 sm:pt-10">
        <div class="space-y-8 flex flex-col items-center">
            <!-- Page Header -->
            <div class="text-center space-y-3">
                <div class="flex flex-col items-center gap-3">

                        <h1 class="text-xl font-bold tracking-tight md:text-4xl">
                            {t('articles.allArticles')}
                        </h1>
                        <p class="text-sm  text-muted-foreground max-w-2xl">
                            {t('articles.subtitle')}
                        </p>
                        <Button href="/write" size="sm" class="shrink-0">
                            <PenLine class="w-4 h-4 mr-2" />
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
                articles={articles}
                loading={loading}
                layout={layoutMode}
                variant="default"
                showLoadMore={true}
                hasMore={true}
                onLoadMore={handleLoadMore}
            />

    </section>
</main>

<Footer />