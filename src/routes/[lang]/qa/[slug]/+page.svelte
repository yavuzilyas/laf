<script lang="ts">
    import { page } from '$app/stores';
    import { goto, beforeNavigate } from '$app/navigation';
    import { onMount, tick } from 'svelte';

    // Reset reaction state when navigating away - keep each page independent
    beforeNavigate(() => {
        reaction = null;
    });
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Textarea } from '$lib/components/ui/textarea';
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
        Image as ImageIcon,
        X,
        Pencil,
        Trash2
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
    let showAnswerDialog = $state(false);
    let answerContent = $state('');
    let isSubmittingAnswer = $state(false);
    let answerAttachments: {id: string, file: File, preview?: string}[] = $state([]);
    let answerFileInput: HTMLInputElement | null = $state(null);
    let editingAnswerId: string | null = $state(null);

    // Image modal state
    let imageModalOpen = $state(false);
    let selectedImage = $state<string>('');
    let currentQuestionImages = $state<string[]>([]);
    let currentImageIndex = $state(0);

    // Answer reactions state
    let answerReactions = $state<Record<string, 'like' | 'dislike' | null>>({});
    let answerLikesCount = $state<Record<string, number>>({});
    let answerDislikesCount = $state<Record<string, number>>({});

    // Answer handler (for moderators)
    async function submitAnswer() {
        if (!answerContent.trim()) {
            showToast('Cevap içeriği gerekli', 'error');
            return;
        }
        
        if (!question?.id) return;
        
        // Convert newlines to HTML
        const contentHtml = answerContent.replace(/\n/g, '<br>');
        
        // Process attachments
        let finalContentHtml = contentHtml;
        if (answerAttachments.length > 0) {
            const attachmentHtml = answerAttachments
                .map(a => `<br><img src="${a.preview}" style="max-width:100%;height:auto;" /><br>`)
                .join('');
            finalContentHtml += attachmentHtml;
        }
        
        isSubmittingAnswer = true;
        try {
            const isEditing = !!editingAnswerId;
            const response = await fetch('/api/qa/answer', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    content: { text: answerContent },
                    contentHtml: finalContentHtml,
                    // Attachments are already embedded in contentHtml, don't send separately to avoid duplication
                    publishImmediately: true,
                    ...(isEditing && { answerId: editingAnswerId })
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                showToast(result.message || (editingAnswerId ? 'Cevap güncellendi' : 'Cevap gönderildi'), 'success');
                closeAnswerDialog();
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
    
    // Extract images from HTML and convert to attachments format
    function extractImagesToAttachments(html: string): {id: string, file: File, preview: string}[] {
        if (!html) return [];
        const matches = html.matchAll(/<img[^>]+src="([^"]+)"/gi);
        const images = Array.from(matches).map(m => m[1]);

        return images.map((src, index) => ({
            id: crypto.randomUUID(),
            file: new File([], `existing-image-${index}.jpg`, { type: 'image/jpeg' }),
            preview: src
        }));
    }

    function openAnswerDialog(answerId?: string) {
        if (answerId) {
            // Editing existing answer
            const answer = answers.find((a: any) => a.id === answerId);
            if (answer) {
                editingAnswerId = answerId;
                answerContent = answer.content?.text || '';
                // Extract images from contentHtml and load as attachments
                answerAttachments = extractImagesToAttachments(answer.contentHtml || '');
            }
        } else {
            // New answer
            editingAnswerId = null;
            answerContent = '';
            answerAttachments = [];
        }
        if (answerFileInput) answerFileInput.value = '';
        showAnswerDialog = true;
    }

    function closeAnswerDialog() {
        showAnswerDialog = false;
        editingAnswerId = null;
        answerContent = '';
        answerAttachments = [];
        if (answerFileInput) answerFileInput.value = '';
    }
    
    // File upload handlers
    function handleAnswerFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const files = Array.from(input.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        answerAttachments = [...answerAttachments, {
                            id: crypto.randomUUID(),
                            file,
                            preview: e.target?.result as string
                        }];
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    
    function removeAnswerAttachment(id: string) {
        answerAttachments = answerAttachments.filter(a => a.id !== id);
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

    // Reset local state when data changes (page navigation)
    $effect(() => {
        likesCount = Number(data.question?.likeCount) || 0;
        dislikesCount = Number(data.question?.dislikeCount) || 0;
        reaction = data.userReaction || null;
        viewCount = data.question?.viewCount || 0;
        hasViewed = false;

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

        let newReaction: 'like' | 'dislike' | null = reaction === type ? null : type;

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
            console.error('Reaction error:', e);
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
    <title>{question.title} | Q&A</title>
    <meta name="description" content={question.contentHtml?.replace(/<[^>]*>/g, '').substring(0, 150)} />
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

        <!-- Answer Dialog (Logged-in Users) -->
        {#if user}
            <Dialog.Root open={showAnswerDialog} onOpenChange={(open) => {
                showAnswerDialog = open;
                if (!open) {
                    answerContent = '';
                    answerAttachments = [];
                    if (answerFileInput) answerFileInput.value = '';
                }
            }}>
                <Dialog.Content class="sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <Dialog.Header>
                        <Dialog.Title>
                            {question?.answer?.id ? 'Cevabı Düzenle' : 'Soruyu Cevapla'}
                        </Dialog.Title>
                        <Dialog.Description>
                            {question?.title}
                        </Dialog.Description>
                    </Dialog.Header>

                    <ScrollArea class="flex-1 my-4">
                        <div class="px-1 space-y-4">
                            <Textarea
                                bind:value={answerContent}
                                placeholder="Cevabınızı yazın..."
                                class="min-h-[200px] resize-none"
                            />
                            
                            <!-- Attachment Upload -->
                            <div class="space-y-2">
                                <input
                                    bind:this={answerFileInput}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    class="hidden"
                                    onchange={handleAnswerFileSelect}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    class="gap-2"
                                    onclick={() => answerFileInput?.click()}
                                >
                                    <ImageIcon class="w-4 h-4" />
                                    Resim Ekle
                                </Button>
                                
                                <!-- Attachment Previews -->
                                {#if answerAttachments.length > 0}
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        {#each answerAttachments as attachment (attachment.id)}
                                            <div class="relative group">
                                                <img
                                                    src={attachment.preview}
                                                    alt="Attachment"
                                                    class="w-1/3 h-auto object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onclick={() => removeAnswerAttachment(attachment.id)}
                                                    class="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </ScrollArea>

                    <Dialog.Footer class="mt-4">
                        <Button size="sm" variant="outline" onclick={() => showAnswerDialog = false}>İptal</Button>
                        <Button size="sm" onclick={submitAnswer} disabled={isSubmittingAnswer} class="gap-2">
                            {#if isSubmittingAnswer}
                                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                Gönderiliyor...
                            {:else}
                                <MessageCircle class="w-4 h-4" />
                                {question?.answer?.id ? 'Güncelle' : 'Cevapla'}
                            {/if}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        {/if}

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
                        <Avatar.Root class="h-8 w-8">
                            {#if question.author?.avatar}
                                <Avatar.Image src={question.author.avatar} alt={question.authorName || 'Anonim'} />
                            {/if}
                            <Avatar.Fallback class="text-xs">
                                {question.isAnonymous ? '?' : (question.authorName?.[0] || 'U')}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div class="flex flex-col">
                            <span class="text-sm font-medium">
                                {question.isAnonymous ? 'Anonim' : (question.authorName || 'İsimsiz')}
                            </span>
                            <span class="text-xs text-muted-foreground">
                                {formatRelativeTime(question.createdAt)}
                            </span>
                        </div>
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
            <div class="p-6">
                <div class="prose prose-sm max-w-none dark:prose-invert w-1/2 md:w-1/3  h-auto rounded-md prose-img:rounded-lg prose-img:cursor-pointer">
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
                            <DropdownMenu.Trigger>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical class="w-4 h-4" />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
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

        <!-- Answers Section -->
        {#if answers.length > 0}
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold">
                        {answers.length} Cevap
                    </h2>
                    {#if user}
                        <Button size="sm" variant="outline" onclick={() => openAnswerDialog()} class="gap-2">
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
                                <Avatar.Root class="h-8 w-8">
                                    {#if answer.author?.avatar}
                                        <Avatar.Image src={answer.author.avatar} alt={answer.author.nickname || 'Moderatör'} />
                                    {/if}
                                    <Avatar.Fallback class="text-xs">
                                        {answer.author?.nickname?.[0] || 'M'}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium">
                                        {answer.author?.nickname || 'Moderatör'}
                                    </span>
                                    <span class="text-xs text-muted-foreground">
                                        {formatRelativeTime(answer.createdAt)}
                                    </span>
                                </div>

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
                                                <DropdownMenu.Item onclick={() => openAnswerDialog(answer.id)}>
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
                        <div class="p-6">
                            <div class="prose prose-sm max-w-none dark:prose-invert prose-img:max-w-xs prose-img:max-h-64 prose-img:rounded-lg prose-img:cursor-pointer">
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
                {#if user}
                    <Button onclick={() => openAnswerDialog()} class="gap-2">
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
