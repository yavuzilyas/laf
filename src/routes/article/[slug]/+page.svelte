<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { t } from '$lib/stores/i18n.svelte.ts';
    import { EdraEditor } from '$lib/components/edra/shadcn/index.js';
    import { 
        Calendar, 
        Clock, 
        Eye, 
        Heart, 
        MessageCircle, 
        Share2,
        User,
        ArrowLeft,
        Languages
    } from "@lucide/svelte";

    // Local state for like button
    let { data } = $props();
    let likesCount = $state<number>(data.article?.stats?.likes ?? 0);
    let liked = $state<boolean>(false);

    async function toggleLike() {
        try {
            const res = await fetch(`/api/articles/${data.article._id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: liked ? 'unlike' : 'like' })
            });
            if (!res.ok) return;
            const json = await res.json();
            liked = !!json.liked;
            likesCount += liked ? 1 : -1;
        } catch (e) {
            // no-op
        }
    }

    let { data } = $props();
    let article = data?.article;

    if (!article) {
        // Handle article not found
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(t.currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateReadTime = (content: string) => {
        const wordsPerMinute = 200;
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        const wordCount = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    };

    const switchToLanguage = (lang: string) => {
        const target = article?.availableTranslations?.[lang];
        if (target?.slug) {
            window.location.href = `/article/${target.slug}`;
        }
    };
</script>

<svelte:head>
    {#if article}
        <title>{article.title} - LAF</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
    {:else}
        <title>Makale Bulunamadı - LAF</title>
    {/if}
</svelte:head>

<Navbar />

<main class="min-h-screen bg-background">
    {#if !article}
        <!-- Article not found -->
        <div class="container mx-auto px-4 py-12 text-center">
            <h1 class="text-2xl font-bold mb-4">Makale Bulunamadı</h1>
            <p class="text-muted-foreground mb-6">Aradığınız makale mevcut değil veya kaldırılmış olabilir.</p>
            <Button href="/articles">Makalelere Dön</Button>
        </div>
    {:else}
        <!-- Article content -->
        <article class="container mx-auto px-4 py-8 max-w-4xl">
            <!-- Back button -->
            <div class="mb-6">
                <Button variant="ghost" href="/articles" class="gap-2">
                    <ArrowLeft class="w-4 h-4" />
                    Makalelere Dön
                </Button>
            </div>

            <!-- Article header -->
            <header class="mb-8">
                <div class="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{article.category}</Badge>
                    <Badge variant="outline">{article.language.toUpperCase()}</Badge>
                </div>

                <h1 class="text-4xl font-bold leading-tight mb-4">
                    {article.title}
                </h1>

                {#if article.excerpt}
                    <p class="text-xl text-muted-foreground mb-6">
                        {article.excerpt}
                    </p>
                {/if}

                <!-- Article meta -->
                <div class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                    <!-- Author -->
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User class="w-4 h-4" />
                        </div>
                        <span class="font-medium">
                            {article.author.name && article.author.surname 
                                ? `${article.author.name} ${article.author.surname}`
                                : article.author.nickname}
                        </span>
                    </div>

                    <!-- Published date -->
                    <div class="flex items-center gap-1">
                        <Calendar class="w-4 h-4" />
                        <time>{formatDate(article.publishedAt || article.createdAt)}</time>
                    </div>

                    <!-- Read time -->
                    <div class="flex items-center gap-1">
                        <Clock class="w-4 h-4" />
                        <span>{calculateReadTime(article.content)} dk okuma</span>
                    </div>
                </div>

                <!-- Article stats -->
                <div class="flex items-center gap-6 text-sm text-muted-foreground">
                    <div class="flex items-center gap-1">
                        <Eye class="w-4 h-4" />
                        <span>{article.stats.views}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Heart class="w-4 h-4" />
                        <span>{article.stats.likes}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <MessageCircle class="w-4 h-4" />
                        <span>{article.stats.comments}</span>
                    </div>
                    
                    <Button variant="ghost" size="sm" class="ml-auto">
                        <Share2 class="w-4 h-4 mr-2" />
                        Paylaş
                    </Button>
                </div>

                <!-- Language switcher -->
                {#if article.availableTranslations}
                <div class="mt-4 flex flex-wrap items-center gap-2">
                    <span class="text-sm text-muted-foreground flex items-center gap-1">
                        <Languages class="w-4 h-4" /> Diller:
                    </span>
                    {#each Object.keys(article.availableTranslations) as lang}
                        <Button
                            size="sm"
                            variant={lang === article.language ? 'default' : 'outline'}
                            onclick={() => switchToLanguage(lang)}
                        >
                            {lang.toUpperCase()}
                        </Button>
                    {/each}
                </div>
                {/if}
            </header>

            <Separator class="mb-8" />

            <!-- Action bar -->
            <div class="mb-6 flex items-center gap-3">
                <Button variant={liked ? 'default' : 'outline'} size="sm" onclick={toggleLike} class="gap-2">
                    <Heart class={liked ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                    <span>{likesCount}</span>
                </Button>
                <!-- Placeholders for future actions: save, comment, share -->
                <!--
                <Button variant="outline" size="sm" class="gap-2">
                    <Bookmark class="h-4 w-4" /> Kaydet
                </Button>
                <Button variant="outline" size="sm" class="gap-2">
                    <MessageCircle class="h-4 w-4" /> Yorumlar
                </Button>
                <Button variant="outline" size="sm" class="gap-2" onclick={() => navigator.share ? navigator.share({ url: location.href, title: article.title }) : navigator.clipboard.writeText(location.href)}>
                    <Share2 class="h-4 w-4" /> Paylaş
                </Button>
                -->
            </div>

            <!-- Article content -->
            <div class="prose prose-lg max-w-none">
                {#if typeof article.content === 'string'}
                    {@html article.content}
                {:else}
                    <div class="rounded-md border">
                        <EdraEditor content={article.content} editable={false} class="py-6 px-6" />
                    </div>
                {/if}
            </div>

            <!-- Article tags -->
            {#if article.tags && article.tags.length > 0}
                <div class="mt-12 pt-8 border-t">
                    <h3 class="text-sm font-medium text-muted-foreground mb-3">Etiketler</h3>
                    <div class="flex flex-wrap gap-2">
                        {#each article.tags as tag}
                            <Badge variant="outline">#{tag}</Badge>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Author info -->
            <div class="mt-12 pt-8 border-t">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User class="w-8 h-8" />
                    </div>
                    <div>
                        <h3 class="font-semibold">
                            {article.author.name && article.author.surname 
                                ? `${article.author.name} ${article.author.surname}`
                                : article.author.nickname}
                        </h3>
                        <p class="text-sm text-muted-foreground">@{article.author.nickname}</p>
                    </div>
                </div>
            </div>
        </article>
    {/if}
</main>

<Footer />
