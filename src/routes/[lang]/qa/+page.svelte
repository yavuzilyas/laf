<script lang="ts">
    import Navbar from '$lib/Navbar.svelte';
    import Footer from '$lib/Footer.svelte';
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';
    import { showToast } from '$lib/hooks/toast';
    import { page } from '$app/stores';
    import { beforeNavigate, goto } from '$app/navigation';
    import { untrack } from 'svelte';
    import logoqa from '$lib/assets/Sorularla-ancap.svg';

    // Reset reactions when navigating away - keep each page independent
    beforeNavigate(() => {
        userReactions = {};
    });
    // Split server-loaded questions by status for moderator tabs
    $effect(() => {
        if (isModerator && questions.length > 0) {
            pendingQuestions = questions.filter((q: any) => q.status === 'pending');
            answeredQuestions = questions.filter((q: any) => q.status === 'answered');
            rejectedQuestions = questions.filter((q: any) => q.status === 'rejected');
        }
    });
    // File upload
    import { Upload, X, Image as ImageIcon } from '@lucide/svelte';
   
    
    // shadcn components
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import * as Select from '$lib/components/ui/select';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { Separator } from '$lib/components/ui/separator';
    import * as Accordion from '$lib/components/ui/accordion';
    import * as Tabs from '$lib/components/ui/tabs/index.js';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import ReportDrawer from '$lib/components/ReportDrawer.svelte';
    import QASearch from '$lib/components/QASearch.svelte';
    import QAFilterPopover from '$lib/components/QAFilterPopover.svelte';
    import { cn } from '$lib/utils';
    import { replaceState } from '$app/navigation';
    import { browser } from '$app/environment';
    import A from '$lib/components/ui/a.svelte';
    
    
    // Icons
    import {
        MessageCircle,
        HelpCircle,
        Send,
        User,
        Clock,
        CheckCircle,
        XCircle,
        AlertCircle,
        Filter,
        Search,
        Loader2,
        Eye,
        Trash2,
        ThumbsUp,
        ThumbsDown,
        Bookmark,
        TrendingUp,
        Award,
        Eye as ViewIcon,
        Pencil,
        MoreVertical,
        Crown,
        ArrowRight,
        SlidersHorizontal,
        ChevronLeft,
        ChevronRight,
        Share2,
        Flag
    } from '@lucide/svelte';
    
    // Share function for questions
    async function shareQuestion(question: any) {
        const url = `${window.location.origin}/${lang}/qa/${question.slug}`;
        const title = question.title || 'Soru';
        const text = `${title} - LAF Soru & Cevap`;

        // Try Web Share API first
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link kopyalandı', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('Link kopyalanamadı', 'error');
        }
    }

    // Report functions
    function openReportDrawer(question: any) {
        if (!user) {
            showToast(t('LoginRequiredForReport') || 'Bildirmek için giriş yapmalısınız', 'error');
            return;
        }
        reportTargetQuestion = question;
        reportDrawerOpen = true;
    }

    function onQuestionReported() {
        showToast(t('qa.reportSubmitted') || 'Bildiriminiz alındı', 'success');
        reportTargetQuestion = null;
    }


    // Utility function to strip HTML and truncate text (preserves line breaks)
    function stripHtmlAndTruncate(html: string, maxLength: number): string {
        if (!html) return '';
        // Convert <br>, <p>, <div> to newlines first
        let text = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n');
        // Remove remaining HTML tags
        text = text.replace(/<[^>]*>/g, ' ');
        // Normalize spaces but preserve newlines
        text = text.replace(/[ \t]+/g, ' ').trim();
        // Truncate
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Extract image URLs from HTML content (safe implementation to prevent stack overflow)
    function extractImagesFromHtml(html: string): string[] {
        if (!html || html.length > 1000000) return []; // Limit for safety
        const images: string[] = [];
        const regex = /<img[^>]+src="([^"]+)"/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            images.push(match[1]);
            // Prevent infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }
        return images;
    }

    let { data } = $props();

    // SEO - Use page store for consistent server/client URL
    const siteUrl = 'https://laf.international';
    let lang = $derived($page.params.lang || 'tr');
    const currentLocale = $derived(getCurrentLocale() || 'tr');
    const seoTitle = $derived(`${t('seo.qa.title')} | LAF`);
    const seoDescription = $derived(t('seo.qa.description') || 'LAF Soru & Cevap platformunda anarşizm ve liberteryenizm hakkında sorular sorun.');
    // Use static URL to avoid hydration mismatch - page.url.pathname is consistent between server/client
    const canonicalUrl = $derived(`${siteUrl}/${lang}/qa`);
    let topics = $state(data.topics || []);
    let questions = $state(data.questions || []);
    let pagination = $state(data.pagination);
    let isModerator = $state(data.isModerator);
    let user = $state(data.user);

    let activeTab = $state('all');
    let moderatorTab = $state('pending');

    // Question form state
    let showAskDialog = $state(false);
    let questionTitle = $state('');
    let questionTopicId = $state('');
    let questionAuthorName = $state('');
    let questionAuthorEmail = $state('');
    let isAnonymous = $state(false);
    let questionContent = $state('');
    let questionAttachments: {id: string, file: File, preview?: string}[] = $state([]);
    let isSubmitting = $state(false);
    let questionFileInput: HTMLInputElement | null = $state(null);
    let editingQuestion: any = $state(null); // Stores question being edited

    // Answer form state (moderators)
    let selectedQuestion: any = $state(null);
    let showAnswerDialog = $state(false);
    let answerContent = $state('');
    let answerAttachments: {id: string, file: File, preview?: string}[] = $state([]);
    let isAnswering = $state(false);
    let answerFileInput: HTMLInputElement | null = $state(null);
    let publishImmediately = $state(true);

    // Moderator pending questions
    let pendingQuestions = $state<any[]>([]);
    let answeredQuestions = $state<any[]>([]);
    let rejectedQuestions = $state<any[]>([]);
    let isLoadingModeratorData = $state(false);

    // Search and filter - client-side only (like Articles page)
    let searchQuery = $state('');
    let selectedTopicFilter = $state('');
    let sortBy = $state('newest'); // newest, popular, unanswered
    
    // Date range filter
    let dateRangeFilter = $state<any>(undefined);
    
    // Status filter (for moderators)
    let statusFilter = $state('');
    
    // Nickname filter (for question author)
    let nicknameFilter = $state('');
    
    // Following filter (show only followed users' questions)
    let onlyFollowingFilter = $state(false);
    
    // Filtered questions (client-side filtering)
    let filteredQuestions = $state<any[]>([]);
    
    // Initialize filtered questions when questions prop changes
    $effect(() => {
        filteredQuestions = [...questions];
        applyFiltersAndSearch();
    });
    
    // Clear all filters
    function clearAllFilters() {
        searchQuery = '';
        selectedTopicFilter = '';
        sortBy = 'newest';
        dateRangeFilter = undefined;
        statusFilter = '';
        nicknameFilter = '';
        onlyFollowingFilter = false;
        pagination.page = 1;
        applyFiltersAndSearch();
    }
    
    // Apply filters and search (client-side only like Articles page)
    function applyFiltersAndSearch() {
        let result = [...questions];
        
        // Apply search filter
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(q => {
                const titleMatch = (q.title || '').toLowerCase().includes(query);
                const contentMatch = (q.content?.text || '').toLowerCase().includes(query);
                return titleMatch || contentMatch;
            });
        }
        
        // Apply topic filter
        if (selectedTopicFilter) {
            result = result.filter(q => q.topic?.slug === selectedTopicFilter);
        }
        
        // Apply status filter (for moderators)
        if (statusFilter && isModerator) {
            result = result.filter(q => q.status === statusFilter);
        }
        
        // Apply date range filter
        // If only start date selected, treat it as a single day (00:00 to 23:59)
        // If both selected, treat as range
        if (dateRangeFilter && dateRangeFilter !== undefined && (dateRangeFilter.start || dateRangeFilter.end)) {
            let startDate: Date | null = null;
            let endDate: Date | null = null;
            
            if (dateRangeFilter.start) {
                startDate = new Date(dateRangeFilter.start);
                startDate.setHours(0, 0, 0, 0);
            }
            
            if (dateRangeFilter.end) {
                endDate = new Date(dateRangeFilter.end);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateRangeFilter.start && !dateRangeFilter.end) {
                // Single date selected - treat as full day
                endDate = new Date(dateRangeFilter.start);
                endDate.setHours(23, 59, 59, 999);
            }
            
            result = result.filter(q => {
                const qDate = new Date(q.createdAt);
                if (startDate && qDate < startDate) return false;
                if (endDate && qDate > endDate) return false;
                return true;
            });
        }
        
        // Apply nickname filter
        if (nicknameFilter && nicknameFilter.trim()) {
            const query = nicknameFilter.toLowerCase().trim();
            result = result.filter(q => {
                // Check both author object fields and direct authorName field
                const authorNickname = (q.author?.nickname || '').toLowerCase();
                const authorUsername = (q.author?.username || '').toLowerCase();
                const authorName = (q.authorName || '').toLowerCase();
                return authorNickname.includes(query) || 
                       authorUsername.includes(query) || 
                       authorName.includes(query);
            });
        }
        
        // Apply following filter
        if (onlyFollowingFilter && user) {
            result = result.filter(q => {
                // Check if user follows the question author
                const authorId = q.author?.id || q.authorId;
                return followedUsers[authorId] === true;
            });
        }
        
        // Apply sorting
        if (sortBy === 'newest') {
            result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'popular') {
            result = result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        } else if (sortBy === 'unanswered') {
            result = result.filter(q => !q.answer && q.status !== 'answered');
        }
        
        filteredQuestions = result;
        pagination.page = 1;
        pagination.total = result.length;
        pagination.totalPages = Math.ceil(result.length / pagination.limit);
    }
    
    // Handle sort change
    function handleSortChange(value: string) {
        sortBy = value;
        pagination.page = 1;
        handleTabClick(value);
        applyFiltersAndSearch();
    }
    
    // Reactive filter - auto apply when filters change
    $effect(() => {
        if (searchQuery !== undefined || selectedTopicFilter !== undefined || sortBy !== undefined || dateRangeFilter !== undefined || statusFilter !== undefined || nicknameFilter !== undefined || onlyFollowingFilter !== undefined) {
            applyFiltersAndSearch();
        }
    });
    
    // Load following list when filter is enabled
    $effect(() => {
        if (onlyFollowingFilter && user && Object.keys(followedUsers).length === 0) {
            loadUserFollowing();
        }
    });

    // User reactions cache (like/dislike)
    let userReactions = $state<Record<string, 'like' | 'dislike' | null>>({});
    let userFollows = $state<Record<string, boolean>>({});
    
    // User following cache (which users the current user follows)
    let followedUsers = $state<Record<string, boolean>>({});
    
    // Answer reactions cache (like/dislike for answers)
    let answerReactions = $state<Record<string, 'like' | 'dislike' | null>>({});
    let answerLikesCount = $state<Record<string, number>>({});
    let answerDislikesCount = $state<Record<string, number>>({});

    // Report drawer state
    let reportDrawerOpen = $state(false);
    let reportTargetQuestion: any = $state(null);

    // Preload cache for tabs (hover to load, click to show instantly)
    let preloadedData = $state<Record<string, {questions: any[], pagination: any}>>({});
    let isPreloading = $state<Record<string, boolean>>({});

    // Track expanded question for view counting
    let expandedQuestionId = $state<string | null>(null);

    // Delete confirmation dialog states
    let deleteDialogOpen = $state(false);
    let deleteTarget: { type: 'question' | 'answer'; questionId: string; answerId?: string } | null = $state(null);

    // Image modal state
    let imageModalOpen = $state(false);
    let selectedImage = $state<string>('');
    let currentQuestionImages = $state<string[]>([]);
    let currentImageIndex = $state(0);


    async function loadModeratorQuestions() {
        if (!isModerator) return;
        isLoadingModeratorData = true;
        try {
            // Fetch all questions for moderators (no status filter = all statuses)
            const response = await fetch('/api/qa?limit=100');
            if (response.ok) {
                const result = await response.json();
                pendingQuestions = result.questions.filter((q: any) => q.status === 'pending');
                answeredQuestions = result.questions.filter((q: any) => q.status === 'answered');
                rejectedQuestions = result.questions.filter((q: any) => q.status === 'rejected');
            }
        } catch (error) {
            console.error('Error loading moderator questions:', error);
        } finally {
            isLoadingModeratorData = false;
        }
    }

    // Load users that the current user follows
    async function loadUserFollowing() {
        if (!user) return;
        try {
            const response = await fetch(`/api/users/${user.id}/following`);
            if (response.ok) {
                const result = await response.json();
                // Build a map of followed user IDs
                const followingMap: Record<string, boolean> = {};
                result.users?.forEach((u: any) => {
                    followingMap[u.id] = true;
                });
                followedUsers = followingMap;
            }
        } catch (error) {
            console.error('Error loading following list:', error);
        }
    }

    // File upload handlers
    function handleQuestionFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const files = Array.from(input.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        questionAttachments = [...questionAttachments, {
                            id: crypto.randomUUID(),
                            file,
                            preview: e.target?.result as string
                        }];
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        input.value = '';
    }

    function removeQuestionAttachment(id: string) {
        questionAttachments = questionAttachments.filter(a => a.id !== id);
    }

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
        input.value = '';
    }

    function removeAnswerAttachment(id: string) {
        answerAttachments = answerAttachments.filter(a => a.id !== id);
    }

    function openEditQuestionDialog(question: any) {
        editingQuestion = question;
        questionTitle = question.title || '';
        questionContent = question.content?.text || question.contentHtml?.replace(/<br>/g, '\n') || '';
        questionTopicId = question.topic?.id || '';
        isAnonymous = question.isAnonymous || false;
        showAskDialog = true;
    }

    async function submitQuestion() {
        if (!questionTitle.trim() || questionTitle.trim().length < 5) {
            showToast('Başlık en az 5 karakter olmalıdır', 'error');
            return;
        }

        if (!questionContent.trim()) {
            showToast('Soru içeriği gerekli', 'error');
            return;
        }

        // Convert newlines to HTML
        const contentHtml = questionContent.replace(/\n/g, '<br>');

        isSubmitting = true;
        try {
            const isEditing = editingQuestion != null;
            const url = isEditing ? `/api/qa/id/${editingQuestion.id}` : '/api/qa';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: questionTitle.trim(),
                    content: { text: questionContent },
                    contentHtml,
                    attachments: questionAttachments.map(a => a.preview),
                    topicId: questionTopicId || null,
                    authorName: user ? user.username : questionAuthorName,
                    authorEmail: user ? user.nickname : questionAuthorEmail,
                    isAnonymous: !user || isAnonymous
                })
            });

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || (isEditing ? 'Soru güncellendi' : 'Sorunuz gönderildi'), 'success');
                
                questionTitle = '';
                questionTopicId = '';
                questionAuthorName = '';
                questionAuthorEmail = '';
                isAnonymous = false;
                questionContent = '';
                questionAttachments = [];
                editingQuestion = null;
                showAskDialog = false;

                if (isModerator) {
                    loadModeratorQuestions();
                }
                // Reload page to show updated content
                window.location.reload();
            } else {
                const error = await response.json();
                showToast(error.error || 'Soru gönderilirken hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Soru gönderilirken hata oluştu', 'error');
        } finally {
            isSubmitting = false;
        }
    }

    async function submitAnswer() {
        if (!selectedQuestion) {
            showToast('Cevap içeriği gerekli', 'error');
            return;
        }

        if (!answerContent.trim()) {
            showToast('Cevap içeriği gerekli', 'error');
            return;
        }

        // Convert newlines to HTML
        const contentHtml = answerContent.replace(/\n/g, '<br>');

        // Check if editing existing answer
        const existingAnswerId = selectedQuestion?.answer?.id;
        const isEditing = !!existingAnswerId;

        isAnswering = true;
        try {
            const url = isEditing ? '/api/qa/answer' : '/api/qa/answer';
            const method = isEditing ? 'PUT' : 'POST';
            
            const requestBody: any = {
                content: { text: answerContent },
                contentHtml,
                attachments: answerAttachments.map(a => a.preview)
            };

            if (isEditing) {
                // PUT request for editing
                requestBody.answerId = existingAnswerId;
            } else {
                // POST request for new answer
                requestBody.questionId = selectedQuestion.id;
                requestBody.publishImmediately = publishImmediately;
            }
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || (isEditing ? 'Cevap güncellendi' : 'Cevap gönderildi'), 'success');
                
                selectedQuestion = null;
                showAnswerDialog = false;
                answerContent = '';
                answerAttachments = [];

                loadModeratorQuestions();
                refreshPublicQuestions();
            } else {
                const error = await response.json();
                showToast(error.error || 'Cevap gönderilirken hata oluştu', 'error');
            }
        } catch (error) {
            showToast('Cevap gönderilirken hata oluştu', 'error');
        } finally {
            isAnswering = false;
        }
    }

    async function moderateQuestion(questionId: string, action: 'publish' | 'reject' | 'unpublish', note?: string) {
        try {
            const response = await fetch('/api/qa/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId, action, note })
            });

            if (response.ok) {
                const result = await response.json();
                showToast(result.message, 'success');
                loadModeratorQuestions();
                refreshPublicQuestions();
            } else {
                const error = await response.json();
                showToast(error.error || 'İşlem başarısız', 'error');
            }
        } catch (error) {
            showToast('İşlem sırasında hata oluştu', 'error');
        }
    }

    function openDeleteDialog(type: 'question' | 'answer', questionId: string, answerId?: string) {
        deleteTarget = { type, questionId, answerId };
        deleteDialogOpen = true;
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        deleteDialogOpen = false;

        try {
            if (deleteTarget.type === 'question') {
                const response = await fetch(`/api/qa/moderate?id=${deleteTarget.questionId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showToast('Soru silindi', 'success');
                    loadModeratorQuestions();
                    refreshPublicQuestions();
                } else {
                    const error = await response.json();
                    showToast(error.error || 'Silme başarısız', 'error');
                }
            } else {
                // Delete answer
                const response = await fetch(`/api/qa/answer?answerId=${deleteTarget.answerId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showToast('Cevap silindi', 'success');
                    refreshPublicQuestions();
                } else {
                    const result = await response.json();
                    showToast(result.error || 'Cevap silinirken hata oluştu', 'error');
                }
            }
        } catch (error) {
            showToast('İşlem sırasında hata oluştu', 'error');
        }
        deleteTarget = null;
    }

    function cancelDelete() {
        deleteDialogOpen = false;
        deleteTarget = null;
    }

    async function refreshPublicQuestions() {
        try {
            const params = new URLSearchParams();
            if (selectedTopicFilter) params.append('topic', selectedTopicFilter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', pagination.page.toString());
            params.append('sort', sortBy);
            
            const response = await fetch(`/api/qa?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                questions = result.questions;
                pagination = {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages
                };
            }
        } catch (error) {
            console.error('Error refreshing questions:', error);
        }
    }
    
    // Remove specific filter
    function removeFilter(type: 'search' | 'topic') {
        if (type === 'search') searchQuery = '';
        if (type === 'topic') selectedTopicFilter = '';
        pagination.page = 1;
        applyFiltersAndSearch();
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

    // Preload questions for a specific tab (hover to load)
    async function preloadQuestions(sortValue: string) {
        // Don't preload if already preloading, already loaded, or current tab
        if (isPreloading[sortValue] || preloadedData[sortValue] || sortBy === sortValue) return;
        
        isPreloading[sortValue] = true;
        try {
            const params = new URLSearchParams();
            if (selectedTopicFilter) params.append('topic', selectedTopicFilter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', '1');
            params.append('sort', sortValue);
            
            const response = await fetch(`/api/qa?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                preloadedData[sortValue] = {
                    questions: result.questions,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages
                    }
                };
            }
        } catch (error) {
            console.error(`Error preloading ${sortValue} questions:`, error);
        } finally {
            isPreloading[sortValue] = false;
        }
    }

    // Handle tab click - use preloaded data if available
    function handleTabClick(sortValue: string) {
        sortBy = sortValue;
        pagination.page = 1;
        
        // Use preloaded data if available
        if (preloadedData[sortValue]) {
            questions = preloadedData[sortValue].questions;
            pagination = preloadedData[sortValue].pagination;
        } else {
            // Fallback to normal fetch
            refreshPublicQuestions();
        }
    }

    const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getCurrentLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

    function getStatusBadge(status: string) {
        switch (status) {
            case 'published':
                return { variant: 'default' as const, label: 'Yayında', icon: CheckCircle };
            case 'pending':
                return { variant: 'secondary' as const, label: 'Bekliyor', icon: Clock };
            case 'answered':
                return { variant: 'outline' as const, label: 'Cevaplandı', icon: CheckCircle };
            case 'rejected':
                return { variant: 'destructive' as const, label: 'Reddedildi', icon: XCircle };
            default:
                return { variant: 'outline' as const, label: status, icon: AlertCircle };
        }
    }

    function openAnswerDialog(question: any) {
        selectedQuestion = question;
        // Load existing answer content if editing
        if (question?.answer?.content?.text) {
            answerContent = question.answer.content.text;
        } else {
            answerContent = '';
        }
        showAnswerDialog = true;
    }

    function getDisplayQuestions() {
        if (moderatorTab === 'pending') return pendingQuestions;
        if (moderatorTab === 'rejected') return rejectedQuestions;
        return answeredQuestions;
    }

    // Load user reactions for questions
    async function loadUserReactions() {
        if (!user) return;
        // Get all visible questions for moderators (untrack to prevent reactive updates)
        const allVisible = untrack(() => isModerator 
            ? [...questions, ...pendingQuestions, ...answeredQuestions, ...rejectedQuestions]
            : questions);
        if (allVisible.length === 0) return;
        
        try {
            // Load reactions for all visible questions (remove duplicates)
            const seen = new Set<string>();
            const reactions: Record<string, 'like' | 'dislike' | null> = {};
            for (const question of allVisible) {
                if (seen.has(question.id)) continue;
                seen.add(question.id);
                
                const response = await fetch(`/api/qa/${question.id}/react`);
                if (response.ok) {
                    const result = await response.json();
                    reactions[question.id] = result.reaction;
                }
            }
            userReactions = reactions;
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }

    // Load user reactions for answers
    async function loadAnswerReactions() {
        if (!user) return;
        
        // Get all visible questions that have answers
        const allVisible = untrack(() => isModerator 
            ? [...questions, ...pendingQuestions, ...answeredQuestions, ...rejectedQuestions]
            : questions);
        
        const questionsWithAnswers = allVisible.filter(q => q.answer?.id);
        if (questionsWithAnswers.length === 0) return;
        
        try {
            const reactions: Record<string, 'like' | 'dislike' | null> = {};
            const likes: Record<string, number> = {};
            const dislikes: Record<string, number> = {};
            
            for (const question of questionsWithAnswers) {
                const answerId = question.answer.id;
                
                const response = await fetch(`/api/qa/answer/${answerId}/react`);
                if (response.ok) {
                    const result = await response.json();
                    reactions[answerId] = result.userReaction;
                    likes[answerId] = result.stats.likes;
                    dislikes[answerId] = result.stats.dislikes;
                }
            }
            
            answerReactions = reactions;
            answerLikesCount = likes;
            answerDislikesCount = dislikes;
        } catch (error) {
            console.error('Error loading answer reactions:', error);
        }
    }

    // Like/Dislike handler
    async function toggleReaction(questionId: string, type: 'like' | 'dislike') {
        if (!user) {
            showToast(t('LoginRequiredForReactions') || 'Beğenmek için giriş yapmalısınız', 'error');
            return;
        }

        const currentReaction = userReactions[questionId] || null;
        const newReaction = currentReaction === type ? null : type;

        // Optimistic update - Svelte 5 requires new object for reactivity
        userReactions = { ...userReactions, [questionId]: newReaction };

        // Update local like/dislike counts - calculate properly to avoid race conditions
        const question = questions.find(q => q.id === questionId);
        if (question) {
            let newLikeCount = question.likeCount || 0;
            let newDislikeCount = question.dislikeCount || 0;

            // First remove current reaction from counts
            if (currentReaction === 'like') newLikeCount--;
            if (currentReaction === 'dislike') newDislikeCount--;

            // Then add new reaction to counts
            if (newReaction === 'like') newLikeCount++;
            if (newReaction === 'dislike') newDislikeCount++;

            question.likeCount = newLikeCount;
            question.dislikeCount = newDislikeCount;
            questions = [...questions];
        }

        try {
            const response = await fetch(`/api/qa/${questionId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: newReaction })
            });

            if (response.ok) {
                // Use actual stats from API
                const result = await response.json();
                if (result.stats && question) {
                    question.likeCount = result.stats.likes;
                    question.dislikeCount = result.stats.dislikes;
                    questions = [...questions];
                }
            } else {
                // Revert on error
                userReactions = { ...userReactions, [questionId]: currentReaction };
                if (question) {
                    // Revert: remove new reaction, add back current reaction
                    let revertedLikeCount = question.likeCount || 0;
                    let revertedDislikeCount = question.dislikeCount || 0;

                    if (newReaction === 'like') revertedLikeCount--;
                    if (newReaction === 'dislike') revertedDislikeCount--;
                    if (currentReaction === 'like') revertedLikeCount++;
                    if (currentReaction === 'dislike') revertedDislikeCount++;

                    question.likeCount = revertedLikeCount;
                    question.dislikeCount = revertedDislikeCount;
                    questions = [...questions];
                }
                showToast(t('qa.reactionError') || 'İşlem başarısız', 'error');
            }
        } catch (error) {
            // Revert on error
            userReactions = { ...userReactions, [questionId]: currentReaction };
            if (question) {
                // Revert: remove new reaction, add back current reaction
                let revertedLikeCount = question.likeCount || 0;
                let revertedDislikeCount = question.dislikeCount || 0;

                if (newReaction === 'like') revertedLikeCount--;
                if (newReaction === 'dislike') revertedDislikeCount--;
                if (currentReaction === 'like') revertedLikeCount++;
                if (currentReaction === 'dislike') revertedDislikeCount++;

                question.likeCount = revertedLikeCount;
                question.dislikeCount = revertedDislikeCount;
                questions = [...questions];
            }
            showToast(t('qa.reactionError') || 'İşlem sırasında hata oluştu', 'error');
        }
    }

    // Answer Like/Dislike handler
    async function toggleAnswerReaction(answerId: string, type: 'like' | 'dislike') {
        if (!user) {
            showToast(t('LoginRequiredForReactions') || 'Beğenmek için giriş yapmalısınız', 'error');
            return;
        }

        const currentReaction = answerReactions[answerId] || null;
        const newReaction = currentReaction === type ? null : type;

        // Optimistic update - Svelte 5 requires new objects for reactivity
        const newAnswerReactions = { ...answerReactions, [answerId]: newReaction };

        // Calculate new counts properly to avoid race conditions
        let newLikeCount = answerLikesCount[answerId] || 0;
        let newDislikeCount = answerDislikesCount[answerId] || 0;

        // First remove current reaction from counts
        if (currentReaction === 'like') newLikeCount--;
        if (currentReaction === 'dislike') newDislikeCount--;

        // Then add new reaction to counts
        if (newReaction === 'like') newLikeCount++;
        if (newReaction === 'dislike') newDislikeCount++;

        const newAnswerLikes = { ...answerLikesCount, [answerId]: newLikeCount };
        const newAnswerDislikes = { ...answerDislikesCount, [answerId]: newDislikeCount };

        answerReactions = newAnswerReactions;
        answerLikesCount = newAnswerLikes;
        answerDislikesCount = newAnswerDislikes;

        try {
            const response = await fetch(`/api/qa/answer/${answerId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: newReaction })
            });

            if (response.ok) {
                const result = await response.json();
                // Update with actual stats from server
                if (result.stats) {
                    answerLikesCount[answerId] = result.stats.likes;
                    answerDislikesCount[answerId] = result.stats.dislikes;
                    answerLikesCount = { ...answerLikesCount };
                    answerDislikesCount = { ...answerDislikesCount };
                }
            } else {
                // Revert on error
                // Calculate reverted counts properly
                let revertedLikeCount = answerLikesCount[answerId] || 0;
                let revertedDislikeCount = answerDislikesCount[answerId] || 0;

                if (newReaction === 'like') revertedLikeCount--;
                if (newReaction === 'dislike') revertedDislikeCount--;
                if (currentReaction === 'like') revertedLikeCount++;
                if (currentReaction === 'dislike') revertedDislikeCount++;

                answerReactions = { ...answerReactions, [answerId]: currentReaction };
                answerLikesCount = { ...answerLikesCount, [answerId]: revertedLikeCount };
                answerDislikesCount = { ...answerDislikesCount, [answerId]: revertedDislikeCount };
                showToast(t('qa.reactionError') || 'İşlem başarısız', 'error');
            }
        } catch (error) {
            // Revert on error
            // Calculate reverted counts properly
            let revertedLikeCount = answerLikesCount[answerId] || 0;
            let revertedDislikeCount = answerDislikesCount[answerId] || 0;

            if (newReaction === 'like') revertedLikeCount--;
            if (newReaction === 'dislike') revertedDislikeCount--;
            if (currentReaction === 'like') revertedLikeCount++;
            if (currentReaction === 'dislike') revertedDislikeCount++;

            answerReactions = { ...answerReactions, [answerId]: currentReaction };
            answerLikesCount = { ...answerLikesCount, [answerId]: revertedLikeCount };
            answerDislikesCount = { ...answerDislikesCount, [answerId]: revertedDislikeCount };
            showToast(t('qa.reactionError') || 'İşlem sırasında hata oluştu', 'error');
        }
    }

    // Follow handler
    async function toggleFollow(questionId: string) {
        if (!user) {
            showToast('Takip etmek için giriş yapmalısınız', 'error');
            return;
        }

        const isFollowing = userFollows[questionId];
        try {
            const response = await fetch('/api/qa/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    questionId, 
                    action: isFollowing ? 'unfollow' : 'follow' 
                })
            });

            if (response.ok) {
                const result = await response.json();
                userFollows[questionId] = result.following;
                userFollows = { ...userFollows };
                showToast(result.message, 'success');
            }
        } catch (error) {
            showToast('İşlem sırasında hata oluştu', 'error');
        }
    }

    // Accept answer (question author, moderator, or admin)
    async function acceptAnswer(answerId: string, question: any) {
        const canAccept = user && (
            question.author?.id === user.id ||
            user.role === 'moderator' ||
            user.role === 'admin'
        );

        if (!canAccept) {
            showToast('Sadece soru sahibi, moderatör veya admin cevap kabul edebilir', 'error');
            return;
        }

        try {
            const response = await fetch('/api/qa/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answerId })
            });

            if (response.ok) {
                const result = await response.json();
                // Refresh to show updated accepted status
                refreshPublicQuestions();
                showToast(result.message, 'success');
            }
        } catch (error) {
            showToast('İşlem sırasında hata oluştu', 'error');
        }
    }


    // Track view when expanding question
    async function onQuestionExpand(questionId: string) {
        if (expandedQuestionId !== questionId) {
            expandedQuestionId = questionId;
            // Increment view count locally
            questions = questions.map((q: any) => 
                q.id === questionId ? { ...q, viewCount: (q.viewCount || 0) + 1 } : q
            );
            // Track view on server
            try {
                await fetch('/api/qa/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionId })
                });
            } catch (e) {
                // Silent fail for view tracking
            }
        }
    }

    // Format number (k for thousands)
    function formatNumber(num: number): string {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    $effect(() => {
        if (isModerator) {
            loadModeratorQuestions();
        }
    });

    // Load user reactions only when user changes, not when questions change
    $effect(() => {
        const currentUser = user;
        if (currentUser) {
            loadUserReactions();
            loadAnswerReactions();
        }
    });
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={seoDescription} />
  <meta name="keywords" content={t('seo.qa.keywords') || 'ancap soru cevap, ancap, liberteryenizm, an-kap soru cevap'} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={seoDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content={t('seo.siteName') || 'LAF'} />
  <meta property="og:image" content={`${siteUrl}/og-qa.png`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@lafoundation" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={seoDescription} />

  <!-- Structured Data - Static to avoid hydration mismatch -->
  {@html `<script type="application/ld+json">{"@context":"https://schema.org","@type":"QAPage","name":"Soru & Cevap | LAF","description":"LAF Soru & Cevap platformunda anarşizm ve liberteryenizm hakkında sorular sorun.","url":"${siteUrl}/${currentLocale}/qa","mainEntity":{"@type":"Question","name":"Soru & Cevap"}}</script>`}

  <!-- RSS Feed -->
  <link rel="alternate" type="application/rss+xml" title="RSS Feed - Soru & Cevap" href={`/rss/qa.xml?lang=${currentLocale}`} />
</svelte:head>

<Navbar />

<!-- Report Drawer -->
<ReportDrawer
    bind:open={reportDrawerOpen}
    reportType="qa"
    targetId={reportTargetQuestion?.id}
    targetTitle={reportTargetQuestion?.title}
    targetUrl={reportTargetQuestion ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/qa/${reportTargetQuestion.slug}` : ''}
    onReported={onQuestionReported}
/>

<Tooltip.Provider>
<div class="w-full h-full relative">
<div class="w-full absolute top-7 sm:top-5 h-40 bg-gradient-to-b from-primary/25 to-background py-12 -z-5"></div>
<div class="container  max-w-3xl min-h-[calc(100vh-8rem)] mx-auto px-4 xl:px-0 py-12">
    <!-- Header -->
    <div class="flex flex-col items-center gap-3">

        <h1 class="text-xl tracking-tight md:text-4xl font-bold flex flex-row items-center">
                        <img class="w-auto sm:h-28 md:h-32" src={logoqa} alt="LAF QA" />
        </h1>
        <p class="py-4 text-base  text-secondary-foreground max-w-2xl">
            SORUN, CEVAPLAYALIM!
        </p>
    </div>

    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row gap-4 my-4">
        <Button onclick={() => { console.log('Opening ask dialog'); showAskDialog = true; }} size="xs" class="gap-2">
            <MessageCircle class="w-4 h-4" />
            Soru Sor
        </Button>
        
        {#if isModerator}
            <div class="flex gap-2 flex-wrap">
                <Badge variant="outline" class="gap-1">
                    <Clock class="w-3 h-3" />
                    {pendingQuestions.length} Bekleyen
                </Badge>
                <Badge variant="outline" class="gap-1">
                    <CheckCircle class="w-3 h-3" />
                    {answeredQuestions.length} Cevaplanmış
                </Badge>
                <Badge variant="destructive" class="gap-1">
                    <XCircle class="w-3 h-3" />
                    {rejectedQuestions.length} Reddedilmiş
                </Badge>
            </div>
        {/if}
    </div>

    <!-- Main Content - Unified View for All -->
        <div>
            <!-- Search & Filter Section using Article-style components -->
            <div class="flex flex-col sm:flex-row gap-3 mb-6">
                <!-- Search Input with Suggestions -->
                <QASearch
                    value={searchQuery}
                    onSearch={(query) => {
                        searchQuery = query;
                        pagination.page = 1;
                        applyFiltersAndSearch();
                    }}
                    onClear={() => {
                        searchQuery = '';
                        pagination.page = 1;
                        applyFiltersAndSearch();
                    }}
                    class="flex-1"
                />
                
                <!-- Filter Popover -->
                <QAFilterPopover
                    options={{
                        topics: topics,
                        sortOptions: [
                            { label: t('qa.sort.newest') || 'En Yeni', value: 'newest' },
                            { label: t('qa.sort.popular') || 'Popüler', value: 'popular' },
                            { label: t('qa.sort.unanswered') || 'Cevapsız', value: 'unanswered' }
                        ],
                        statuses: [
                            { label: t('qa.status.pending') || 'Bekliyor', value: 'pending' },
                            { label: t('qa.status.answered') || 'Cevaplandı', value: 'answered' },
                            { label: t('qa.status.published') || 'Yayında', value: 'published' },
                            { label: t('qa.status.rejected') || 'Reddedildi', value: 'rejected' }
                        ]
                    }}
                    activeFilters={{
                        topic: selectedTopicFilter,
                        sortBy: sortBy,
                        customDateRange: dateRangeFilter,
                        status: statusFilter,
                        nickname: nicknameFilter,
                        onlyFollowing: onlyFollowingFilter
                    }}
                    onFiltersChange={(filters) => {
                        selectedTopicFilter = filters.topic || '';
                        sortBy = filters.sortBy || 'newest';
                        handleTabClick(sortBy);
                        dateRangeFilter = filters.customDateRange;
                        statusFilter = filters.status || '';
                        nicknameFilter = filters.nickname || '';
                        onlyFollowingFilter = filters.onlyFollowing || false;
                        pagination.page = 1;
                        applyFiltersAndSearch();
                    }}
                    enableStatusFilter={isModerator}
                    enableFollowingFilter={!!user}
                />
            </div>

            <!-- Sort Tabs -->
            <Tabs.Root value={sortBy} onValueChange={handleSortChange} class="w-full">
                <Tabs.List class="grid w-full sm:w-auto grid-cols-3 sm:inline-flex">
                    <Tabs.Trigger 
                        value="newest" 
                        class="gap-2"
                        onmouseenter={() => preloadQuestions('newest')}
                    >
                        <Clock class="w-4 h-4" />
                        En Yeni
                    </Tabs.Trigger>
                    <Tabs.Trigger 
                        value="popular" 
                        class="gap-2"
                        onmouseenter={() => preloadQuestions('popular')}
                    >
                        <TrendingUp class="w-4 h-4" />
                        Popüler
                    </Tabs.Trigger>
                    <Tabs.Trigger 
                        value="unanswered" 
                        class="gap-2"
                        onmouseenter={() => preloadQuestions('unanswered')}
                    >
                        <HelpCircle class="w-4 h-4" />
                        Cevapsız
                    </Tabs.Trigger>
                </Tabs.List>
            </Tabs.Root>

            <!-- Questions List -->
            {#if filteredQuestions.length === 0}
                <Card class="bg-background border-none">
                    <CardContent class="py-12 text-center">
                        <HelpCircle class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        {#if sortBy === 'unanswered'}
                            <p class="text-muted-foreground mb-4">Tüm sorular cevaplandı! 🎉</p>
                            <p class="text-sm text-muted-foreground mb-4">Cevap bekleyen soru bulunmuyor.</p>
                        {:else if sortBy === 'popular'}
                            <p class="text-muted-foreground mb-4">Henüz popüler soru bulunmuyor</p>
                            <p class="text-sm text-muted-foreground mb-4">Beğeni ve görüntülenme sayısı yüksek sorular burada görünecek.</p>
                        {:else}
                            <p class="text-muted-foreground mb-4">Henüz yayınlanmış soru yok</p>
                        {/if}
                        <Button onclick={() => showAskDialog = true}>İlk Soruyu Siz Sorun</Button>
                    </CardContent>
                </Card>
            {:else}
                <div>
                    {#each filteredQuestions.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit) as question (question.id)}
                        {@const userReaction = userReactions[question.id] || null}
                        <Card class="rounded-none overflow-hidden p-0 bg-background border-none">
                            <div class="flex">
                                <!-- Like/Dislike Sidebar -->
                                <div class="flex flex-col items-center gap-1.5 py-2 px-2 md:px-3 md:py-4 border-r border-border/60 md:min-w-[64px] min-w-[52px] shrink-0">
                                    <!-- Like Button -->
                                    <Button
                                        variant={userReaction === 'like' ? 'default' : 'ghost'}
                                        size="icon"
                                        class={cn(
                                            'h-8 w-8',
                                            userReaction === 'like' && 'bg-primary text-primary-foreground'
                                        )}
                                        onclick={() => toggleReaction(question.id, 'like')}
                                    >
                                        <ThumbsUp
                                            size={16}
                                            class={cn(
                                                'transition-all duration-200',
                                                userReaction === 'like' && 'fill-current'
                                            )}
                                        />
                                    </Button>
                                    <span class="font-semibold text-sm">{formatNumber(question.likeCount || 0)}</span>

                                    <!-- Dislike Button -->
                                    <Button
                                        variant={userReaction === 'dislike' ? 'default' : 'ghost'}
                                        size="icon"
                                        class={cn(
                                            'h-8 w-8 transition-all duration-200',
                                            userReaction === 'dislike' &&
                                                'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                                        )}
                                        onclick={() => toggleReaction(question.id, 'dislike')}
                                    >
                                        <ThumbsDown
                                            size={16}
                                            class={cn(
                                                'transition-all duration-200',
                                                userReaction === 'dislike' && 'fill-current'
                                            )}
                                        />
                                    </Button>
                                    <span class="font-semibold text-sm">{formatNumber(question.dislikeCount || 0)}</span>

                                    <!-- Unified Actions Menu -->
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger class="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground mt-1">
                                            <MoreVertical class="w-4 h-4" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end" class="w-48">
                                            <!-- Everyone can see: Share & View -->
                                            <DropdownMenu.Item onclick={() => shareQuestion(question)}>
                                                <Share2 class="w-4 h-4 mr-2" />
                                                Paylaş
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item>
                                                <a href="/{lang}/qa/{question.slug}" data-sveltekit-preload-data="hover" class="flex items-center w-full">
                                                    <ViewIcon class="w-4 h-4 mr-2" />
                                                    Detaylı görüntüle
                                                </a>
                                            </DropdownMenu.Item>
                                            
                                            <!-- Logged-in users: Report & Answer (if not owner) -->
                                            {#if user}
                                                <DropdownMenu.Separator />
                                                <!-- Answer option (only if question is not user's own) -->
                                                {@const isQuestionOwnerCheck = (user?.id && (question.authorId == user.id || question.author?.id == user.id)) || (user?.username && question.author?.username === user.username)}
                                                {#if !isQuestionOwnerCheck}
                                                    <DropdownMenu.Item onclick={() => openAnswerDialog(question)}>
                                                        <MessageCircle class="w-4 h-4 mr-2" />
                                                        Cevapla
                                                    </DropdownMenu.Item>
                                                {/if}
                                                <DropdownMenu.Item onclick={() => openReportDrawer(question)}>
                                                    <Flag class="w-4 h-4 mr-2" />
                                                    Bildir
                                                </DropdownMenu.Item>
                                            {/if}
                                            
                                            <!-- Question Owner: Edit & Delete -->
                                            {#if user?.id && (question.authorId == user.id || question.author?.id == user.id)}
                                                <DropdownMenu.Separator />
                                                <DropdownMenu.Label>Sizin Sorunuz</DropdownMenu.Label>
                                                <DropdownMenu.Item onclick={() => openEditQuestionDialog(question)}>
                                                    <Pencil class="w-4 h-4 mr-2" />
                                                    Düzenle
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item onclick={() => openDeleteDialog('question', question.id)} class="text-destructive">
                                                    <Trash2 class="w-4 h-4 mr-2" />
                                                    Sil
                                                </DropdownMenu.Item>
                                            {/if}

                                            <!-- Moderators/Admins: Moderation Actions -->
                                            {#if user && (user.role === 'moderator' || user.role === 'admin')}
                                                <DropdownMenu.Separator />
                                                <DropdownMenu.Label>Moderasyon</DropdownMenu.Label>
                                                {#if question.status === 'pending'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'publish')}>
                                                        <Eye class="w-4 h-4 mr-2" />
                                                        Yayınla
                                                    </DropdownMenu.Item>
                                                {:else if question.status === 'published'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'unpublish')}>
                                                        <Eye class="w-4 h-4 mr-2" />
                                                        Yayından Kaldır
                                                    </DropdownMenu.Item>
                                                {:else if question.status === 'answered'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'publish')}>
                                                        <Eye class="w-4 h-4 mr-2" />
                                                        Yayınla
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if isModerator && question.status === 'answered'}
                                                    <DropdownMenu.Item onclick={() => openAnswerDialog(question)}>
                                                        <Pencil class="w-4 h-4 mr-2" />
                                                        Cevabı Düzenle
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if !(user?.id && (question.authorId == user.id || question.author?.id == user.id))}
                                                    <DropdownMenu.Item onclick={() => openDeleteDialog('question', question.id)} class="text-destructive">
                                                        <Trash2 class="w-4 h-4 mr-2" />
                                                        Sil
                                                    </DropdownMenu.Item>
                                                {/if}
                                            {/if}
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>

                                <!-- Question Content -->
                                <div class="flex flex-col py-2 px-3 md:px-6 md:py-4 gap-3 md:gap-4 flex-1 min-w-0">
                                    <!-- Question Header (Always Visible) -->
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            {#if question.topic}
                                                <Badge variant="outline" class="h-5 text-xs px-1.5">{question.topic.name}</Badge>
                                            {/if}
                                            {#if question.acceptedAnswerId}
                                                <Badge variant="default" class="gap-1 bg-green-500 h-5 text-xs px-1.5">
                                                    <Award class="w-3 h-3" />
                                                    Çözüldü
                                                </Badge>
                                            {/if}
                                        </div>
                                        <a href="/{lang}/qa/{question.slug}" data-sveltekit-preload-data="hover" class="font-semibold text-sm md:text-lg hover:text-primary hover:underline cursor-pointer block leading-snug">
                                            {question.title}
                                        </a>

                                        <div class="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {stripHtmlAndTruncate(question.contentHtml, 150)}
                                        </div>
                                        
                                        <!-- Question Images Preview -->
                                        {#if extractImagesFromHtml(question.contentHtml).length > 0}
                                            {@const questionImages = extractImagesFromHtml(question.contentHtml)}
                                            <div class="flex flex-wrap gap-2 mb-4">
                                                {#each questionImages.slice(0, 3) as imageUrl, index (index)}
                                                    <button
                                                        type="button"
                                                        onclick={() => openImageModal(questionImages, index)}
                                                        class="block cursor-pointer"
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt="Soru resmi {index + 1}"
                                                            class="w-24 h-24 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                                                        />
                                                    </button>
                                                {/each}
                                                {#if questionImages.length > 3}
                                                    <button
                                                        type="button"
                                                        onclick={() => openImageModal(questionImages, 3)}
                                                        class="flex items-center justify-center w-24 h-24 rounded-lg border bg-muted text-muted-foreground text-xs md:text-sm font-medium hover:bg-muted/80 transition-colors cursor-pointer"
                                                    >
                                                        +{questionImages.length - 3} daha
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}
                                        <!-- Stats & Author Row -->
                                        <div class="flex items-center justify-between gap-2 flex-wrap">
                                            <div class="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span class="flex items-center gap-1">
                                                    <ViewIcon class="w-3.5 h-3.5" />
                                                    {formatNumber(question.viewCount || 0)}
                                                </span>
                                                <span class="flex items-center gap-1">
                                                    <MessageCircle class="w-3.5 h-3.5" />
                                                    {question.answerCount || (question.answer ? 1 : 0)}
                                                </span>
                                                <span class="flex items-center gap-1">
                                                    <Clock class="w-3.5 h-3.5" />
                                                    {formatDate(question.createdAt)}
                                                </span>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <Avatar.Root class="h-5 w-5">
                                                    {#if question.author?.avatar}
                                                        <Avatar.Image src={question.author.avatar} alt={question.authorName || 'Anonim'} />
                                                    {/if}
                                                    <Avatar.Fallback class="text-[10px] bg-muted">
                                                        {question.isAnonymous ? '?' : (question.authorName?.[0] || 'U')}
                                                    </Avatar.Fallback>
                                                </Avatar.Root>
                                                <span class="text-xs text-muted-foreground">
                                                    {question.isAnonymous ? 'Anonim' : (question.authorName || 'İsimsiz')}
                                                </span>
                                                {#if user && question.author?.id === user.id}
                                                    <Badge variant="outline" class="h-4 text-[10px] px-1.5 ml-1">Siz</Badge>
                                                {/if}
                                                {#if isModerator}
                                                    <Badge variant={question.status === 'published' ? 'default' : question.status === 'pending' ? 'secondary' : 'outline'} class="h-4 text-[10px] px-1.5">
                                                        {question.status === 'published' ? 'Yayında' : question.status === 'pending' ? 'Bekliyor' : 'Cevaplandı'}
                                                    </Badge>
                                                {/if}
                                            </div>
                                        </div>

                                        <!-- Moderator Actions -->
                                        {#if isModerator && question.status === 'pending'}
                                            <div class="flex flex-wrap gap-2 pt-1">
                                                <Button size="xs" onclick={() => openAnswerDialog(question)} class="gap-1 h-7">
                                                    <MessageCircle class="w-3.5 h-3.5" />
                                                    Cevapla
                                                </Button>
                                            </div>
                                        {/if}

                                                    {#if question.answer}
                                                    <Accordion.Root type="single" class="mt-3 border rounded-lg bg-muted/30">
                                                        <Accordion.Item value="answer-{question.id}" class="border-0 px-3 py-2">
                                                            <Accordion.Trigger
                                                                class="py-1 hover:no-underline w-full justify-start gap-2 text-left [&[data-state=open]>svg]:rotate-180"
                                                                onclick={() => onQuestionExpand(question.id)}
                                                            >
                                                                <span class="text-sm flex items-center gap-2 font-medium">
                                                                    <MessageCircle class="w-4 h-4 text-primary" />
                                                                    {#if question.acceptedAnswerId === question.answer.id}
                                                                        <Badge variant="default" class="gap-1 bg-green-500 hover:bg-green-600 h-5 text-xs px-2">
                                                                            <Award class="w-3 h-3" />
                                                                            Cevap görüntüle
                                                                        </Badge>
                                                                    {:else}
                                                                        <span class="text-muted-foreground">Cevap görüntüle</span>
                                                                    {/if}
                                                                </span>
                                                            </Accordion.Trigger>
                                                            <Accordion.Content class="pb-0">
                                                                <div class="pt-4 pb-2">
                                                                    <!-- Answer Content -->
                                                                    <div class="flex gap-3">
                                                                        <!-- Answer Actions Sidebar (Like/Dislike) -->
                                                                        <div class="flex flex-col items-center gap-1.5 pr-2 pt-1 min-w-[48px]">
                                                                            <Tooltip.Root>
                                                                                <Tooltip.Trigger>
                                                                                    <Button
                                                                                        variant={(answerReactions[question.answer.id] ?? null) === 'like' ? 'default' : 'ghost'}
                                                                                        size="icon"
                                                                                        class="h-8 w-8 {(answerReactions[question.answer.id] ?? null) === 'like' ? 'text-primary' : ''}"
                                                                                        onclick={() => toggleAnswerReaction(question.answer.id, 'like')}
                                                                                        disabled={!user}
                                                                                    >
                                                                                        <ThumbsUp class="w-4 h-4" />
                                                                                    </Button>
                                                                                </Tooltip.Trigger>
                                                                                {#if !user}
                                                                                    <Tooltip.Content>
                                                                                        <p>Beğenmek için giriş yapmalısınız</p>
                                                                                    </Tooltip.Content>
                                                                                {/if}
                                                                            </Tooltip.Root>
                                                                            <span class="text-sm font-medium">{answerLikesCount[question.answer.id] ?? question.answer.likeCount ?? 0}</span>
                                                                            
                                                                            <Tooltip.Root>
                                                                                <Tooltip.Trigger>
                                                                                    <Button
                                                                                        variant={(answerReactions[question.answer.id] ?? null) === 'dislike' ? 'default' : 'ghost'}
                                                                                        size="icon"
                                                                                        class="h-8 w-8 {(answerReactions[question.answer.id] ?? null) === 'dislike' ? 'text-destructive' : ''}"
                                                                                        onclick={() => toggleAnswerReaction(question.answer.id, 'dislike')}
                                                                                        disabled={!user}
                                                                                    >
                                                                                        <ThumbsDown class="w-4 h-4" />
                                                                                    </Button>
                                                                                </Tooltip.Trigger>
                                                                                {#if !user}
                                                                                    <Tooltip.Content>
                                                                                        <p>Beğenmemek için giriş yapmalısınız</p>
                                                                                    </Tooltip.Content>
                                                                                {/if}
                                                                            </Tooltip.Root>
                                                                            <span class="text-sm font-medium">{answerDislikesCount[question.answer.id] ?? question.answer.dislikeCount ?? 0}</span>

                                                                            <!-- Dropdown Menu for all users -->
                                                                            <DropdownMenu.Root>
                                                                                <DropdownMenu.Trigger class="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                                                                                    <MoreVertical class="w-4 h-4" />
                                                                                </DropdownMenu.Trigger>
                                                                                <DropdownMenu.Content align="start" class="w-48">
                                                                                    <!-- Answer Owner: Edit & Delete -->
                                                                                    {#if (user?.id && question.answer?.author?.id == user.id) || (user?.username && question.answer?.author?.username === user.username)}
                                                                                        <DropdownMenu.Label>Sizin Cevabınız</DropdownMenu.Label>
                                                                                        <DropdownMenu.Item onclick={() => openAnswerDialog(question)}>
                                                                                            <Pencil class="w-4 h-4 mr-2" />
                                                                                            Düzenle
                                                                                        </DropdownMenu.Item>
                                                                                        <DropdownMenu.Item onclick={() => openDeleteDialog('answer', question.id, question.answer.id)} class="text-destructive">
                                                                                            <Trash2 class="w-4 h-4 mr-2" />
                                                                                            Sil
                                                                                        </DropdownMenu.Item>
                                                                                        <DropdownMenu.Separator />
                                                                                    {/if}

                                                                                    {#if user && (user.role === 'moderator' || user.role === 'admin')}
                                                                                        <DropdownMenu.Label>Moderasyon</DropdownMenu.Label>
                                                                                        {#if question.status === 'answered'}
                                                                                            <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'publish')}>
                                                                                                <Eye class="w-4 h-4 mr-2" />
                                                                                                Yayınla
                                                                                            </DropdownMenu.Item>
                                                                                        {/if}
                                                                                        <!-- Moderators can also edit/delete even if not owner -->
                                                                                        {@const isAnswerOwnerCheck = (user?.id && question.answer?.author?.id == user.id) || (user?.username && question.answer?.author?.username === user.username)}
                                                                                        {#if !isAnswerOwnerCheck}
                                                                                            <DropdownMenu.Item onclick={() => openAnswerDialog(question)}>
                                                                                                <Pencil class="w-4 h-4 mr-2" />
                                                                                                Düzenle
                                                                                            </DropdownMenu.Item>
                                                                                        {/if}
                                                                                        {#if question.acceptedAnswerId === question.answer.id}
                                                                                            <DropdownMenu.Item onclick={() => acceptAnswer(question.answer.id, question)} class="text-yellow-600">
                                                                                                <Award class="w-4 h-4 mr-2" />
                                                                                                En İyi Cevabı Kaldır
                                                                                            </DropdownMenu.Item>
                                                                                        {:else}
                                                                                            <DropdownMenu.Item onclick={() => acceptAnswer(question.answer.id, question)} class="text-green-600">
                                                                                                <Award class="w-4 h-4 mr-2" />
                                                                                                En İyi Cevap Seç
                                                                                            </DropdownMenu.Item>
                                                                                        {/if}
                                                                                        {#if !isAnswerOwnerCheck}
                                                                                            <DropdownMenu.Item onclick={() => openDeleteDialog('answer', question.id, question.answer.id)} class="text-destructive">
                                                                                                <Trash2 class="w-4 h-4 mr-2" />
                                                                                                Sil
                                                                                            </DropdownMenu.Item>
                                                                                        {/if}
                                                                                        <DropdownMenu.Separator />
                                                                                    {/if}
                                                                                    {#if user}
                                                                                        <DropdownMenu.Item onclick={() => openReportDrawer({...question, reportType: 'answer', answerId: question.answer.id})}>
                                                                                            <Flag class="w-4 h-4 mr-2" />
                                                                                            Bildir
                                                                                        </DropdownMenu.Item>
                                                                                    {/if}
                                                                                    <DropdownMenu.Item onclick={() => shareQuestion(question)}>
                                                                                        <Share2 class="w-4 h-4 mr-2" />
                                                                                        Paylaş
                                                                                    </DropdownMenu.Item>
                                                                                </DropdownMenu.Content>
                                                                            </DropdownMenu.Root>
                                                                        </div>

                                                                        <div class="flex-1 min-w-0">
                                                                            <!-- Answer Author Profile Card -->
                                                                            <div class="flex items-center gap-2.5 mb-3 pb-3 border-b border-border/60">
                                                                                {#if (question.answer?.author?.nickname || question.answer?.author?.username || '')}
                                                                                    {@const author = question.answer.author}
                                                                                    {@const answerAuthorName = author?.name || author?.surname ? `${author?.name || ''} ${author?.surname || ''}`.trim() : author?.nickname || author?.username || 'Moderatör'}
                                                                                    {@const answerAuthorIdentifier = author?.nickname || author?.username || ''}
                                                                                    <A href="/{lang}/{answerAuthorIdentifier}" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                                                                                        <Avatar.Root class="h-8 w-8">
                                                                                            <Avatar.Image
                                                                                                src={author?.avatar}
                                                                                                alt={answerAuthorName}
                                                                                            />
                                                                                            <Avatar.Fallback class="bg-primary/10 text-primary text-xs">
                                                                                                {answerAuthorName[0]?.toUpperCase() || 'M'}
                                                                                            </Avatar.Fallback>
                                                                                        </Avatar.Root>
                                                                                        <div class="min-w-0">
                                                                                            <p class="font-medium text-sm truncate">
                                                                                                {answerAuthorName}
                                                                                            </p>
                                                                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                                                                <Badge variant="outline" class="h-4 text-[10px] px-1">
                                                                                                    <Award class="w-3 h-3 mr-1" />
                                                                                                    Cevaplayan
                                                                                                </Badge>
                                                                                                <span class="text-xs text-muted-foreground">
                                                                                                    {formatDate(question.answer.createdAt)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </A>
                                                                                {:else}
                                                                                    {@const author = question.answer.author}
                                                                                    {@const answerAuthorName = author?.name || author?.surname ? `${author?.name || ''} ${author?.surname || ''}`.trim() : author?.nickname || author?.username || 'Moderatör'}
                                                                                    <Avatar.Root class="h-8 w-8">
                                                                                        <Avatar.Image
                                                                                            src={author?.avatar}
                                                                                            alt={answerAuthorName}
                                                                                        />
                                                                                        <Avatar.Fallback class="bg-primary/10 text-primary text-xs">
                                                                                            {answerAuthorName[0]?.toUpperCase() || 'M'}
                                                                                        </Avatar.Fallback>
                                                                                    </Avatar.Root>
                                                                                    <div class="min-w-0">
                                                                                        <p class="font-medium text-sm truncate">
                                                                                            {answerAuthorName}
                                                                                        </p>
                                                                                        <div class="flex items-center gap-1.5 flex-wrap">
                                                                                            <Badge variant="outline" class="h-4 text-[10px] px-1">
                                                                                                <Award class="w-3 h-3 mr-1" />
                                                                                                Cevaplayan
                                                                                            </Badge>
                                                                                            <span class="text-xs text-muted-foreground">
                                                                                                {formatDate(question.answer.createdAt)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                {/if}
                                                                            </div>

                                                                            <!-- Best Answer Badge -->
                                                                            {#if question.acceptedAnswerId === question.answer.id}
                                                                                <Badge class="mb-3 gap-1 bg-green-500 hover:bg-green-600 h-5 text-xs px-2">
                                                                                    <Award class="w-3 h-3" />
                                                                                    Kabul Edilen Cevap
                                                                                </Badge>
                                                                            {/if}

                                                                            <div class="text-sm leading-relaxed prose prose-sm max-w-none text-foreground/90">
                                                                                {@html question.answer.contentHtml}
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Accordion.Content>
                                                        </Accordion.Item>
                                                    </Accordion.Root>
                                                    {:else}
                                                        <!-- No Answer Section -->
                                                        <div class="mt-4">
                                                            {#if isModerator && (question.status === 'pending' || question.status === 'answered')}
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onclick={() => openAnswerDialog(question)}
                                                                    class="gap-2"
                                                                >
                                                                    <MessageCircle class="w-4 h-4" />
                                                                    Cevap Ver
                                                                </Button>
                                                            {:else}
                                                                <p class="text-xs text-muted-foreground italic">
                                                                    Bu soru henüz cevaplanmadı.
                                                                </p>
                                                            {/if}
                                                        </div>
                                                    {/if}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    {/each}
                </div>

                <!-- Pagination -->
                {#if pagination.totalPages > 1}
                    <div class="flex justify-center gap-2 mt-8">
                        <Button 
                            size="xs"
                            variant="outline" 
                            disabled={pagination.page <= 1}
                            onclick={() => {
                                pagination.page--;
                            }}
                        >
                            Önceki
                        </Button>
                        <span class="flex items-center px-4 text-sm text-muted-foreground">
                            Sayfa {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button 
                            size="xs"
                            variant="outline" 
                            disabled={pagination.page >= pagination.totalPages}
                            onclick={() => {
                                pagination.page++;
                            }}
                        >
                            Sonraki
                        </Button>
                    </div>
                {/if}
            {/if}
        </div>
</div>
</div>
</Tooltip.Provider>

<!-- Ask Question Dialog -->
<Dialog.Root open={showAskDialog} onOpenChange={(open) => {
        showAskDialog = open;
        if (!open) {
            questionContent = '';
            questionAttachments = [];
            if (questionFileInput) questionFileInput.value = '';
            editingQuestion = null;
        }
    }}
>
    <Dialog.Content class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <MessageCircle class="w-5 h-5" />
                {editingQuestion ? 'Soruyu Düzenle' : 'Soru Sor'}
            </Dialog.Title>
            <Dialog.Description>
                {editingQuestion ? 'Sorunuzu güncelleyin' : 'Sorunuz yayınlandı!'}
            </Dialog.Description>
        </Dialog.Header>

        <ScrollArea class="flex-1 overflow-y-auto pr-4">
            <div class="space-y-6 py-4">
                <!-- Topic Selection -->
                <div class="space-y-2">
                    <Label for="topic">Konu</Label>
                    <Select.Root type="single" bind:value={questionTopicId}>
                        <Select.Trigger id="topic" class="w-full">
                            {questionTopicId ? topics.find((t: any) => t.id === questionTopicId)?.name : 'Konu seçin (isteğe bağlı)'}
                        </Select.Trigger>
                        <Select.Content class="z-50" portalProps={{ disabled: true }}>
                            <Select.Item value="">Konu seçin</Select.Item>
                            {#each topics as topic (topic.id)}
                                <Select.Item value={topic.id}>{topic.name}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <!-- Title -->
                <div class="space-y-2">
                    <Label for="title">Soru Başlığı *</Label>
                    <Input 
                        id="title"
                        bind:value={questionTitle}
                        placeholder="Sorunuzu kısa bir başlıkla özetleyin"
                    />
                </div>

                <!-- Content Textarea -->
                <div class="space-y-2">
                    <Label>Soru Detayı *</Label>
                    <textarea
                        bind:value={questionContent}
                        rows={4}
                        maxlength="250"
                        placeholder="Sorunuzu detaylı bir şekilde açıklayın..."
                        class="resize-none"
                    ></textarea>
                    <div class="text-xs text-muted-foreground text-right mt-1">
                        {questionContent.length}/250 karakter
                    </div>
                    
                    <!-- Attachment Upload -->
                    <div class="space-y-2">
                        <input
                            bind:this={questionFileInput}
                            type="file"
                            accept="image/*"
                            multiple
                            class="hidden"
                            onchange={handleQuestionFileSelect}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            class="gap-2"
                            onclick={() => questionFileInput?.click()}
                        >
                            <ImageIcon class="w-4 h-4" />
                            Resim Ekle
                        </Button>
                        
                        <!-- Attachment Previews -->
                        {#if questionAttachments.length > 0}
                            <div class="flex flex-wrap gap-2 mt-2">
                                {#each questionAttachments as attachment (attachment.id)}
                                    <div class="relative group">
                                        <img
                                            src={attachment.preview}
                                            alt="Attachment"
                                            class="w-20 h-20 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onclick={() => removeQuestionAttachment(attachment.id)}
                                            class="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X class="w-3 h-3" />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Guest Info (if not logged in) -->
                {#if !user}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label for="authorName">İsim *</Label>
                            <Input 
                                id="authorName"
                                bind:value={questionAuthorName}
                                placeholder="Adınız"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="authorEmail">E-posta *</Label>
                            <Input 
                                id="authorEmail"
                                type="email"
                                bind:value={questionAuthorEmail}
                                placeholder="E-posta adresiniz"
                            />
                        </div>
                    </div>
                {/if}

                <!-- Anonymous Option (if logged in and creating new question) -->
                {#if user && !editingQuestion}
                    <div class="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="anonymous" 
                            bind:checked={isAnonymous}
                            class="rounded border-gray-300"
                        />
                        <Label for="anonymous" class="cursor-pointer">
                            Anonim olarak sor (kimliğim gizlensin)
                        </Label>
                    </div>
                {/if}
            </div>
        </ScrollArea>

        <Dialog.Footer class="mt-4">
            <Button variant="outline" size="xs" onclick={() => { showAskDialog = false; editingQuestion = null; }}>İptal</Button>
            <Button size="xs" onclick={submitQuestion} disabled={isSubmitting} class="gap-2">
                {#if isSubmitting}
                    <Loader2 class="w-4 h-4 animate-spin" />
                    {editingQuestion ? 'Güncelleniyor...' : 'Gönderiliyor...'}
                {:else}
                    <Send class="w-4 h-4" />
                    {editingQuestion ? 'Güncelle' : 'Soruyu Gönder'}
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Answer Dialog (Moderator & Answer Owner) -->
{#if isModerator || (user && selectedQuestion?.answer?.author?.id === user.id)}
    <Dialog.Root open={showAnswerDialog} onOpenChange={(open) => {
        showAnswerDialog = open;
        if (!open) {
            answerContent = '';
            answerAttachments = [];
            if (answerFileInput) answerFileInput.value = '';
        }
    }}>
        <Dialog.Content class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <MessageCircle class="w-5 h-5" />
                    {selectedQuestion?.answer?.id ? 'Cevabı Düzenle' : 'Cevap Ver'}
                </Dialog.Title>
                <Dialog.Description>
                    {selectedQuestion?.title}
                </Dialog.Description>
            </Dialog.Header>

            <ScrollArea class="flex-1 overflow-y-auto pr-4">
                <div class="space-y-6 py-4">
                    <!-- Original Question -->
                    {#if selectedQuestion}
                        <div class="bg-muted/50 rounded-lg p-4">
                            <h4 class="font-semibold mb-2">Orijinal Soru</h4>
                            <p class="font-medium mb-2">{selectedQuestion.title}</p>
                            <div class="prose prose-sm max-w-none dark:prose-invert">
                                {@html selectedQuestion.contentHtml}
                            </div>
                        </div>
                    {/if}

                    <!-- Answer Textarea -->
                    <div class="space-y-2">
                        <Label>Cevabınız *</Label>
                        <textarea
                            bind:value={answerContent}
                            placeholder="Cevabınızı yazın..."
                            class="w-full min-h-[200px] max-h-[300px] p-3 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        ></textarea>
                        
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
                                                class="w-20 h-20 object-cover rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onclick={() => removeAnswerAttachment(attachment.id)}
                                                class="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X class="w-3 h-3" />
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Publish Options (Moderators only) -->
                    {#if isModerator}
                        <div class="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="publishImmediately" 
                                bind:checked={publishImmediately}
                                class="rounded border-gray-300"
                            />
                            <Label for="publishImmediately" class="cursor-pointer">
                                Cevabı hemen yayınla (işaretlemezseniz taslak olarak kaydedilir)
                            </Label>
                        </div>
                    {/if}
                </div>
            </ScrollArea>

            <Dialog.Footer class="mt-4">
                <Button size="xs" variant="outline" onclick={() => showAnswerDialog = false}>İptal</Button>
                <Button size="xs" onclick={submitAnswer} disabled={isAnswering} class="gap-2">
                    {#if isAnswering}
                        <Loader2 class="w-4 h-4 animate-spin" />
                        Gönderiliyor...
                    {:else}
                        <Send class="w-4 h-4" />
                        Cevabı Gönder
                    {/if}
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
{/if}

<!-- Delete Confirmation Alert Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                {deleteTarget?.type === 'question' ? 'Soruyu Sil' : 'Cevabı Sil'}
            </AlertDialog.Title>
            <AlertDialog.Description>
                {deleteTarget?.type === 'question' 
                    ? 'Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.' 
                    : 'Bu cevabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={cancelDelete}>İptal</AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmDelete} class="bg-destructive text-destructive-foreground">
                Sil
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

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
                >
                    <ChevronLeft class="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onclick={nextImage}
                    disabled={currentImageIndex === currentQuestionImages.length - 1}
                    class="absolute right-4 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
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

<Footer />
