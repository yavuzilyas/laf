<script lang="ts">
    import Navbar from '$lib/Navbar.svelte';
    import Footer from '$lib/Footer.svelte';
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte.js';
    import { showToast } from '$lib/hooks/toast';
    import { page } from '$app/stores';
    import { beforeNavigate, goto } from '$app/navigation';
    import { untrack } from 'svelte';
    import logoqa from '$lib/assets/rothbard_institute.svg';

    // Reset reactions when navigating away - keep each page independent
    beforeNavigate(() => {
        userReactions = {};
    });
    // Edra Editor
    import { EdraEditor, EdraToolBar } from '$lib/components/edra/shadcn/index.js';
    import { nanoid } from 'nanoid';

    // File upload - kept for reference, will be handled by editor
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
    let isModerator = $state(data.isModerator);
    let user = $state(data.user);

    // Pagination - hybrid model: show all page numbers, fetch data per page
    let currentPage = $state(data.pagination?.page || 1);
    const itemsPerPage = data.pagination?.limit || 10;
    // Server-side pagination totals - updated when API returns new data
    let serverTotalItems = $state(data.pagination?.total || 0);
    let serverTotalPages = $state(data.pagination?.totalPages || 1);
    const totalItems = $derived(serverTotalItems);
    const totalPages = $derived(serverTotalPages);

    let moderatorTab = $state('pending');

    // Question form state - inline form (not dialog)
    let showAskForm = $state(false);
    let questionTitle = $state('');
    let questionTopicId = $state('');
    let questionAuthorName = $state('');
    let questionAuthorEmail = $state('');
    let isAnonymous = $state(false);
    let questionContent = $state({ type: 'doc', content: [{ type: 'paragraph' }] }); // Edra editor JSON content
    let questionEditor = $state<any>(null); // Edra editor instance
    let questionCharCount = $state(0); // Character count for question editor
    let isSubmitting = $state(false);
    let editingQuestion: any = $state(null); // Stores question being edited

    // Character limits for Edra editor (links count as 1 character)
    const QUESTION_CHAR_LIMIT = 300;
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
    let editingQuestionId = $state<string | null>(null); // Track question ID for file uploads
    let draftQuestionId = $state<string | null>(null); // Draft ID for new questions (for file uploads)

    // Answer form state - inline forms per question
    let answeringQuestionId: string | null = $state(null);
    let editingAnswerId: string | null = $state(null);
    let answerContent = $state({ type: 'doc', content: [{ type: 'paragraph' }] }); // Edra editor JSON content
    let answerEditors = $state<Record<string, any>>({}); // Map of questionId -> editor instance
    let answerCharCounts = $state<Record<string, number>>({}); // Map of questionId -> character count
    let isAnswering = $state(false);
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

    // Filtered questions (client-side filtering) - Articles page style
    const filteredQuestions = $derived(
        (() => {
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
                    const authorId = q.author?.id || q.authorId;
                    return followedUsers[authorId] === true;
                });
            }

            // Note: Sorting is handled by server (API returns already sorted data)
            // Client-side only filters: search, topic, date, status, nickname, following

            return result;
        })()
    );

    // Check if any client-side filters are active
    const hasClientSideFilters = $derived(
        searchQuery || selectedTopicFilter || dateRangeFilter || statusFilter || nicknameFilter || onlyFollowingFilter
    );

    // Questions to display (server sends current page data only)
    // When filters active, filter the current page; when no filters, use as-is
    const paginatedQuestions = $derived(hasClientSideFilters ? filteredQuestions : questions);

    // Initialize like/dislike counts when questions change
    $effect(() => {
        const currentLikes = untrack(() => questionLikesCount);
        const currentDislikes = untrack(() => questionDislikesCount);
        const currentInitializedIds = untrack(() => initializedQuestionIds);

        const newLikes: Record<string, number> = { ...currentLikes };
        const newDislikes: Record<string, number> = { ...currentDislikes };
        const newInitializedIds = new Set(currentInitializedIds);
        let hasChanges = false;

        for (const q of questions) {
            if (!newInitializedIds.has(q.id)) {
                newInitializedIds.add(q.id);
                newLikes[q.id] = q.likeCount || 0;
                newDislikes[q.id] = q.dislikeCount || 0;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            initializedQuestionIds = newInitializedIds;
            questionLikesCount = newLikes;
            questionDislikesCount = newDislikes;
        }
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
        currentPage = 1;
        // No need to call applyFiltersAndSearch - filteredQuestions is $derived and auto-updates
    }

    // Handle sort change - fetch from API with new sort
    function handleSortChange(value: string) {
        sortBy = value;
        currentPage = 1;
        refreshPublicQuestions();
    }

    // Track previous filter values to detect changes
    let previousTopic = $state(data.pagination?.topic || '');
    let previousSearch = $state(data.pagination?.search || '');

    // Fetch data when topic or search changes (server-side filters)
    $effect(() => {
        const topicChanged = selectedTopicFilter !== previousTopic;
        const searchChanged = searchQuery !== previousSearch;

        if (topicChanged || searchChanged) {
            // Update previous values
            previousTopic = selectedTopicFilter;
            previousSearch = searchQuery;
            // Reset to first page and fetch
            currentPage = 1;
            untrack(() => refreshPublicQuestions());
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
    let questionLikesCount = $state<Record<string, number>>({});
    let questionDislikesCount = $state<Record<string, number>>({});
    let userFollows = $state<Record<string, boolean>>({});

    // Track initialized question IDs to avoid resetting counts on revalidation
    let initializedQuestionIds = $state<Set<string>>(new Set());
    
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
    
    // Accordion value state for controlling accordion open/close
    let accordionValue = $state<string>('');

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

    function openEditQuestionDialog(question: any) {
        editingQuestion = question;
        editingQuestionId = question.id;
        questionTitle = question.title || '';
        // Handle edra editor content format
        if (question.content && typeof question.content === 'object' && question.content.type === 'doc') {
            questionContent = question.content;
        } else if (question.contentHtml) {
            // Convert HTML to plain text for the editor
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = question.contentHtml;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            questionContent = { type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] };
        } else {
            questionContent = { type: 'doc', content: [{ type: 'paragraph' }] };
        }
        questionTopicId = question.topic?.id || '';
        isAnonymous = question.isAnonymous || false;
        showAskForm = true;
        // Scroll to top form
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                document.getElementById('ask-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    async function submitQuestion() {
        if (!questionTitle.trim() || questionTitle.trim().length < 5) {
            showToast('Başlık en az 5 karakter olmalıdır', 'error');
            return;
        }

        // Get content from editor - check if editor has content
        const editorContent = questionEditor?.getJSON();
        const hasContent = editorContent && (
            editorContent.content?.length > 1 ||
            (editorContent.content?.[0]?.content?.length > 0) ||
            (editorContent.content?.[0]?.type !== 'paragraph')
        );

        if (!hasContent) {
            showToast('Soru içeriği gerekli', 'error');
            return;
        }

        // Get HTML from editor
        const contentHtml = questionEditor?.getHTML() || '';

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
                    content: editorContent,
                    contentHtml,
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
                questionContent = { type: 'doc', content: [{ type: 'paragraph' }] };
                questionEditor = null;
                editingQuestion = null;
                editingQuestionId = null;
                draftQuestionId = null;
                showAskForm = false;

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

    async function submitAnswer(questionId: string, answerId?: string) {
        // Get the editor instance for this question
        const editor = answerEditors[questionId];

        // Get content from editor - check if editor has content
        const editorContent = editor?.getJSON();
        const hasContent = editorContent && (
            editorContent.content?.length > 1 ||
            (editorContent.content?.[0]?.content?.length > 0) ||
            (editorContent.content?.[0]?.type !== 'paragraph')
        );

        if (!hasContent) {
            showToast('Cevap içeriği gerekli', 'error');
            return;
        }

        // Get HTML from editor
        const contentHtml = editor?.getHTML() || '';

        const isEditing = !!answerId;

        isAnswering = true;
        try {
            const url = '/api/qa/answer';
            const method = isEditing ? 'PUT' : 'POST';

            const requestBody: any = {
                content: editorContent,
                contentHtml
            };

            if (isEditing) {
                // PUT request for editing
                requestBody.answerId = answerId;
            } else {
                // POST request for new answer
                requestBody.questionId = questionId;
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

                // Reset inline form state
                answeringQuestionId = null;
                editingAnswerId = null;
                answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
                // Clear the editor for this question
                delete answerEditors[questionId];

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

    function cancelAnswerForm() {
        const questionId = answeringQuestionId;
        answeringQuestionId = null;
        editingAnswerId = null;
        answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
        // Clear the editor for this question
        if (questionId) {
            delete answerEditors[questionId];
        }
    }

    function openAnswerForm(question: any, existingAnswer?: any) {
        if (existingAnswer) {
            // Editing mode
            editingAnswerId = existingAnswer.id;
            // Handle edra editor content format
            if (existingAnswer.content && typeof existingAnswer.content === 'object' && existingAnswer.content.type === 'doc') {
                answerContent = existingAnswer.content;
            } else if (existingAnswer.contentHtml) {
                // Convert HTML to plain text for the editor
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = existingAnswer.contentHtml;
                const text = tempDiv.textContent || tempDiv.innerText || '';
                answerContent = { type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] };
            } else {
                answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
            }
        } else {
            // New answer mode
            editingAnswerId = null;
            answerContent = { type: 'doc', content: [{ type: 'paragraph' }] };
        }
        answeringQuestionId = question.id;
        // Ensure accordion is expanded so the inline form is visible
        accordionValue = `answer-${question.id}`;
        onQuestionExpand(question.id);
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
            params.append('page', currentPage.toString());
            params.append('sort', sortBy);

            const response = await fetch(`/api/qa?${params.toString()}`);
            if (response.ok) {
                const result = await response.json();
                questions = result.questions;
                // Update pagination totals from API response
                serverTotalItems = result.total || serverTotalItems;
                serverTotalPages = result.totalPages || serverTotalPages;
            }
        } catch (error) {
            console.error('Error refreshing questions:', error);
        }
    }
    
    // Remove specific filter
    function removeFilter(type: 'search' | 'topic') {
        if (type === 'search') searchQuery = '';
        if (type === 'topic') selectedTopicFilter = '';
        currentPage = 1;
        // No need to call applyFiltersAndSearch - filteredQuestions is $derived and auto-updates
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
            const likes: Record<string, number> = {};
            const dislikes: Record<string, number> = {};
            for (const question of allVisible) {
                if (seen.has(question.id)) continue;
                seen.add(question.id);
                
                const response = await fetch(`/api/qa/${question.id}/react`);
                if (response.ok) {
                    const result = await response.json();
                    reactions[question.id] = result.reaction;
                    if (result.stats) {
                        likes[question.id] = result.stats.likes;
                        dislikes[question.id] = result.stats.dislikes;
                    }
                }
            }
            userReactions = reactions;
            questionLikesCount = likes;
            questionDislikesCount = dislikes;
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
        
        // Collect all answer IDs from all questions
        const allAnswerIds: string[] = [];
        allVisible.forEach(q => {
            if (q.answers?.length > 0) {
                q.answers.forEach((a: any) => {
                    if (a.id) allAnswerIds.push(a.id);
                });
            }
        });
        
        if (allAnswerIds.length === 0) return;
        
        try {
            const reactions: Record<string, 'like' | 'dislike' | null> = {};
            const likes: Record<string, number> = {};
            const dislikes: Record<string, number> = {};
            
            for (const answerId of allAnswerIds) {
                
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

    // Like/Dislike handler - works like toggleAnswerReaction
    async function toggleReaction(questionId: string, type: 'like' | 'dislike') {
        if (!user) {
            showToast(t('LoginRequiredForReactions') || 'Beğenmek için giriş yapmalısınız', 'error');
            return;
        }

        const currentReaction = userReactions[questionId] || null;
        const newReaction = currentReaction === type ? null : type;

        // Optimistic update - Svelte 5 requires new objects for reactivity
        const newUserReactions = { ...userReactions, [questionId]: newReaction };

        // Calculate new counts properly to avoid race conditions
        let newLikeCount = questionLikesCount[questionId] ?? questions.find(q => q.id === questionId)?.likeCount ?? 0;
        let newDislikeCount = questionDislikesCount[questionId] ?? questions.find(q => q.id === questionId)?.dislikeCount ?? 0;

        // First remove current reaction from counts
        if (currentReaction === 'like') newLikeCount--;
        if (currentReaction === 'dislike') newDislikeCount--;

        // Then add new reaction to counts
        if (newReaction === 'like') newLikeCount++;
        if (newReaction === 'dislike') newDislikeCount++;

        const newQuestionLikes = { ...questionLikesCount, [questionId]: newLikeCount };
        const newQuestionDislikes = { ...questionDislikesCount, [questionId]: newDislikeCount };

        userReactions = newUserReactions;
        questionLikesCount = newQuestionLikes;
        questionDislikesCount = newQuestionDislikes;

        try {
            const response = await fetch(`/api/qa/${questionId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction: newReaction })
            });

            if (response.ok) {
                const result = await response.json();
                // Update with actual stats from server
                if (result.stats) {
                    questionLikesCount[questionId] = result.stats.likes;
                    questionDislikesCount[questionId] = result.stats.dislikes;
                    questionLikesCount = { ...questionLikesCount };
                    questionDislikesCount = { ...questionDislikesCount };
                }
            } else {
                // Revert on error
                // Calculate reverted counts properly
                let revertedLikeCount = questionLikesCount[questionId] ?? 0;
                let revertedDislikeCount = questionDislikesCount[questionId] ?? 0;

                if (newReaction === 'like') revertedLikeCount--;
                if (newReaction === 'dislike') revertedDislikeCount--;
                if (currentReaction === 'like') revertedLikeCount++;
                if (currentReaction === 'dislike') revertedDislikeCount++;

                userReactions = { ...userReactions, [questionId]: currentReaction };
                questionLikesCount = { ...questionLikesCount, [questionId]: revertedLikeCount };
                questionDislikesCount = { ...questionDislikesCount, [questionId]: revertedDislikeCount };
                showToast(t('qa.reactionError') || 'İşlem başarısız', 'error');
            }
        } catch (error) {
            // Revert on error
            // Calculate reverted counts properly
            let revertedLikeCount = questionLikesCount[questionId] ?? 0;
            let revertedDislikeCount = questionDislikesCount[questionId] ?? 0;

            if (newReaction === 'like') revertedLikeCount--;
            if (newReaction === 'dislike') revertedDislikeCount--;
            if (currentReaction === 'like') revertedLikeCount++;
            if (currentReaction === 'dislike') revertedDislikeCount++;

            userReactions = { ...userReactions, [questionId]: currentReaction };
            questionLikesCount = { ...questionLikesCount, [questionId]: revertedLikeCount };
            questionDislikesCount = { ...questionDislikesCount, [questionId]: revertedDislikeCount };
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


    // Track view when expanding question (15 min cooldown per question)
    async function onQuestionExpand(questionId: string) {
        if (expandedQuestionId !== questionId) {
            expandedQuestionId = questionId;
            
            // Check if 15 minutes have passed since last view
            const VIEW_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
            const storageKey = `qa_view_${questionId}`;
            const lastViewTime = localStorage.getItem(storageKey);
            const now = Date.now();
            
            const shouldCountView = !lastViewTime || (now - parseInt(lastViewTime)) > VIEW_COOLDOWN_MS;
            
            if (shouldCountView) {
                // Store current time
                localStorage.setItem(storageKey, now.toString());
                
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
  {@html `<script type="application/ld+json">{"@context":"https://schema.org","@type":"QAPage","name":${JSON.stringify(seoTitle)},"description":${JSON.stringify(seoDescription)},"url":"${siteUrl}/${currentLocale}/qa","mainEntity":{"@type":"Question","name":${JSON.stringify(t('qa.title') || 'Soru & Cevap')}}}</script>`}

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
<div class="w-full absolute top-5.5 xs:top-5 h-40 bg-gradient-to-b from-primary/25 to-background py-12 -z-5"></div>
<div class="container  max-w-3xl min-h-[calc(100vh-8rem)] mx-auto px-4 xl:px-0 py-12">
    <!-- Header -->
    <div class="flex flex-col items-center gap-3">

                        <img class="w-auto xs:h-24 md:h-28" src={logoqa} alt="LAF QA" />
        <h1 class="text-3xl tracking-tight md:text-4xl font-bold flex flex-row items-center">
            {t('QA')}
        
                    </h1>
       
    </div>

    <!-- Action Bar -->
        
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

    <!-- Main Content - Unified View for All -->
        <div>
            <!-- Search & Filter Section using Article-style components -->
            <div class="mx-auto flex flex-row xs:flex-row justify-center items-center max-w-lg gap-3 mt-6 mb-4">
                    <Button size="xs" onclick={() => {
                        if (!showAskForm && !editingQuestionId) {
                            // Opening new question form - generate draft ID for uploads
                            draftQuestionId = nanoid();
                        } else if (showAskForm) {
                            // Closing form - reset draft ID
                            draftQuestionId = null;
                        }
                        showAskForm = !showAskForm;
                    }} variant={showAskForm ? 'secondary' : 'default'}>
                        <MessageCircle class="w-4 h-4" />
                        {showAskForm ? 'İptal' : 'Soru Sor'}
                    </Button>
                <!-- Search Input with Suggestions -->
                <QASearch
                    value={searchQuery}
                    onSearch={(query) => {
                        searchQuery = query;
                        currentPage = 1;
                        // No need to call applyFiltersAndSearch - filteredQuestions is $derived and auto-updates
                    }}
                    onClear={() => {
                        searchQuery = '';
                        currentPage = 1;
                        // No need to call applyFiltersAndSearch - filteredQuestions is $derived and auto-updates
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
                        customDateRange: dateRangeFilter,
                        status: statusFilter,
                        nickname: nicknameFilter,
                        onlyFollowing: onlyFollowingFilter,
                        sort: sortBy
                    }}
                    onFiltersChange={(filters) => {
                        selectedTopicFilter = filters.topic || '';
                        dateRangeFilter = filters.customDateRange;
                        statusFilter = filters.status || '';
                        nicknameFilter = filters.nickname || '';
                        onlyFollowingFilter = filters.onlyFollowing || false;
                        currentPage = 1;
                        // Handle sort change - client-side only
                        if (filters.sort && filters.sort !== sortBy) {
                            sortBy = filters.sort;
                        }
                        // All filters and sorting are now client-side only
                        // filteredQuestions will auto-update via $derived
                    }}
                    enableStatusFilter={isModerator}
                    enableFollowingFilter={!!user}
                />
            </div>

            <!-- Inline Ask Form (Twitter/X style) - Inside Accordion -->
            {#if showAskForm}
                <div id="ask-form-container" class="mb-6 transition-all duration-200">
                    <Accordion.Root type="single" value="ask-form" class="border border-border rounded-sm overflow-hidden">
                        <Accordion.Item value="ask-form" class="border-0">
                            <Accordion.Trigger class="py-3 px-4 hover:no-underline w-full justify-start gap-2 text-left bg-background">
                                <MessageCircle class="w-4 h-4 text-muted-foreground" />
                                <span class="text-xs font-medium">{editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru'}</span>
                            </Accordion.Trigger>
                            <Accordion.Content class="pb-0">
                                <Card class="bg-background border-0 overflow-hidden">
                                    <div class="flex">
                                        <!-- Sidebar - Same as question card -->
                                        <div class="hidden md:flex flex-col items-center gap-1 py-1 px-1 md:px-2 md:py-2 border-r border-border/60 md:min-w-[44px] min-w-[36px] shrink-0">
                                            <Avatar.Root class="h-8 w-8">
                                                {#if (user as any)?.avatar}
                                                    <Avatar.Image src={(user as any).avatar} alt={user?.username || 'Kullanıcı'} />
                                                {/if}
                                                <Avatar.Fallback class="bg-primary/10 text-primary text-xs">
                                                    {user ? (user.username?.[0] || 'U').toUpperCase() : '?'}
                                                </Avatar.Fallback>
                                            </Avatar.Root>
                                        </div>
                                        
                                        <!-- Content Area -->
                                        <div class="flex-1 min-w-0 p-3 md:p-4 space-y-3">
                                            <!-- Topic Selection (inline) -->
                                            <div class="flex items-center gap-2">
                                                <Select.Root type="single" bind:value={questionTopicId}>
                                                    <Select.Trigger class="w-auto h-8 text-xs px-2 py-1">
                                                        <span class="text-muted-foreground">{questionTopicId ? topics.find((t: any) => t.id === questionTopicId)?.name : '+ Konu ekle'}</span>
                                                    </Select.Trigger>
                                                    <Select.Content class="z-50">
                                                        <Select.Item value="">Konu seçin</Select.Item>
                                                        {#each topics as topic (topic.id)}
                                                            <Select.Item value={topic.id}>{topic.name}</Select.Item>
                                                        {/each}
                                                    </Select.Content>
                                                </Select.Root>
                                            </div>
                                            
                                            <!-- Title Input -->
                                            <Input
                                                bind:value={questionTitle}
                                                placeholder="Sorunuzın başlığı..."
                                                maxlength="50"
                                            />
                                            
                                            <!-- Content Editor -->
                                            <div class="border rounded-sm overflow-hidden bg-background">
                                                <EdraToolBar editor={questionEditor} />
                                                <EdraEditor
                                                    bind:editor={questionEditor}
                                                    content={questionContent}
                                                    onUpdate={() => {
                                                        if (questionEditor) {
                                                            questionContent = questionEditor.getJSON();
                                                            questionCharCount = calculateCharCount(questionContent);
                                                            if (questionCharCount > QUESTION_CHAR_LIMIT) {
                                                                showToast(`Soru içeriği ${QUESTION_CHAR_LIMIT} karakter limitini aşıyor (Linkler 1 harf sayılır)`, 'error');
                                                            }
                                                        }
                                                    }}
                                                    qaId={editingQuestionId || draftQuestionId}
                                                    class="min-h-[150px] max-h-[300px] overflow-y-auto p-3 text-xs"
                                                />
                                                <div class="px-3 py-1 text-xs text-muted-foreground text-right border-t bg-muted/30">
                                                    <span class={questionCharCount > QUESTION_CHAR_LIMIT ? 'text-red-500 font-medium' : ''}>
                                                        {questionCharCount}/{QUESTION_CHAR_LIMIT} (linkler 1 harf)
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <!-- Guest Info (if not logged in) -->
                                            {#if !user}
                                                <div class="grid grid-cols-2 gap-3 pt-2">
                                                    <Input 
                                                        bind:value={questionAuthorName}
                                                        placeholder="İsminiz"
                                                        class="h-9 text-xs"
                                                    />
                                                    <Input 
                                                        bind:value={questionAuthorEmail}
                                                        type="email"
                                                        placeholder="E-posta"
                                                        class="h-9 text-xs"
                                                    />
                                                </div>
                                            {/if}
                                            
                                            <!-- Anonymous Option -->
                                            {#if user && !editingQuestion}
                                                <div class="flex items-center gap-2 pt-2">
                                                    <input 
                                                        type="checkbox" 
                                                        id="anonymous" 
                                                        bind:checked={isAnonymous}
                                                        class="rounded border-gray-300"
                                                    />
                                                    <Label for="anonymous" class="cursor-pointer text-xs text-muted-foreground">
                                                        Anonim olarak sor
                                                    </Label>
                                                </div>
                                            {/if}
                                            
                                            <!-- Action Buttons -->
                                            <div class="flex justify-end gap-2 pt-3">
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    onclick={() => {
                                                        showAskForm = false;
                                                        editingQuestion = null;
                                                        editingQuestionId = null;
                                                        draftQuestionId = null;
                                                        questionTitle = '';
                                                        questionContent = { type: 'doc', content: [{ type: 'paragraph' }] };
                                                        questionEditor = null;
                                                        questionTopicId = '';
                                                    }}
                                                >
                                                    İptal
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    onclick={submitQuestion}
                                                    disabled={isSubmitting || !questionTitle.trim() || questionTitle.trim().length < 5}
                                                    class="gap-2"
                                                >
                                                    {#if isSubmitting}
                                                        <Loader2 class="w-4 h-4 animate-spin" />
                                                        {editingQuestion ? 'Güncelleniyor...' : 'Gönderiliyor...'}
                                                    {:else}
                                                        <Send class="w-4 h-4" />
                                                        {editingQuestion ? 'Güncelle' : 'Soruyu Gönder'}
                                                    {/if}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                </div>
            {/if}

            <!-- Questions List -->
            {#if filteredQuestions.length === 0}
                <Card class="bg-background border-none">
                    <CardContent class="py-12 text-center">
                        <HelpCircle class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        {#if sortBy === 'unanswered'}
                            <p class="text-muted-foreground mb-4">Tüm sorular cevaplandı! 🎉</p>
                            <p class="text-xs text-muted-foreground mb-4">Cevap bekleyen soru bulunmuyor.</p>
                        {:else if sortBy === 'popular'}
                            <p class="text-muted-foreground mb-4">Henüz popüler soru bulunmuyor</p>
                            <p class="text-xs text-muted-foreground mb-4">Beğeni ve görüntülenme sayısı yüksek sorular burada görünecek.</p>
                        {:else}
                            <p class="text-muted-foreground mb-4">Henüz yayınlanmış soru yok</p>
                        {/if}
                        <Button onclick={() => showAskForm = true}>İlk Soruyu Siz Sorun</Button>
                    </CardContent>
                </Card>
            {:else}
                            <div class="flex flex-col gap-4">

                    {#each paginatedQuestions as question (question.id)}
                        {@const userReaction = userReactions[question.id] || null}
                        <Card class="overflow-hidden p-0 bg-background ">
                            <div class="flex">
                                <!-- Like/Dislike Sidebar -->
                                <div class="flex flex-col items-center gap-1 py-1 px-1 md:px-2 md:py-2 border-r border-border/60 md:min-w-[44px] min-w-[36px] shrink-0">
                                    <!-- Like Button -->
                                    <Button
                                        variant={userReaction === 'like' ? 'default' : 'ghost'}
                                        size="icon"
                                        class={cn(
                                            'h-6 w-6 transition-all duration-200',
                                            userReaction === 'like' && 'bg-primary text-primary-foreground'
                                        )}
                                        onclick={() => toggleReaction(question.id, 'like')}
                                    >
                                        <ThumbsUp
                                            size={14}
                                            class={cn(
                                                'transition-all duration-200',
                                                userReaction === 'like' && 'fill-current'
                                            )}
                                        />
                                    </Button>
                                    <span class="font-semibold text-xs">{formatNumber(questionLikesCount[question.id] ?? question.likeCount ?? 0)}</span>

                                    <!-- Dislike Button -->
                                    <Button
                                        variant={userReaction === 'dislike' ? 'default' : 'ghost'}
                                        size="icon"
                                        class={cn(
                                            'h-6 w-6 transition-all duration-200',
                                            userReaction === 'dislike' &&
                                                'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                                        )}
                                        onclick={() => toggleReaction(question.id, 'dislike')}
                                    >
                                        <ThumbsDown
                                            size={14}
                                            class={cn(
                                                'transition-all duration-200',
                                                userReaction === 'dislike' && 'fill-current'
                                            )}
                                        />
                                    </Button>
                                    <span class="font-semibold text-xs">{formatNumber(questionDislikesCount[question.id] ?? question.dislikeCount ?? 0)}</span>

                                    <!-- Unified Actions Menu -->
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger class="h-5 w-5 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground mt-0.5">
                                            <MoreVertical class="w-3 h-3" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content class="text-xs">
                                            <!-- Everyone can see: Share & View -->
                                            <DropdownMenu.Item onclick={() => shareQuestion(question)}>
                                                <Share2 class="w-4 h-4 " />
                                                Paylaş
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item>
                                                <a href="/{lang}/qa/{question.slug}" data-sveltekit-preload-data="hover" class="!no-underline flex items-center w-full">
                                                    <ViewIcon class="w-4 h-4 " />
                                                    Detaylı görüntüle
                                                </a>
                                            </DropdownMenu.Item>
                                            
                                            <!-- Logged-in users: Report & Answer (if not owner) -->
                                            {#if user}
                                                <DropdownMenu.Separator />
                                                <!-- Answer option (only if question is not user's own) -->
                                                {@const isQuestionOwnerCheck = (user?.id && (question.authorId == user.id || question.author?.id == user.id)) || (user?.username && question.author?.username === user.username)}
                                                {#if !isQuestionOwnerCheck}
                                                    <DropdownMenu.Item onclick={() => openAnswerForm(question)}>
                                                        <MessageCircle class="w-4 h-4 " />
                                                        Cevapla
                                                    </DropdownMenu.Item>
                                                {/if}
                                                <DropdownMenu.Item onclick={() => openReportDrawer(question)}>
                                                    <Flag class="w-4 h-4 " />
                                                    Bildir
                                                </DropdownMenu.Item>
                                            {/if}
                                            
                                            <!-- Question Owner: Edit & Delete -->
                                            {#if user?.id && (question.authorId == user.id || question.author?.id == user.id)}
                                                <DropdownMenu.Separator />
                                                <DropdownMenu.Label>Sizin Sorunuz</DropdownMenu.Label>
                                                <DropdownMenu.Item onclick={() => openEditQuestionDialog(question)}>
                                                    <Pencil class="w-4 h-4 " />
                                                    Düzenle
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item onclick={() => openDeleteDialog('question', question.id)} class="text-destructive">
                                                    <Trash2 class="w-4 h-4 " />
                                                    Sil
                                                </DropdownMenu.Item>
                                            {/if}

                                            <!-- Moderators/Admins: Moderation Actions -->
                                            {#if user && (user.role === 'moderator' || user.role === 'admin')}
                                                <DropdownMenu.Separator />
                                                <DropdownMenu.Label>Moderasyon</DropdownMenu.Label>
                                                {#if question.status === 'pending'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'publish')}>
                                                        <Eye class="w-4 h-4 " />
                                                        Yayınla
                                                    </DropdownMenu.Item>
                                                {:else if question.status === 'published'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'unpublish')}>
                                                        <Eye class="w-4 h-4 " />
                                                        Yayından Kaldır
                                                    </DropdownMenu.Item>
                                                {:else if question.status === 'answered'}
                                                    <DropdownMenu.Item onclick={() => moderateQuestion(question.id, 'publish')}>
                                                        <Eye class="w-4 h-4 " />
                                                        Yayınla
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if isModerator && question.status === 'answered'}
                                                    <DropdownMenu.Item onclick={() => openAnswerForm(question, question.answers?.[0])}>
                                                        <Pencil class="w-4 h-4 " />
                                                        Cevabı Düzenle
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if !(user?.id && (question.authorId == user.id || question.author?.id == user.id))}
                                                    <DropdownMenu.Item onclick={() => openDeleteDialog('question', question.id)} class="text-destructive">
                                                        <Trash2 class="w-4 h-4 " />
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
                                        <a href="/{lang}/qa/{question.slug}" data-sveltekit-preload-data="hover" class="font-semibold text-xs md:text-sm hover:text-primary !no-underline cursor-pointer block leading-snug">
                                            {question.title}
                                        </a>

                                        <div class="text-xs md:text-xs text-muted-foreground leading-relaxed line-clamp-3">
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
                                                            class="w-24 h-24 object-cover rounded-sm border hover:opacity-90 transition-opacity"
                                                        />
                                                    </button>
                                                {/each}
                                                {#if questionImages.length > 3}
                                                    <button
                                                        type="button"
                                                        onclick={() => openImageModal(questionImages, 3)}
                                                        class="flex items-center justify-center w-24 h-24 rounded-sm border bg-muted text-muted-foreground text-xs md:text-xs font-medium hover:bg-muted/80 transition-colors cursor-pointer"
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
                                                {#if question.isAnonymous}
                                                    <Avatar.Root class="h-5 w-5">
                                                        <Avatar.Fallback class="text-[10px] bg-muted">?</Avatar.Fallback>
                                                    </Avatar.Root>
                                                    <span class="text-xs text-muted-foreground">Anonim</span>
                                                {:else}
                                                    {@const questionAuthorSlug = question.author?.username || question.author?.nickname}
                                                    <a href="/{lang}/{questionAuthorSlug}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                        <Avatar.Root class="h-5 w-5">
                                                            {#if question.author?.avatar}
                                                                <Avatar.Image src={question.author.avatar} alt={question.authorName || 'Kullanıcı'} />
                                                            {/if}
                                                            <Avatar.Fallback class="text-[10px] bg-muted">
                                                                {(question.authorName?.[0] || 'U').toUpperCase()}
                                                            </Avatar.Fallback>
                                                        </Avatar.Root>
                                                        <span class="text-xs text-muted-foreground hover:text-primary transition-colors">
                                                            {question.authorName || 'İsimsiz'}
                                                        </span>
                                                    </a>
                                                {/if}
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
                                                <Button size="xs" onclick={() => openAnswerForm(question)} class="gap-1 h-7">
                                                    <MessageCircle class="w-3.5 h-3.5" />
                                                    Cevapla
                                                </Button>
                                            </div>
                                        {/if}

                                                    {#if question.answers?.length === 0}
                                                        <!-- No Answer Section -->
                                                        <div class="mt-4">
                                                            {#if !answeringQuestionId && user && !question.hasUserAnswered}
                                                                <!-- Any logged-in user who hasn't answered can answer -->
                                                                <Button 
                                                                    size="xs" 
                                                                    variant="outline"
                                                                    onclick={() => openAnswerForm(question)}
                                                                    class="gap-2"
                                                                >
                                                                    <MessageCircle class="w-4 h-4" />
                                                                    Cevap Ver
                                                                </Button>
                                                            {:else if !answeringQuestionId}
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

                        <!-- Answer Form Section (Outside Card - Standalone Accordion) -->
                        {#if answeringQuestionId === question.id && !editingAnswerId}
                            <Accordion.Root type="single" value="answer-form-{question.id}" class="border border-border rounded-sm overflow-hidden -mt-3 mb-2">
                                <Accordion.Item value="answer-form-{question.id}" class="border-0">
                                    <Accordion.Trigger class="py-3 px-4 hover:no-underline w-full justify-start gap-2 text-left bg-background">
                                        <MessageCircle class="w-4 h-4 text-muted-foreground" />
                                        <span class="text-xs font-medium">Cevap yaz</span>
                                    </Accordion.Trigger>
                                    <Accordion.Content class="pb-0">
                                            <div class="flex flex-col p-1">
                                
                                                    <!-- Content Editor -->
                                                    <div class="border rounded-sm overflow-hidden bg-background">
                                                        <EdraToolBar editor={answerEditors[question.id]}/>
                                                        <EdraEditor
                                                            bind:editor={answerEditors[question.id]}
                                                            content={answerContent}
                                                            onUpdate={() => {
                                                                if (answerEditors[question.id]) {
                                                                    const currentContent = answerEditors[question.id].getJSON();
                                                                    answerCharCounts[question.id] = calculateCharCount(currentContent);
                                                                    if (answerCharCounts[question.id] > ANSWER_CHAR_LIMIT) {
                                                                        showToast(`Cevap içeriği ${ANSWER_CHAR_LIMIT} karakter limitini aşıyor (Linkler 1 harf sayılır)`, 'error');
                                                                    }
                                                                }
                                                            }}
                                                            qaId={question.id}
                                                            class="min-h-[120px] max-h-[250px] overflow-y-auto p-3 text-xs"
                                                        />
                                                        <div class="px-3 py-1 text-xs text-muted-foreground text-right border-t bg-muted/30">
                                                            <span class={(answerCharCounts[question.id] || 0) > ANSWER_CHAR_LIMIT ? 'text-red-500 font-medium' : ''}>
                                                                {answerCharCounts[question.id] || 0}/{ANSWER_CHAR_LIMIT} (linkler 1 harf)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Publish Options (Moderators only) -->
                                                    {#if isModerator}
                                                        <div class="flex items-center gap-2 pt-2">
                                                            <input 
                                                                type="checkbox" 
                                                                id="publishImmediately-{question.id}" 
                                                                bind:checked={publishImmediately}
                                                                class="rounded border-gray-300"
                                                            />
                                                            <Label for="publishImmediately-{question.id}" class="cursor-pointer text-xs text-muted-foreground">
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
                                                            onclick={() => {
                                                                console.log('Submit answer clicked', question.id, editingAnswerId);
                                                                submitAnswer(question.id, editingAnswerId || undefined);
                                                            }}
                                                            disabled={isAnswering}
                                                            class="gap-2"
                                                        >
                                                            {#if isAnswering}
                                                                <Loader2 class="w-4 h-4 animate-spin" />
                                                                Gönderiliyor...
                                                            {:else}
                                                                <Send class="w-4 h-4" />
                                                                Cevapla
                                                            {/if}
                                                        </Button>
                                                    </div>
                                                </div>
                                    </Accordion.Content>
                                </Accordion.Item>
                            </Accordion.Root>
                        {/if}

                        <!-- Answer Section (Outside Card) -->
                        {#if question.answers?.length > 0}
                        {@const firstAnswer = question.answers[0]}
                        <Accordion.Root type="single" bind:value={accordionValue} class="border-x border-b border-border/60 rounded-b-sm -mt-5 overflow-hidden">
                            <Accordion.Item value="answer-{question.id}" class="border-0">
                                <Accordion.Trigger
                                    class="py-3 px-3 md:px-6 hover:no-underline w-full justify-start gap-2 text-left [&[data-state=open]>svg]:rotate-180"
                                    onclick={() => onQuestionExpand(question.id)}
                                >
                                    <span class="text-xs flex items-center gap-2 font-medium">
                                        <span class="text-muted-foreground">
                                            {question.answers.length} Cevap görüntüle
                                        </span>
                                    </span>
                                </Accordion.Trigger>
                                <Accordion.Content class="pb-0 px-0">
                                    <div class="px-0">
                                        <!-- Loop through all answers -->
                                        {#each question.answers as answer, answerIndex}
                                        {@const answerReaction = answerReactions[answer.id] || null}
                                        {@const answerAuthorName = answer?.author?.nickname || answer?.author?.username || 'Moderatör'}
                                        <div class="{answerIndex > 0 ? 'border-t border-border/60 mt-4 pt-4' : ''}">
                                            <!-- Answer Content -->
                                            <div class="flex bg-background/50">
                                                <!-- Answer Actions Sidebar (Like/Dislike) - Matches Question Sidebar -->
                                                <div class="flex flex-col items-center gap-1 py-1 px-1 md:px-2 md:py-2 border-r border-border/60 md:min-w-[44px] min-w-[36px] shrink-0">
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <Button
                                                                variant={answerReaction === 'like' ? 'default' : 'ghost'}
                                                                size="icon"
                                                                class={cn(
                                                                    'h-6 w-6 transition-all duration-200',
                                                                    answerReaction === 'like' && 'bg-primary text-primary-foreground'
                                                                )}
                                                                onclick={() => toggleAnswerReaction(answer.id, 'like')}
                                                                disabled={!user}
                                                            >
                                                                <ThumbsUp
                                                                    size={14}
                                                                    class={cn(
                                                                        'transition-all duration-200',
                                                                        answerReaction === 'like' && 'fill-current'
                                                                    )}
                                                                />
                                                            </Button>
                                                        </Tooltip.Trigger>
                                                        {#if !user}
                                                            <Tooltip.Content>
                                                                <p>Beğenmek için giriş yapmalısınız</p>
                                                            </Tooltip.Content>
                                                        {/if}
                                                    </Tooltip.Root>
                                                    <span class="font-semibold text-xs">{formatNumber(answerLikesCount[answer.id] ?? answer.likeCount ?? 0)}</span>

                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <Button
                                                                variant={answerReaction === 'dislike' ? 'default' : 'ghost'}
                                                                size="icon"
                                                                class={cn(
                                                                    'h-6 w-6 transition-all duration-200',
                                                                    answerReaction === 'dislike' &&
                                                                        'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300'
                                                                )}
                                                                onclick={() => toggleAnswerReaction(answer.id, 'dislike')}
                                                                disabled={!user}
                                                            >
                                                                <ThumbsDown
                                                                    size={14}
                                                                    class={cn(
                                                                        'transition-all duration-200',
                                                                        answerReaction === 'dislike' && 'fill-current'
                                                                    )}
                                                                />
                                                            </Button>
                                                        </Tooltip.Trigger>
                                                        {#if !user}
                                                            <Tooltip.Content>
                                                                <p>Beğenmemek için giriş yapmalısınız</p>
                                                            </Tooltip.Content>
                                                        {/if}
                                                    </Tooltip.Root>
                                                    <span class="font-semibold text-xs">{formatNumber(answerDislikesCount[answer.id] ?? answer.dislikeCount ?? 0)}</span>

                                                    <!-- Dropdown Menu for all users -->
                                                    <DropdownMenu.Root>
                                                        <DropdownMenu.Trigger class="h-5 w-5 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                                                            <MoreVertical class="w-3 h-3" />
                                                        </DropdownMenu.Trigger>
                                                        <DropdownMenu.Content class="text-xs">
                                                            {@const isAnswerOwner = (user?.id && (answer?.authorId === user.id || answer?.author?.id === user.id)) || (user?.username && answer?.author?.username === user.username)}
                                                            
                                                            {#if isAnswerOwner}
                                                                <DropdownMenu.Label>Sizin Cevabınız</DropdownMenu.Label>
                                                                <DropdownMenu.Item onclick={() => openAnswerForm(question, answer)}>
                                                                    <Pencil class="w-4 h-4 " />
                                                                    Düzenle
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Item onclick={() => openDeleteDialog('answer', question.id, answer.id)} class="text-destructive">
                                                                    <Trash2 class="w-4 h-4 " />
                                                                    Sil
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Separator />
                                                            {/if}

                                                            {#if user && (user.role === 'moderator' || user.role === 'admin')}
                                                                <DropdownMenu.Label>Moderasyon</DropdownMenu.Label>
                                                                {#if !isAnswerOwner}
                                                                    <DropdownMenu.Item onclick={() => openAnswerForm(question, answer)}>
                                                                        <Pencil class="w-4 h-4 " />
                                                                        Düzenle
                                                                    </DropdownMenu.Item>
                                                                {/if}
                                                                {#if question.acceptedAnswerId === answer.id}
                                                                    <DropdownMenu.Item onclick={() => acceptAnswer(answer.id, question)} class="text-yellow-600">
                                                                        <Award class="w-4 h-4 " />
                                                                        En İyi Cevabı Kaldır
                                                                    </DropdownMenu.Item>
                                                                {:else}
                                                                    <DropdownMenu.Item onclick={() => acceptAnswer(answer.id, question)} class="text-green-600">
                                                                        <Award class="w-4 h-4 " />
                                                                        En İyi Cevap Seç
                                                                    </DropdownMenu.Item>
                                                                {/if}
                                                                {#if !isAnswerOwner}
                                                                    <DropdownMenu.Item onclick={() => openDeleteDialog('answer', question.id, answer.id)} class="text-destructive">
                                                                        <Trash2 class="w-4 h-4 " />
                                                                        Sil
                                                                    </DropdownMenu.Item>
                                                                {/if}
                                                                <DropdownMenu.Separator />
                                                            {/if}
                                                            {#if user}
                                                                <DropdownMenu.Item onclick={() => openReportDrawer({...question, reportType: 'answer', answerId: answer.id})}>
                                                                    <Flag class="w-4 h-4 " />
                                                                    Bildir
                                                                </DropdownMenu.Item>
                                                            {/if}
                                                            <DropdownMenu.Item onclick={() => shareQuestion(question)}>
                                                                <Share2 class="w-4 h-4 " />
                                                                Paylaş
                                                            </DropdownMenu.Item>
                                                        </DropdownMenu.Content>
                                                    </DropdownMenu.Root>
                                                </div>

                                                <div class="flex flex-col py-2 px-3 md:px-6 md:py-4 gap-3 md:gap-4 flex-1 min-w-0">
                                                    {#if editingAnswerId === answer.id}
                                                        <!-- Edit Mode - Inline Form -->
                                                        <div class="space-y-3">
                                                            <!-- Content Editor -->
                                                            <div class="border rounded-sm overflow-hidden bg-background">
                                                                <EdraToolBar editor={answerEditors[question.id]}  />
                                                                <EdraEditor
                                                                    bind:editor={answerEditors[question.id]}
                                                                    content={answerContent}
                                                                    onUpdate={() => {
                                                                        if (answerEditors[question.id]) {
                                                                            const currentContent = answerEditors[question.id].getJSON();
                                                                            answerCharCounts[question.id] = calculateCharCount(currentContent);
                                                                            if (answerCharCounts[question.id] > ANSWER_CHAR_LIMIT) {
                                                                                showToast(`Cevap içeriği ${ANSWER_CHAR_LIMIT} karakter limitini aşıyor (Linkler 1 harf sayılır)`, 'error');
                                                                            }
                                                                        }
                                                                    }}
                                                                    qaId={question.id}
                                                                    class="min-h-[120px] max-h-[250px] overflow-y-auto p-3 text-xs"
                                                                />
                                                                <div class="px-3 py-1 text-xs text-muted-foreground text-right border-t bg-muted/30">
                                                                    <span class={(answerCharCounts[question.id] || 0) > ANSWER_CHAR_LIMIT ? 'text-red-500 font-medium' : ''}>
                                                                        {answerCharCounts[question.id] || 0}/{ANSWER_CHAR_LIMIT} (linkler 1 harf)
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <!-- Action Buttons -->
                                                            <div class="flex justify-end gap-2 pt-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="xs"
                                                                    onclick={() => { editingAnswerId = null; cancelAnswerForm(); }}
                                                                >
                                                                    İptal
                                                                </Button>
                                                                <Button
                                                                    size="xs"
                                                                    onclick={() => submitAnswer(question.id, answer.id)}
                                                                    disabled={isAnswering}
                                                                    class="gap-2"
                                                                >
                                                                    {#if isAnswering}
                                                                        <Loader2 class="w-4 h-4 animate-spin" />
                                                                        Güncelleniyor...
                                                                    {:else}
                                                                        <Send class="w-4 h-4" />
                                                                        Güncelle
                                                                    {/if}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    {:else}
                                                        {@const answerAuthorSlug = answer?.author?.username || answer?.author?.nickname}
                                                        <!-- View Mode - Normal Content -->
                                                        <!-- Answer Content -->
                                                        <div class="text-xs leading-relaxed prose prose-xs max-w-none text-foreground/90">
                                                            {@html answer.contentHtml}
                                                        </div>

                                                        <!-- Answer Author Row - Same layout as question -->
                                                        <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/60">
                                                            <div class="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span class="flex items-center gap-1">
                                                                    <Clock class="w-3.5 h-3.5" />
                                                                    {formatDate(answer.createdAt)}
                                                                </span>
                                                                {#if question.acceptedAnswerId === answer.id}
                                                                    <Badge variant="default" class="h-4 text-[10px] px-1 bg-green-500">
                                                                        <Award class="w-3 h-3 mr-1" />
                                                                        En İyi
                                                                    </Badge>
                                                                {/if}
                                                            </div>

                                                            <div class="flex items-center gap-2">
                                                                {#if answerAuthorSlug}
                                                                    <a href="/{lang}/{answerAuthorSlug}" class="!no-underline flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                                        <Avatar.Root class="h-5 w-5">
                                                                            {#if answer?.author?.avatar}
                                                                                <Avatar.Image src={answer.author.avatar} alt={answerAuthorName} />
                                                                            {/if}
                                                                            <Avatar.Fallback class="text-[10px] bg-muted">
                                                                                {answerAuthorName[0]?.toUpperCase() || 'M'}
                                                                            </Avatar.Fallback>
                                                                        </Avatar.Root>
                                                                        <span class="text-xs text-muted-foreground !no-underline hover:text-primary transition-colors">
                                                                            {answerAuthorName}
                                                                        </span>
                                                                    </a>
                                                                {:else}
                                                                    <Avatar.Root class="h-5 w-5">
                                                                        {#if answer?.author?.avatar}
                                                                            <Avatar.Image src={answer.author.avatar} alt={answerAuthorName} />
                                                                        {/if}
                                                                        <Avatar.Fallback class="text-[10px] bg-muted">
                                                                            {answerAuthorName[0]?.toUpperCase() || 'M'}
                                                                        </Avatar.Fallback>
                                                                    </Avatar.Root>
                                                                    <span class="text-xs text-muted-foreground">{answerAuthorName}</span>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                        {/each}

                                        {#if !answeringQuestionId && user && !question.hasUserAnswered}
                                            <div class="mt-4 pt-4 border-t border-border/60 flex justify-center">
                                                <Button 
                                                    size="xs" 
                                                    variant="outline"
                                                    onclick={() => openAnswerForm(question)}
                                                    class="gap-2"
                                                >
                                                    <MessageCircle class="w-4 h-4" />
                                                    Sen de Cevapla
                                                </Button>
                                            </div>
                                        {/if}
                                    </div>
                                </Accordion.Content>
                            </Accordion.Item>
                        </Accordion.Root>
                        {/if}
                    {/each}
                    </div>

                <!-- Pagination -->
                {#if totalPages > 1}
                    <div class="flex justify-center gap-2 mt-8">
                        <Button
                            size="xs"
                            variant="outline"
                            disabled={currentPage <= 1}
                            onclick={() => {
                                currentPage--;
                                // Only fetch from API when no client-side filters active
                                if (!hasClientSideFilters) {
                                    refreshPublicQuestions();
                                }
                            }}
                        >
                            Önceki
                        </Button>
                        <span class="flex items-center px-4 text-xs text-muted-foreground">
                            Sayfa {currentPage} / {totalPages}
                        </span>
                        <Button
                            size="xs"
                            variant="outline"
                            disabled={currentPage >= totalPages}
                            onclick={() => {
                                currentPage++;
                                // Only fetch from API when no client-side filters active
                                if (!hasClientSideFilters) {
                                    refreshPublicQuestions();
                                }
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
                class="max-w-[90vw] max-h-[90vh] object-contain rounded-sm"
            />

            <!-- Image counter -->
            {#if currentQuestionImages.length > 1}
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-xs">
                    {currentImageIndex + 1} / {currentQuestionImages.length}
                </div>
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>

<Footer />
