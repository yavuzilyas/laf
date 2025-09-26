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
    import { BookOpen, TrendingUp, Clock, Users, Grid, List } from "@lucide/svelte";

    // Get data from server
    let { data } = $props();

    // Mock data - replace with real data from your API
    const featuredArticle = {
        id: "1",
        title: "Liberteryen Anarşizmin Temel İlkeleri ve Modern Topluma Etkisi",
        excerpt: "Özgürlük ve bireysel haklar temelinde şekillenen liberteryen anarşizmin, günümüz toplumsal yapılarına nasıl alternatif sunduğunu keşfedin.",
        author: {
            name: "Ahmet Özkan",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
        },
        publishedAt: "2024-01-15",
        readTime: 8,
        category: "Teori",
        tags: ["anarşizm", "özgürlük", "bireycilik", "toplum"],
        views: 1250,
        comments: 23,
        likes: 89,
        featured: true,
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
    };

    const articles = [
        {
            id: "2",
            title: "Devletsiz Toplum: Utopya mı Gerçeklik mi?",
            excerpt: "Tarih boyunca devletsiz toplum örneklerini inceleyerek, modern dünyada böyle bir yapının mümkün olup olmadığını tartışıyoruz.",
            author: {
                name: "Zeynep Kaya",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face"
            },
            publishedAt: "2024-01-12",
            readTime: 6,
            category: "Tarih",
            tags: ["devletsizlik", "toplum", "tarih"],
            views: 890,
            comments: 15,
            likes: 67,
            coverImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop"
        },
        {
            id: "3",
            title: "Ekonomik Özgürlük ve Serbest Piyasa",
            excerpt: "Liberteryen ekonomi anlayışının temel prensipleri ve serbest piyasanın bireysel özgürlüklerle ilişkisi.",
            author: {
                name: "Mehmet Demir",
                avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face"
            },
            publishedAt: "2024-01-10",
            readTime: 10,
            category: "Ekonomi",
            tags: ["ekonomi", "serbest-piyasa", "özgürlük"],
            views: 1100,
            comments: 28,
            likes: 95,
            coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop"
        },
        {
            id: "4",
            title: "Bireysel Haklar ve Toplumsal Sorumluluk",
            excerpt: "Bireysel hakların korunması ile toplumsal sorumluluk arasındaki dengeyi liberteryen perspektiften ele alıyoruz.",
            author: {
                name: "Ayşe Yılmaz",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face"
            },
            publishedAt: "2024-01-08",
            readTime: 7,
            category: "Felsefe",
            tags: ["bireysel-haklar", "sorumluluk", "felsefe"],
            views: 750,
            comments: 19,
            likes: 54,
            coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop"
        },
        {
            id: "5",
            title: "Anarşist Hareketin Türkiye'deki Tarihi",
            excerpt: "Türkiye'de anarşist düşüncenin gelişimi ve önemli temsilcilerinin katkıları üzerine kapsamlı bir inceleme.",
            author: {
                name: "Can Özdemir",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
            },
            publishedAt: "2024-01-05",
            readTime: 12,
            category: "Tarih",
            tags: ["türkiye", "anarşizm", "tarih", "hareket"],
            views: 980,
            comments: 31,
            likes: 78,
            coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop"
        },
        {
            id: "6",
            title: "Teknoloji ve Özgürlük: Dijital Çağda Anarşizm",
            excerpt: "Dijital teknolojilerin özgürlük mücadelesindeki rolü ve internet çağında anarşist prensiplerin uygulanması.",
            author: {
                name: "Emre Şahin",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            },
            publishedAt: "2024-01-03",
            readTime: 9,
            category: "Teknoloji",
            tags: ["teknoloji", "dijital", "internet", "özgürlük"],
            views: 1350,
            comments: 42,
            likes: 112,
            coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
        }
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
    <section class="container mx-auto px-4 py-12">
        <div class="space-y-8">
            <!-- Page Header -->
            <div class="text-center space-y-4">
                <div class="flex flex-col items-center gap-4">

                        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
                            {t('articles.allArticles')}
                        </h1>
                        <p class="text-lg text-muted-foreground max-w-2xl">
                            {t('articles.subtitle')}
                        </p>
                        <Button href="/write" size="sm" class="shrink-0">
                            <BookOpen class="w-4 h-4 mr-2" />
                            Makale Yaz
                        </Button>

                </div>
            </div>

            <!-- Search and Controls -->
            <div class="space-y-6">


                <!-- Filter and Layout Controls -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <ArticleFilterPopover
                            options={filterOptions}
                            activeFilters={activeFilters}
                            onFiltersChange={handleFiltersChange}
                        />
                        <span class="text-sm text-muted-foreground">
                            {articles.length} makale
                        </span>
                    </div>
                                    <div class="w-1/2">
                    <ArticleSearch
                        value={searchQuery}
                        suggestions={searchSuggestions}
                        recentSearches={recentSearches}
                        onSearch={handleSearch}
                        onClear={() => searchQuery = ""}
                    />
                </div>
                    <div class="flex items-center gap-1 rounded-lg border p-1">
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
        </div>
    </section>
</main>

<Footer />