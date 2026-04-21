<script lang="ts">
    import { page } from '$app/stores';
    import { goto, beforeNavigate } from '$app/navigation';
    import { onMount, tick } from 'svelte';

    // Reset reaction state when navigating away - keep each page independent
    beforeNavigate(() => {
        reaction = null;
    });

    // Edra Editor
    import { EdraEditor, EdraToolBar } from '$lib/components/edra/shadcn/index.js';
    import { nanoid } from 'nanoid';

    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Label } from '$lib/components/ui/label';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Accordion from '$lib/components/ui/accordion';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import ReportDrawer from '$lib/components/ReportDrawer.svelte';
    import { showToast } from '$lib/hooks/toast';
    import { t } from '$lib/stores/i18n.svelte.js';
    import {
        ThumbsUp,
        ThumbsDown,
        Award,
        Clock,
        Eye,
        Share2,
        MessageCircle,
        ChevronLeft,
        ChevronRight,
        MoreVertical,
        Flag,
        CheckCircle,
        X,
        Pencil,
        Trash2,
        Send,
        Loader2
    } from '@lucide/svelte';
    import { cn } from '$lib/utils';
    
    let { data } = $props();
    
    // Get current lang from page store
    let lang = $derived($page.params.lang || 'tr');
    
    // Use $derived for values from data (reactive to data changes)
    let question = $derived(data.question);
    let answers = $derived(data.answers || []);
    let user = $derived(data.user);
    let isModerator = $derived(data.isModerator || false);
    
    // Like/Dislike state (similar to article page)
    let likesCount = $state<number>(Number(data.question?.likeCount) || 0);
    let dislikesCount = $state<number>(Number(data.question?.dislikeCount) || 0);
    let reaction = $state<'like' | 'dislike' | null>(data.userReaction || null);
    let viewCount = $state(data.question?.viewCount || 0);
    let hasViewed = $state(false);
    
    // Dialog states
    let reportDrawerOpen = $state(false);
    let shareAlertOpen = $state(false);

    // Inline answer form state (matching qa/+page.svelte)
    let showAnswerForm = $state(false);
    let answerContent = $state({ type: 'doc', content: [{ type: 'paragraph' }] }); // Edra editor JSON content
    let answerEditor = $state<any>(null); // Edra editor instance
    let answerCharCount = $state(0); // Character count for answer editor
    let isSubmittingAnswer = $state(false);
    let editingAnswerId: string | null = $state(null);
    let publishImmediately = $state(true);

    // Character limit for answer Edra editor (links count as 1 character)
    const ANSWER_CHAR_LIMIT = 1000;

    // Calculate character count where each link counts as 1 character
    function calculateCharCount(content: any): number {
        if (!content || !content.content) return 0;

        let count = 0;
        let inLink = false;

        function traverseNode(node: any) {
            if (node.type === 'text') {
                // Check if this text node has a link mark
                const hasLinkMark = node.marks?.some((m: any) => m.type === 'link');

                if (hasLinkMark) {
                    if (!inLink) {
                        // First text node with link mark - count as 1
                        count += 1;
                        inLink = true;
                    }
                    // Subsequent linked text nodes don't add to count
                } else {
                    // Normal text - add full length
                    inLink = false;
                    count += node.text?.length || 0;
                }
            } else if (node.content && Array.isArray(node.content)) {
                // Reset inLink when entering a new container
                const wasInLink = inLink;
                node.content.forEach(traverseNode);
                inLink = wasInLink;
            }
        }

        content.content.forEach(traverseNode);
        return count;
    }

    // Image modal state
    let imageModalOpen = $state(false);
    let selectedImage = $state<string>('');
    let currentQuestionImages = $state<string[]>([]);
    let currentImageIndex = $state(0);

    // Answer reactions state
    let answerReactions = $state<Record<string, 'like' | 'dislike' | null>>({});
    let answerLikesCount = $state<Record<string, number>>({});
    let answerDislikesCount = $state<Record<string, number>>({});

    // Open inline answer form (matching qa/+page.svelte pattern)
    function openAnswerForm(answerId?: string) {
        if (answerId) {
            // Editing existing answer
            const answer = answers.find((a: any) => a.id === answerId);
            if (answer) {
                editingAnswerId = answerId;
                // Handle edra editor content format
                if (answer.content && typeof answer.content === 'object' && answer.content.type === 'doc') {
                    answerContent = answer.content;
                } else if (answer.contentHtml) {
                    // Convert HTML to plain text for the editor
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = answer.contentHtml;
                    const text = tempDiv.textContent || tempDiv.innerText || '';
                    answerContent = { type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] };
                } else {
                    answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
                }
            }
        } else {
            // New answer mode
            editingAnswerId = null;
            answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
        }
        showAnswerForm = true;
    }

    function cancelAnswerForm() {
        showAnswerForm = false;
        editingAnswerId = null;
        answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
        answerEditor = null;
    }

    // Answer handler (inline form - matching qa/+page.svelte)
    async function submitAnswer(answerId?: string) {
        // Get content from the Edra editor
        const editor = answerEditor;
        if (!editor) {
            showToast('Editör yüklenemedi', 'error');
            return;
        }

        const json = editor.getJSON();

        // Check if content is empty (only has empty paragraphs)
        const hasContent = json.content?.some((node: any) => {
            if (node.type === 'paragraph') {
                return node.content && node.content.length > 0;
            }
            return true;
        });

        if (!hasContent) {
            showToast('Cevap içeriği gerekli', 'error');
            return;
        }

        if (!question?.id) return;

        isSubmittingAnswer = true;
        try {
            const isEditing = !!(answerId || editingAnswerId);
            const targetAnswerId = answerId || editingAnswerId;

            const response = await fetch('/api/qa/answer', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    content: json,
                    contentHtml: editor.getHTML(),
                    publishImmediately,
                    ...(isEditing && { answerId: targetAnswerId })
                })
            });

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || (targetAnswerId ? 'Cevap güncellendi' : 'Cevap gönderildi'), 'success');
                // Reset form
                showAnswerForm = false;
                editingAnswerId = null;
                answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
                answerEditor = null;
                // Refresh page to show new/updated answer
                window.location.reload();
            } else {
                const error = await response.json();
                showToast(error.error || 'Cevap gönderilirken hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Cevap gönderilirken hata oluştu', 'error');
        } finally {
            isSubmittingAnswer = false;
        }
    }

    // Image modal functions
    function openImageModal(images: string[], index: number) {
        currentQuestionImages = images;
        currentImageIndex = index;
        selectedImage = images[index];
        imageModalOpen = true;
    }

    function closeImageModal() {
        imageModalOpen = false;
        selectedImage = '';
    }

    function nextImage() {
        if (currentImageIndex < currentQuestionImages.length - 1) {
            currentImageIndex++;
            selectedImage = currentQuestionImages[currentImageIndex];
        }
    }

    function prevImage() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            selectedImage = currentQuestionImages[currentImageIndex];
        }
    }

    function handleImageKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeImageModal();
        } else if (event.key === 'ArrowRight') {
            nextImage();
        } else if (event.key === 'ArrowLeft') {
            prevImage();
        }
    }

    // Extract images from HTML content
    function extractImagesFromHtml(html: string): string[] {
        if (!html) return [];
        const matches = html.matchAll(/<img[^>]+src="([^"]+)"/gi);
        return Array.from(matches).map(m => m[1]);
    }

    // Setup image click handlers for content HTML
    function setupImageClickHandlers() {
        if (typeof document === 'undefined') return;

        // Find all prose containers (question and answer bodies)
        const proseContainers = document.querySelectorAll('.prose');

        proseContainers.forEach(container => {
            const images = container.querySelectorAll('img');
            const imageUrls = Array.from(images).map(img => img.src);

            images.forEach((img, index) => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    openImageModal(imageUrls, index);
                });
            });
        });
    }

    // Track last question ID to only reset on navigation
    let lastQuestionId = $state<string | null>(null);

    // Reset local state only when question ID changes (page navigation)
    $effect(() => {
        const currentQuestionId = data.question?.id;
        if (currentQuestionId && currentQuestionId !== lastQuestionId) {
            lastQuestionId = currentQuestionId;
            likesCount = Number(data.question?.likeCount) || 0;
            dislikesCount = Number(data.question?.dislikeCount) || 0;
            reaction = data.userReaction || null;
            viewCount = data.question?.viewCount || 0;
            hasViewed = false;
        }

        // Setup image click handlers after content renders
        tick().then(() => {
            setupImageClickHandlers();
        });
    });

    // Format date
    function formatDate(date: string) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format relative time
    function formatRelativeTime(date: string) {
        if (!date) return '';
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'şimdi';
        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 30) return `${days} gün önce`;
        return formatDate(date);
    }

    // Like/Dislike handler for question
    async function toggleReaction(type: 'like' | 'dislike') {
        if (!user) {
            showToast(t('LoginRequiredForReactions'), 'error');
            return;
        }

        if (!question?.id) return;

        const currentReaction = reaction;
        const newReaction: 'like' | 'dislike' | null = reaction === type ? null : type;

        // Optimistic UI update
        if (reaction === 'like') likesCount--;
        if (reaction === 'dislike') dislikesCount--;
        if (newReaction === 'like') likesCount++;
        if (newReaction === 'dislike') dislikesCount++;
        reaction = newReaction;

        try {
            const res = await fetch(`/api/qa/${question.id}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: newReaction })
            });

            if (!res.ok) {
                // Revert on error
                reaction = currentReaction;
                if (newReaction === 'like') likesCount--;
                if (newReaction === 'dislike') dislikesCount--;
                if (currentReaction === 'like') likesCount++;
                if (currentReaction === 'dislike') dislikesCount++;
                showToast(t('qa.reactionError'), 'error');
                return;
            }

            const json = await res.json();

            if (json.reaction) {
                reaction = json.reaction;
            }
            if (json.stats) {
                likesCount = Number(json.stats.likes) || 0;
                dislikesCount = Number(json.stats.dislikes) || 0;
            }
        } catch (e) {
            // Revert on error
            reaction = currentReaction;
            if (newReaction === 'like') likesCount--;
            if (newReaction === 'dislike') dislikesCount--;
            if (currentReaction === 'like') likesCount++;
            if (currentReaction === 'dislike') dislikesCount++;
            console.error('Reaction error:', e);
            showToast(t('qa.reactionError'), 'error');
        }
    }

    // Delete question handler
    async function deleteQuestion() {
        if (!question?.id) return;
        if (!confirm('Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

        try {
            const response = await fetch(`/api/qa/id/${question.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('Soru silindi', 'success');
                goto(`/${lang}/qa`);
            } else {
                const error = await response.json();
                showToast(error.error || 'Soru silinirken hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Soru silinirken hata oluştu', 'error');
        }
    }

    // Delete answer handler
    async function deleteAnswer(answerId: string) {
        if (!confirm('Bu cevabı silmek istediğinizden emin misiniz?')) return;

        try {
            const response = await fetch(`/api/qa/answer/${answerId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('Cevap silindi', 'success');
                window.location.reload();
            } else {
                const error = await response.json();
                showToast(error.error || 'Cevap silinirken hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Cevap silinirken hata oluştu', 'error');
        }
    }

    // Initialize answer reactions from data
    $effect(() => {
        if (answers?.length > 0) {
            answers.forEach((answer: any) => {
                if (answer.id && !(answer.id in answerLikesCount)) {
                    answerLikesCount[answer.id] = Number(answer.likeCount) || 0;
                    answerDislikesCount[answer.id] = Number(answer.dislikeCount) || 0;
                }
            });
        }
    });

    // Like/Dislike handler for answers
    async function toggleAnswerReaction(answerId: string, type: 'like' | 'dislike') {
        if (!user) {
            showToast(t('LoginRequiredForReactions') || 'Beğenmek için giriş yapmalısınız', 'error');
            return;
        }

        const currentReaction = answerReactions[answerId] || null;
        const newReaction = currentReaction === type ? null : type;

        // Optimistic update
        answerReactions[answerId] = newReaction;
        if (currentReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) - 1;
        if (currentReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) - 1;
        if (newReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) + 1;
        if (newReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) + 1;

        try {
            const response = await fetch(`/api/qa/answer/${answerId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: newReaction })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.stats) {
                    answerLikesCount[answerId] = result.stats.likes;
                    answerDislikesCount[answerId] = result.stats.dislikes;
                }
            } else {
                // Revert on error
                answerReactions[answerId] = currentReaction;
                if (newReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) - 1;
                if (newReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) - 1;
                if (currentReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) + 1;
                if (currentReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) + 1;
                showToast(t('qa.reactionError') || 'İşlem başarısız', 'error');
            }
        } catch (error) {
            // Revert on error
            answerReactions[answerId] = currentReaction;
            if (newReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) - 1;
            if (newReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) - 1;
            if (currentReaction === 'like') answerLikesCount[answerId] = (answerLikesCount[answerId] || 0) + 1;
            if (currentReaction === 'dislike') answerDislikesCount[answerId] = (answerDislikesCount[answerId] || 0) + 1;
            showToast(t('qa.reactionError') || 'İşlem sırasında hata oluştu', 'error');
        }
    }

    // View tracking on mount
    onMount(() => {
        if (!hasViewed) {
            trackView();
        }
    });

    async function trackView() {
        try {
            const response = await fetch(`/api/qa/${question.slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const result = await response.json();
                viewCount = result.viewCount;
                hasViewed = true;
            }
        } catch (error) {
            console.error('View tracking error:', error);
        }
    }


    // Share handler using Web Share API with clipboard fallback
    async function shareQuestion() {
        const url = window.location.href;
        const title = question?.title || 'Soru';
        const text = `${title} - LAF Soru & Cevap`;

        // Try Web Share API first (mobile/desktop share sheet)
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url
                });
                return;
            } catch (err) {
                // User cancelled or share failed, continue to fallback
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            showToast(t('qa.linkCopied'), 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            // Last resort: show dialog with URL
            shareAlertOpen = true;
        }
    }

    // Report handler - opens ReportDrawer
    let reportTarget: { id: string; type: 'question' | 'answer' } | null = $state(null);
    function openReportDrawer(targetId?: string, targetType?: 'question' | 'answer') {
        if (!user) {
            goto(`/${lang}/login`);
            return;
        }
        reportTarget = targetId && targetType ? { id: targetId, type: targetType } : null;
        reportDrawerOpen = true;
    }

    function onReported() {
        showToast(t('qa.reportSubmitted'), 'success');
    }
</script>

<svelte:head>
    {#if question}
        {@const siteName = 'LAF - Libertarian Anarchist Foundation'}
        {@const siteUrl = 'https://laf.international'}
        {@const pageUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/qa/${question.slug || question.id}`}
        {@const ogImage = question.attachments?.[0] || `${siteUrl}/og-default.png`}
        {@const plainContent = question.contentHtml?.replace(/<[^>]*>/g, '') || ''}
        {@const description = plainContent.substring(0, 160) || question.title || ''}
        {@const authorName = question.author?.name && question.author?.surname
            ? `${question.author.name} ${question.author.surname}`
            : question.author?.nickname || 'LAF'}

        <title>{question.title} | {t('qa.title') || 'Q&A'}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />

        <!-- Open Graph -->
        <meta property="og:title" content={question.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={question.title} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {#if question.createdAt}
            <meta property="article:published_time" content={new Date(question.createdAt).toISOString()} />
        {/if}
        <meta property="article:author" content={authorName} />
        {#if question.category}
            <meta property="article:section" content={question.category} />
        {/if}
        {#if question.tags?.length}
            <meta property="article:tag" content={question.tags.join(', ')} />
        {/if}

        <!-- Twitter Cards -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@lafoundation" />
        <meta name="twitter:title" content={question.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={question.title} />

        <!-- Robots -->
        <meta name="robots" content="index, follow" />

        <!-- Structured Data -->
        {@html `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'QAPage',
            mainEntity: {
                '@type': 'Question',
                name: question.title,
                text: plainContent,
                url: pageUrl,
                datePublished: question.createdAt ? new Date(question.createdAt).toISOString() : undefined,
                author: {
                    '@type': 'Person',
                    name: authorName,
                    url: question.author?.nickname ? `${siteUrl}/${question.author.nickname}` : undefined
                },
                answerCount: answers?.length || 0,
                ...(answers?.length > 0 ? {
                    acceptedAnswer: answers.find((a: any) => a.isAccepted) ? {
                        '@type': 'Answer',
                        text: answers.find((a: any) => a.isAccepted)?.contentHtml?.replace(/<[^>]*>/g, '').substring(0, 200),
                        url: `${pageUrl}#answer-${answers.find((a: any) => a.isAccepted)?.id}`,
                        author: {
                            '@type': 'Person',
                            name: answers.find((a: any) => a.isAccepted)?.author?.nickname || 'LAF'
                        },
                        datePublished: answers.find((a: any) => a.isAccepted)?.createdAt
                            ? new Date(answers.find((a: any) => a.isAccepted)!.createdAt).toISOString()
                            : undefined
                    } : undefined
                } : {})
            }
        })}</script>`}

        <!-- Breadcrumbs -->
        {@html `<script type="application/ld+json">${JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: t('seo.homeTab') || 'Home',
                    item: siteUrl
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: t('qa.title') || 'Q&A',
                    item: `${siteUrl}/qa`
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: question.title?.substring(0, 50) || 'Soru',
                    item: pageUrl
                }
            ]
        })}</script>`}
    {:else}
        <title>{t('qa.title') || 'Q&A'}</title>
        <meta name="description" content={t('qa.description') || 'Sorular ve cevaplar'} />
        <meta name="robots" content="noindex, nofollow" />
    {/if}
</svelte:head>

<div class="min-h-screen bg-background">
    <div class="container mx-auto max-w-4xl px-4 py-8">
        <!-- Report Drawer -->
        <ReportDrawer
            bind:open={reportDrawerOpen}
            reportType="qa"
            targetId={reportTarget?.id || question.id}
            targetTitle={question.title}
            targetUrl={typeof window !== 'undefined' ? window.location.href : ''}
            {onReported}
        />

        <!-- Share Alert Dialog -->
        <AlertDialog.Root bind:open={shareAlertOpen}>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>{t('qa.shareTitle')}</AlertDialog.Title>
                    <AlertDialog.Description>
                        {t('qa.shareDescription')}
                    </AlertDialog.Description>
                </AlertDialog.Header>
                <div class="bg-muted p-3 rounded-md break-all text-sm mt-4">
                    {typeof window !== 'undefined' ? window.location.href : ''}
                </div>
                <AlertDialog.Footer class="mt-4">
                    <AlertDialog.Action onclick={() => shareAlertOpen = false}>
                        {t('common.ok')}
                    </AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Root>

        <!-- Back Button -->
        <Button variant="ghost" class="mb-4 gap-2" onclick={() => goto(`/${lang}/qa`)}>
            <ChevronLeft class="w-4 h-4" />
            Tüm Sorular
        </Button>

        <!-- Question Card -->
        <div class="bg-card border rounded-lg shadow-sm mb-6">
            <!-- Question Header -->
            <div class="p-6 border-b">
                <!-- Topic Badge -->
                {#if question.topic}
                    <Badge variant="outline" class="mb-3 h-5 text-xs px-1.5">
                        {question.topic.name}
                    </Badge>
                {/if}

                <!-- Title -->
                <h1 class="text-2xl font-bold mb-4">{question.title}</h1>

                <!-- Author Info -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        {#if question.isAnonymous}
                            <Avatar.Root class="h-8 w-8">
                                <Avatar.Fallback class="text-xs">?</Avatar.Fallback>
                            </Avatar.Root>
                            <div class="flex flex-col">
                                <span class="text-sm font-medium">Anonim</span>
                                <span class="text-xs text-muted-foreground">
                                    {formatRelativeTime(question.createdAt)}
                                </span>
                            </div>
                        {:else}
                            {@const questionAuthorSlug = question.author?.username || question.author?.nickname}
                            <a href="/{lang}/{questionAuthorSlug}" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <Avatar.Root class="h-8 w-8">
                                    {#if question.author?.avatar}
                                        <Avatar.Image src={question.author.avatar} alt={question.authorName || 'Kullanıcı'} />
                                    {/if}
                                    <Avatar.Fallback class="text-xs">
                                        {(question.authorName?.[0] || 'U').toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium hover:text-primary transition-colors">
                                        {question.authorName || 'İsimsiz'}
                                    </span>
                                    <span class="text-xs text-muted-foreground">
                                        {formatRelativeTime(question.createdAt)}
                                    </span>
                                </div>
                            </a>
                        {/if}
                    </div>

                    <div class="flex items-center gap-2">
                        {#if question.status === 'published'}
                            <Badge variant="default" class="h-5 text-xs px-1.5 bg-green-500">
                                Yayında
                            </Badge>
                        {:else if question.status === 'pending'}
                            <Badge variant="secondary" class="h-5 text-xs px-1.5">
                                Bekliyor
                            </Badge>
                        {:else if question.status === 'answered'}
                            <Badge variant="outline" class="h-5 text-xs px-1.5">
                                Cevaplandı
                            </Badge>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Question Body -->
            <div class="p-6 overflow-hidden">
                <div class="prose prose-sm max-w-none dark:prose-invert break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:cursor-pointer">
                    {@html question.contentHtml}
                </div>
            </div>

            <!-- Question Actions -->
            <div class="px-6 py-4 border-t bg-muted/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <!-- Like Button -->
                        <Button
                            variant={reaction === 'like' ? 'default' : 'ghost'}
                            size="sm"
                            class={cn(
                                'h-8 gap-1 transition-all duration-200',
                                reaction === 'like' && 'bg-primary text-primary-foreground'
                            )}
                            onclick={() => toggleReaction('like')}
                        >
                            <ThumbsUp
                                class={cn(
                                    'h-4 w-4 transition-all duration-200',
                                    reaction === 'like' && 'fill-current'
                                )}
                            />
                            <span class={cn('max-w-12 w-4', reaction === 'like' && 'font-medium')}
                                >{likesCount}</span
                            >
                        </Button>

                        <!-- Dislike Button -->
                        <Button
                            variant={reaction === 'dislike' ? 'default' : 'ghost'}
                            size="sm"
                            class={cn(
                                'h-8 gap-1 transition-all duration-200',
                                reaction === 'dislike' &&
                                    'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                            )}
                            onclick={() => toggleReaction('dislike')}
                        >
                            <ThumbsDown
                                class={cn(
                                    'h-4 w-4 transition-all duration-200',
                                    reaction === 'dislike' && 'fill-current'
                                )}
                            />
                            <span class={cn('max-w-12 w-4', reaction === 'dislike' && 'font-medium')}
                                >{dislikesCount}</span
                            >
                        </Button>

                        <!-- View Count -->
                        <div class="flex items-center gap-1 text-muted-foreground text-sm">
                            <Eye class="w-4 h-4" />
                            {viewCount}
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <!-- Share Button -->
                        <Button variant="ghost" size="icon" onclick={shareQuestion}>
                            <Share2 class="w-4 h-4" />
                        </Button>

                        <!-- More Actions -->
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical class="w-4 h-4" />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                                {#if isModerator || (user && question.author?.id === user.id)}
                                    <DropdownMenu.Item onclick={() => goto(`/${lang}/qa/ask?edit=${question.id}`)}>
                                        <Pencil class="w-4 h-4 mr-2" />
                                        Düzenle
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item onclick={() => deleteQuestion()} class="text-destructive">
                                        <Trash2 class="w-4 h-4 mr-2" />
                                        Sil
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                {/if}
                                <DropdownMenu.Item onclick={shareQuestion}>
                                    <Share2 class="w-4 h-4 mr-2" />
                                    {t('common.share')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onclick={() => openReportDrawer(question.id, 'question')}>
                                    <Flag class="w-4 h-4 mr-2" />
                                    {t('common.report')}
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                </div>
            </div>
        </div>

        <!-- Answer Form (Inline - matching qa/+page.svelte) -->
        {#if user && showAnswerForm}
            <div class="bg-card border rounded-lg shadow-sm mb-6">
                <Accordion.Root type="single" value="answer-form">
                    <Accordion.Item value="answer-form" class="border-0">
                        <Accordion.Trigger class="py-3 px-4 hover:no-underline w-full justify-start gap-2 text-left [&[data-state=open]>svg]:rotate-180">
                            <span class="text-sm flex items-center gap-2 font-medium">
                                <MessageCircle class="w-4 h-4" />
                                {editingAnswerId ? 'Cevabı Düzenle' : 'Soruyu Cevapla'}
                            </span>
                        </Accordion.Trigger>
                        <Accordion.Content class="pb-0">
                            <div class="flex flex-col p-4">
                                <!-- Content Editor -->
                                <div class="border rounded-sm overflow-hidden bg-background">
                                    <EdraToolBar editor={answerEditor}/>
                                    <EdraEditor
                                        bind:editor={answerEditor}
                                        content={answerContent}
                                        onUpdate={() => {
                                            if (answerEditor) {
                                                const currentContent = answerEditor.getJSON();
                                                answerCharCount = calculateCharCount(currentContent);
                                                if (answerCharCount > ANSWER_CHAR_LIMIT) {
                                                    showToast(`Cevap içeriği ${ANSWER_CHAR_LIMIT} karakter limitini aşıyor (Linkler 1 harf sayılır)`, 'error');
                                                }
                                            }
                                        }}
                                        qaId={question.id}
                                        class="min-h-[120px] max-h-[250px] overflow-y-auto p-3 text-sm"
                                    />
                                    <div class="px-3 py-1 text-xs text-muted-foreground text-right border-t bg-muted/30">
                                        <span class={answerCharCount > ANSWER_CHAR_LIMIT ? 'text-red-500 font-medium' : ''}>
                                            {answerCharCount}/{ANSWER_CHAR_LIMIT} (linkler 1 harf)
                                        </span>
                                    </div>
                                </div>
                                
                                <!-- Publish Options (Moderators only) -->
                                {#if isModerator}
                                    <div class="flex items-center gap-2 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="publishImmediately" 
                                            bind:checked={publishImmediately}
                                            class="rounded border-gray-300"
                                        />
                                        <Label for="publishImmediately" class="cursor-pointer text-xs text-muted-foreground">
                                            Hemen yayınla
                                        </Label>
                                    </div>
                                {/if}
                                
                                <!-- Action Buttons -->
                                <div class="flex justify-end gap-2 pt-3">
                                    <Button 
                                        variant="ghost" 
                                        size="xs" 
                                        onclick={cancelAnswerForm}
                                    >
                                        İptal
                                    </Button>
                                    <Button 
                                        size="xs" 
                                        onclick={() => submitAnswer(editingAnswerId || undefined)}
                                        disabled={isSubmittingAnswer}
                                        class="gap-2"
                                    >
                                        {#if isSubmittingAnswer}
                                            <Loader2 class="w-4 h-4 animate-spin" />
                                            Gönderiliyor...
                                        {:else}
                                            <Send class="w-4 h-4" />
                                            {editingAnswerId ? 'Güncelle' : 'Cevapla'}
                                        {/if}
                                    </Button>
                                </div>
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            </div>
        {/if}

        <!-- Answers Section -->
        {#if answers.length > 0}
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold">
                        {answers.length} Cevap
                    </h2>
                    {#if user && !showAnswerForm}
                        <Button size="sm" variant="outline" onclick={() => openAnswerForm()} class="gap-2">
                            <MessageCircle class="w-4 h-4" />
                            Cevap Ver
                        </Button>
                    {/if}
                </div>
                
                {#each answers as answer (answer.id)}
                    <div class="bg-card border rounded-lg shadow-sm">
                        <!-- Answer Header -->
                        <div class="p-6 border-b bg-muted/30">
                            <div class="flex items-center gap-2 mb-2">
                                <Badge class="gap-1 bg-green-500 h-5 text-xs px-1.5">
                                    <Award class="w-3 h-3" />
                                    Cevap
                                </Badge>
                                {#if answer.isAccepted || question.acceptedAnswerId === answer.id}
                                    <Badge variant="outline" class="h-5 text-xs px-1.5 border-green-500 text-green-600">
                                        <CheckCircle class="w-3 h-3 mr-1" />
                                        Kabul Edildi
                                    </Badge>
                                {/if}
                            </div>

                            <!-- Answer Author -->
                            <div class="flex items-center gap-3">
                                <a href="/{lang}/{answer.author?.username || answer.author?.nickname}" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    <Avatar.Root class="h-8 w-8">
                                        {#if answer.author?.avatar}
                                            {@const displayName = answer.author?.name && answer.author?.surname
                                                ? `${answer.author.name} ${answer.author.surname}`
                                                : (answer.author?.nickname || answer.author?.username || 'İsimsiz')}
                                            <Avatar.Image src={answer.author.avatar} alt={displayName} />
                                        {/if}
                                        <Avatar.Fallback class="text-xs">
                                            {@const fallbackName = answer.author?.name && answer.author?.surname
                                                ? `${answer.author.name} ${answer.author.surname}`
                                                : (answer.author?.nickname || answer.author?.username || 'İsimsiz')}
                                            {fallbackName[0]?.toUpperCase() || 'U'}
                                        </Avatar.Fallback>
                                    </Avatar.Root>
                                    <div class="flex flex-col">
                                        <span class="text-sm font-medium hover:text-primary transition-colors">
                                            {#if answer.author?.name && answer.author?.surname}
                                                {answer.author.name} {answer.author.surname}
                                            {:else}
                                                {answer.author?.nickname || answer.author?.username || 'İsimsiz'}
                                            {/if}
                                        </span>
                                        <span class="text-xs text-muted-foreground">
                                            {formatRelativeTime(answer.createdAt)}
                                        </span>
                                    </div>
                                </a>

                                <!-- Answer Actions Dropdown -->
                                <div class="ml-auto">
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            {#snippet child({ props })}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    class="h-8 w-8 p-0"
                                                    {...props}
                                                >
                                                    <MoreVertical class="w-4 h-4" />
                                                </Button>
                                            {/snippet}
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            {#if isModerator || (user && answer.author?.id === user.id)}
                                                <DropdownMenu.Item onclick={() => openAnswerForm(answer.id)}>
                                                    <Pencil class="w-4 h-4 mr-2" />
                                                    Düzenle
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item onclick={() => deleteAnswer(answer.id)} class="text-destructive">
                                                    <Trash2 class="w-4 h-4 mr-2" />
                                                    Sil
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Separator />
                                            {/if}
                                            <DropdownMenu.Item onclick={() => openReportDrawer(answer.id, 'answer')}>
                                                <Flag class="w-4 h-4 mr-2" />
                                                Raporla
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>
                            </div>
                        </div>

                        <!-- Answer Body -->
                        <div class="p-6 overflow-hidden">
                            <div class="prose prose-sm max-w-none dark:prose-invert break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:cursor-pointer">
                                {@html answer.contentHtml}
                            </div>
                        </div>

                        <!-- Answer Actions -->
                        <div class="px-6 py-4 border-t bg-muted/50">
                            <div class="flex items-center gap-4">
                                <!-- Like Button -->
                                <Button
                                    variant={answerReactions[answer.id] === 'like' ? 'default' : 'ghost'}
                                    size="sm"
                                    class={cn(
                                        'h-8 gap-1 transition-all duration-200',
                                        answerReactions[answer.id] === 'like' && 'bg-primary text-primary-foreground'
                                    )}
                                    onclick={() => toggleAnswerReaction(answer.id, 'like')}
                                >
                                    <ThumbsUp
                                        class={cn(
                                            'h-4 w-4 transition-all duration-200',
                                            answerReactions[answer.id] === 'like' && 'fill-current'
                                        )}
                                    />
                                    <span class={cn('max-w-12 w-4', answerReactions[answer.id] === 'like' && 'font-medium')}
                                        >{answerLikesCount[answer.id] || 0}</span
                                    >
                                </Button>

                                <!-- Dislike Button -->
                                <Button
                                    variant={answerReactions[answer.id] === 'dislike' ? 'default' : 'ghost'}
                                    size="sm"
                                    class={cn(
                                        'h-8 gap-1 transition-all duration-200',
                                        answerReactions[answer.id] === 'dislike' &&
                                            'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                                    )}
                                    onclick={() => toggleAnswerReaction(answer.id, 'dislike')}
                                >
                                    <ThumbsDown
                                        class={cn(
                                            'h-4 w-4 transition-all duration-200',
                                            answerReactions[answer.id] === 'dislike' && 'fill-current'
                                        )}
                                    />
                                    <span class={cn('max-w-12 w-4', answerReactions[answer.id] === 'dislike' && 'font-medium')}
                                        >{answerDislikesCount[answer.id] || 0}</span
                                    >
                                </Button>
                            </div>
                        </div>

                    </div>
                {/each}
            </div>
        {:else}
            <!-- No Answer Yet -->
            <div class="bg-muted border rounded-lg p-8 text-center">
                <MessageCircle class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-semibold mb-2">Henüz Cevap Yok</h3>
                <p class="text-muted-foreground mb-4">
                    Bu soruya henüz cevap verilmemiş. İlk cevabı siz verin!
                </p>
                {#if user && !showAnswerForm}
                    <Button onclick={() => openAnswerForm()} class="gap-2">
                        <MessageCircle class="w-4 h-4" />
                        Cevap Ver
                    </Button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<!-- Image Modal -->
<Dialog.Root bind:open={imageModalOpen} onOpenChange={(open) => { if (!open) closeImageModal(); }}>
    <Dialog.Content
        class="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent"
        onkeydown={handleImageKeydown}
    >
        <div class="relative flex items-center justify-center w-full h-full">
            <!-- Close button -->
            <button
                type="button"
                onclick={closeImageModal}
                class="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Kapat"
            >
                <X class="w-5 h-5" />
            </button>

            <!-- Navigation buttons -->
            {#if currentQuestionImages.length > 1}
                <button
                    type="button"
                    onclick={prevImage}
                    disabled={currentImageIndex === 0}
                    class="absolute left-4 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                    aria-label="Önceki resim"
                >
                    <ChevronLeft class="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onclick={nextImage}
                    disabled={currentImageIndex === currentQuestionImages.length - 1}
                    class="absolute right-4 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                    aria-label="Sonraki resim"
                >
                    <ChevronRight class="w-6 h-6" />
                </button>
            {/if}

            <!-- Image -->
            <img
                src={selectedImage}
                alt="Büyük görüntü"
                class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />

            <!-- Image counter -->
            {#if currentQuestionImages.length > 1}
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {currentQuestionImages.length}
                </div>
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>
