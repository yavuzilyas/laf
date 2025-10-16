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
        Languages,
        ThumbsDown,
        ThumbsUp
    } from "@lucide/svelte";

    // Local state for like button
    let { data } = $props();
    let likesCount = $state<number>(data.article?.stats?.likes ?? 0);
    let dislikesCount = $state<number>(data.article?.stats?.dislikes ?? 0);
    let reaction = $state<'like' | 'dislike' | null>(null);
    
    // Comment system state
    let comments = $state<any[]>([]);
    let newComment = $state('');
    let replyingTo = $state<string | null>(null);
    let replyContent = $state('');
    let loadingComments = $state(false);


    async function toggleReaction(type: 'like' | 'dislike') {
    let newReaction: 'like' | 'dislike' | null = reaction === type ? null : type;

    try {
        const res = await fetch(`/api/articles/${data.article._id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: newReaction })
        });

        if (!res.ok) return;
        const json = await res.json();

        // Güncel state'i API’den veya lokal olarak ayarla
        reaction = json.reaction ?? newReaction;

        // Sayıları güncelle
        if (reaction === 'like') {
            likesCount += 1;
            if (json.previous === 'dislike') dislikesCount -= 1;
        } else if (reaction === 'dislike') {
            dislikesCount += 1;
            if (json.previous === 'like') likesCount -= 1;
        } else {
            // Nötr hale döndü
            if (json.previous === 'like') likesCount -= 1;
            if (json.previous === 'dislike') dislikesCount -= 1;
        }

    } catch (e) {
        console.error(e);
    }
}

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
    
    async function loadComments() {
        if (!article) return;
        loadingComments = true;
        try {
            const res = await fetch(`/api/articles/${article._id}/comments`);
            if (res.ok) {
                comments = await res.json();
            }
        } catch (e) {
            console.error('Failed to load comments:', e);
        } finally {
            loadingComments = false;
        }
    }
    
    async function postComment() {
        if (!newComment.trim() || !article) return;
        try {
            const res = await fetch(`/api/articles/${article._id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                const comment = await res.json();
                comments = [comment, ...comments];
                newComment = '';
            }
        } catch (e) {
            console.error('Failed to post comment:', e);
        }
    }
    
    async function postReply(parentId: string) {
        if (!replyContent.trim() || !article) return;
        try {
            const res = await fetch(`/api/articles/${article._id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: replyContent, parentId })
            });
            if (res.ok) {
                const reply = await res.json();
                const comment = comments.find(c => c.id === parentId);
                if (comment) {
                    comment.replies = [...(comment.replies || []), reply];
                }
                replyContent = '';
                replyingTo = null;
            }
        } catch (e) {
            console.error('Failed to post reply:', e);
        }
    }
    
    async function toggleCommentReaction(commentId: string, type: 'like' | 'dislike', isReply: boolean, parentId?: string) {
        try {
            const res = await fetch(`/api/comments/${commentId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: type })
            });
            if (res.ok) {
                await loadComments();
            }
        } catch (e) {
            console.error('Failed to react to comment:', e);
        }
    }
    
    function formatTimeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Az önce';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
        return date.toLocaleDateString('tr-TR');
    }
    
    // Load comments on mount
    $effect(() => {
        if (article) {
            loadComments();
        }
    });
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
            <Button size="xs" href="/articles">Makalelere Dön</Button>
        </div>
    {:else}
        <!-- Article content -->
        <article class="container mx-auto px-4 py-6 max-w-5xl">
            <!-- Back button -->
            <div class="mb-3 flex flex-row gap-2 justify-between items-center">
                <Button variant="ghost" size="xs" href="/articles" class="gap-2">
                    <ArrowLeft class="w-4 h-4" />
                    Makalelere Dön
                </Button>
                <div class="flex flex-row items-center gap-2">
                                <!-- Language switcher -->
                {#if article.availableTranslations}

                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                        <Languages class="w-4 h-4" /> Diller:
                    </span>
                    {#each Object.keys(article.availableTranslations) as lang}
                        <Button
                            size="xs"
                            variant={lang === article.language ? 'default' : 'outline'}
                            onclick={() => switchToLanguage(lang)}
                        >
                            {lang.toUpperCase()}
                        </Button>
                    {/each}
                {/if}
                </div>
            </div>

            <!-- Article header -->
            <header class="mb-8">
                <div class="mb-3 flex flex-row gap-3 items-center">
                <h1 class="text-2xl font-bold leading-tight">
                    {article.title}
                </h1>
              <div class="flex items-center gap-1">
                    <Badge variant="default">{article.category}</Badge>
                    <Badge variant="secondary">{article.subcategory}</Badge>
                </div>
                </div>
                {#if article.thumbnail}
                    <div class="mb-3 rounded-lg overflow-hidden">
                        <img 
                            src={article.thumbnail} 
                            alt={article.title} 
                            class="w-full h-auto max-h-[500px] object-cover"
                        />
                    </div>
                {/if}

                {#if article.excerpt}
                    <p class="text-lg text-secondary-foreground mb-3">
                        {article.excerpt}
                    </p>
                {/if}

                <!-- Article meta -->
                <div class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-3">
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
                <div class="flex items-center gap-3 text-sm text-muted-foreground">
                    <div class="flex items-center gap-1">
                        <Eye class="w-4 h-4" />
                        <span>{article.stats.views}</span>
                    </div>
                    <div>
                        <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
        onclick={() => toggleReaction('like')} 
    >
        <ThumbsUp class={reaction === 'like' ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
        <span>{likesCount}</span>
    </Button>

    <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
        onclick={() => toggleReaction('dislike')} 
    >
        <ThumbsDown class={reaction === 'dislike' ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
        <span>{dislikesCount}</span>
    </Button>
    </div>
                    <div class="flex items-center gap-1">
                        <MessageCircle class="w-4 h-4" />
                        <span>{article.stats.comments}</span>
                    </div>
                    
                    <Button variant="ghost" size="sm" class="ml-auto">
                        <Share2 class="w-4 h-4" />
                        Paylaş
                    </Button>


            </header>


            <!-- Article content -->
            <div class="prose prose-lg max-w-none">
                {#if typeof article.content === 'string'}
                    {@html article.content}
                {:else}
                    <div class="rounded-md ">
                        <EdraEditor content={article.content} editable={false} />
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

            <!-- Comments Section -->
            <div class="mt-12 pt-8 border-t">
                <h2 class="text-2xl font-bold mb-6">Yorumlar</h2>
                
                <!-- Comment Form -->
                <div class="mb-8">
                    <textarea 
                        bind:value={newComment}
                        class="w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        placeholder="Yorumunuzu yazın..."
                    ></textarea>
                    <div class="flex justify-end mt-2">
                        <Button onclick={postComment} disabled={!newComment.trim()}>Yorum Yap</Button>
                    </div>
                </div>

                <!-- Comments List -->
                <div class="space-y-6">
                    {#if loadingComments}
                        <div class="text-center py-8">
                            <p class="text-muted-foreground">Yorumlar yükleniyor...</p>
                        </div>
                    {:else if comments.length === 0}
                        <div class="text-center py-8">
                            <p class="text-muted-foreground">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                        </div>
                    {:else}
                        {#each comments as comment}
                            <div class="border rounded-lg p-4">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User class="w-5 h-5" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="font-medium">
                                                {comment.author?.name && comment.author?.surname 
                                                    ? `${comment.author.name} ${comment.author.surname}`
                                                    : comment.author?.nickname || 'Anonim'}
                                            </span>
                                            <span class="text-sm text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p class="text-sm mb-3">{comment.content}</p>
                                        <div class="flex items-center gap-4">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
                                                onclick={() => toggleCommentReaction(comment.id, 'like', false)}
                                            >
                                                <ThumbsUp class="w-3 h-3" />
                                                <span class="text-xs">{comment.likes || 0}</span>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
                                                onclick={() => toggleCommentReaction(comment.id, 'dislike', false)}
                                            >
                                                <ThumbsDown class="w-3 h-3" />
                                                <span class="text-xs">{comment.dislikes || 0}</span>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
                                                onclick={() => replyingTo = replyingTo === comment.id ? null : comment.id}
                                            >
                                                <MessageCircle class="w-3 h-3" />
                                                <span class="text-xs">Yanıtla</span>
                                            </Button>
                                        </div>

                                        <!-- Reply form -->
                                        {#if replyingTo === comment.id}
                                            <div class="mt-4">
                                                <textarea 
                                                    bind:value={replyContent}
                                                    class="w-full p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                    rows="3"
                                                    placeholder="Yanıtınızı yazın..."
                                                ></textarea>
                                                <div class="flex justify-end gap-2 mt-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onclick={() => { replyingTo = null; replyContent = ''; }}
                                                    >
                                                        İptal
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        onclick={() => postReply(comment.id)}
                                                        disabled={!replyContent.trim()}
                                                    >
                                                        Yanıtla
                                                    </Button>
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Nested replies -->
                                        {#if comment.replies && comment.replies.length > 0}
                                            <div class="mt-4 ml-6 space-y-4 border-l-2 pl-4">
                                                {#each comment.replies as reply}
                                                    <div class="flex items-start gap-3">
                                                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <User class="w-4 h-4" />
                                                        </div>
                                                        <div class="flex-1">
                                                            <div class="flex items-center gap-2 mb-1">
                                                                <span class="font-medium text-sm">
                                                                    {reply.author?.name && reply.author?.surname 
                                                                        ? `${reply.author.name} ${reply.author.surname}`
                                                                        : reply.author?.nickname || 'Anonim'}
                                                                </span>
                                                                <span class="text-xs text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                                                            </div>
                                                            <p class="text-sm mb-2">{reply.content}</p>
                                                            <div class="flex items-center gap-3">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    class="h-7 gap-1"
                                                                    onclick={() => toggleCommentReaction(reply.id, 'like', true, comment.id)}
                                                                >
                                                                    <ThumbsUp class="w-3 h-3" />
                                                                    <span class="text-xs">{reply.likes || 0}</span>
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    class="h-7 gap-1"
                                                                    onclick={() => toggleCommentReaction(reply.id, 'dislike', true, comment.id)}
                                                                >
                                                                    <ThumbsDown class="w-3 h-3" />
                                                                    <span class="text-xs">{reply.dislikes || 0}</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </article>
    {/if}
</main>

<Footer />
