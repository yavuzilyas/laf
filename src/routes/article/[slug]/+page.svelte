<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import Lens from "$lib/components/Lens.svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';
    import { onMount } from 'svelte';
    import { EdraEditor, EdraToolBar } from '$lib/components/edra/shadcn/index.js';
    import type { Editor } from '@tiptap/core';
    import ProfileCard from "$lib/components/ProfileCard.svelte";
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
        ThumbsUp,
        Hammer,
        Ellipsis,
        Trash,

    } from "@lucide/svelte";  
    import { cn } from "$lib/utils";
    import { page } from "$app/stores";
    import { showToast, persistToast } from "$lib/hooks/toast";
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import { ArrowLeftIcon, MessageSquareIcon, EllipsisIcon, BookMinusIcon, NotebookPenIcon, EyeOffIcon, BadgeAlertIcon } from 'svelte-animate-icons';
    import { Motion, useMotionValue, useMotionTemplate } from "svelte-motion";
    import { browser } from '$app/environment';
    import ReportDrawer from "$lib/components/ReportDrawer.svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
        import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    
    let { data } = $props();
    let likesCount = $state<number>(Number(data.article?.stats?.likes) || 0);
    let dislikesCount = $state<number>(Number(data.article?.stats?.dislikes) || 0);
    let reaction = $state<'like' | 'dislike' | null>(null);
    let showReportDrawer = $state(false);
    // Get current locale and set up reactive article content

    let currentLocale = $state(getCurrentLocale());
    
    let profileUser = data.profileUser;
    const currentUserId = data.currentUser?.id;
    const profileNicknameSlug = $derived(() => {
        const value = profileUser?.nickname || profileUser?.id || 'user';
        return value
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'user';
    });
    const profileUserId = $derived(profileUser?._id || profileUser?.id);
    const serverArticles = data.articles ?? [];
    let stats = data.stats;
    let isOwnProfile = data.isOwnProfile;
    let isFollowingMe = data.isFollowingMe ?? false;
    let followersList = $state(data.followersList ?? []);
    let followingList = $state(data.followingList ?? []);
    
    // Track URL changes and reload when nickname changes
    onMount(() => {
        let previousNickname = $page.params.nickname;
        
        return afterNavigate(({ to }) => {
            const newNickname = to?.params.nickname;
            if (newNickname && newNickname !== previousNickname) {
                previousNickname = newNickname;
                // Force a full page reload to ensure all data is refreshed
                window.location.href = to.url.href;
            }
        });
    });
    let viewerBlocksProfile = data.viewerBlocksProfile ?? false;

    // Reactive articles based on current locale (using $derived rune)
    const articles = $derived(
        serverArticles.map((article) => {
            const translations = article.translations || {};
            const translationKeys = Object.keys(translations);
            const currentLocale = getCurrentLocale();
            const fallbackKey = translationKeys[0] || article.language || article.defaultLanguage || 'tr';
            const displayLanguage = currentLocale && translations[currentLocale]
                ? currentLocale
                : fallbackKey;

            const translation = translations[displayLanguage] || translations[fallbackKey] || {};

            return {
                ...article,
                title: translation.title || article.title || 'Başlıksız',
                excerpt: translation.excerpt || article.excerpt || '',
                slug: translation.slug || article.slug,
                language: displayLanguage,
                translations
            };
        })
    );

    const availableLanguages = Array.from(new Set(serverArticles.flatMap((article) => article.availableLanguages || [])));
    const categoryOptions = Array.from(new Set(serverArticles.map((article) => article.category).filter(Boolean)));
    const tagOptions = Array.from(new Set(serverArticles.flatMap((article) => article.tags || [])));

    let filteredArticles = $state([...articles]);
    let displayedArticles = $state([...articles]);
    let searchQuery = $state('');
    let activeFilters = $state<any>({
        language: '',
        category: '',
        type: '',
        customDateRange: undefined,
        tags: []
    });
    let loadingArticles = $state(false);
    let hasMore = $state(false);

    // Profile editing state (only for own profile)
    let isEditing = $state(false);
    let isSaving = $state(false);

    const DEFAULT_BANNER_COLOR = '#fac800';

    // Avatar upload state
    let avatarUploading = $state(false);
    const avatarInputId = `profile-avatar-input-${Math.random().toString(36).substr(2, 9)}`;

    // Banner upload state
    let bannerUploading = $state(false);
    const bannerInputId = `profile-banner-input-${Math.random().toString(36).substr(2, 9)}`;

    // Follow/block state
    let isFollowing = $state(false);
    let isBlocked = $state(viewerBlocksProfile);
    let isBlockedChanging = $state(false);
    let followersCount = $state(
        Array.isArray(profileUser?.followers)
            ? profileUser.followers.length
            : profileUser?.followersCount ?? 0
    );
    let followingCount = $state(
        Array.isArray(profileUser?.following)
            ? profileUser.following.length
            : profileUser?.followingCount ?? 0
    );

    const triggerAvatarFileDialog = () => {
        if (typeof document === "undefined") return;
        const input = document.getElementById(avatarInputId) as HTMLInputElement | null;
        input?.click();
    };

    const handleAvatarUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const maxBytes = 4 * 1024 * 1024;
        if (file.size > maxBytes) {
            alert(t('profile.avatarSizeError'));
            input.value = "";
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert(t('profile.avatarTypeError'));
            input.value = "";
            return;
        }

        avatarUploading = true;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'avatars');
            if (profileData.avatar) {
                formData.append('previousUrl', profileData.avatar);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const result = await response.json();
            const newAvatarUrl = result.url;
            profileData.avatar = newAvatarUrl;

            const saved = await persistProfileUpdate({ avatar: newAvatarUrl });
            if (!saved) {
                profileData.avatar = previous;
                throw new Error('Failed to persist avatar');
            }

            profileUser = { ...profileUser, avatar: newAvatarUrl };
        } catch (error) {
            console.error('Avatar upload error:', error);
            profileData.avatar = previous;
            profileUser = { ...profileUser, avatar: previous };
            alert(t('profile.avatarUploadError'));
        } finally {
            avatarUploading = false;
            input.value = "";
        }
    };

    const handleAvatarRemove = async () => {
        if (!profileData.avatar) return;

        const previous = profileData.avatar;
        profileData.avatar = "";

        try {
            const response = await fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: previous })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const saved = await persistProfileUpdate({ avatar: '' });
            if (!saved) {
                throw new Error('Failed to persist avatar removal');
            }

            profileUser = { ...profileUser, avatar: '' };
        } catch (error) {
            console.error('Avatar remove error:', error);
            profileData.avatar = previous;
            profileUser = { ...profileUser, avatar: previous };
        }
    };

    // Profile form data
    let profileData = $state({
        name: profileUser?.name || "",
        surname: profileUser?.surname || "",
        nickname: profileUser?.nickname || "",
        bio: profileUser?.bio || "",
        location: profileUser?.location || "",
        website: profileUser?.website || "",
        interests: profileUser?.interests || [],
        avatar: profileUser?.avatar || "",
        bannerColor: profileUser?.bannerColor || DEFAULT_BANNER_COLOR,
        bannerImage: profileUser?.bannerImage || "",
        socialLinks: profileUser?.socialLinks || {
            twitter: "",
            github: "",
            linkedin: ""
        }
    });

    const persistProfileUpdate = async (fields: Record<string, unknown>) => {
        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields)
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            return true;
        } catch (error) {
            console.error('Profile partial update error:', error);
            return false;
        }
    };

    const handleSaveProfile = async () => {
        isSaving = true;
        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                isEditing = false;
                profileUser = { ...profileUser, ...profileData };
            } else {
                console.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            isSaving = false;
        }
    };

    const handleCancelEdit = () => {
        profileData = {
            name: profileUser?.name || "",
            surname: profileUser?.surname || "",
            nickname: profileUser?.nickname || "",
            bio: profileUser?.bio || "",
            location: profileUser?.location || "",
            website: profileUser?.website || "",
            interests: profileUser?.interests || [],
            avatar: profileUser?.avatar || "",
            bannerColor: profileUser?.bannerColor || DEFAULT_BANNER_COLOR,
            bannerImage: profileUser?.bannerImage || "",
            socialLinks: profileUser?.socialLinks || {
                twitter: "",
                github: "",
                linkedin: ""
            }
        };
        isEditing = false;
    };

    const handleBannerColorChange = (color: string) => {
        profileData.bannerColor = color || DEFAULT_BANNER_COLOR;
    };

    const triggerBannerFileDialog = () => {
        if (typeof document === "undefined") return;
        const input = document.getElementById(bannerInputId) as HTMLInputElement | null;
        input?.click();
    };

    const handleBannerUpload = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousBanner = profileData.bannerImage;
        const maxBytes = 4 * 1024 * 1024;
        if (file.size > maxBytes) {
            alert(t('profile.bannerSizeError') ?? 'Banner en fazla 4MB olmalı.');
            input.value = "";
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert(t('profile.bannerTypeError') ?? 'Sadece görsel yükleyebilirsiniz.');
            input.value = "";
            return;
        }

        bannerUploading = true;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'banners');
            if (profileData.bannerImage) {
                formData.append('previousUrl', profileData.bannerImage);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const result = await response.json();
            const newBannerUrl = result.url;
            profileData.bannerImage = newBannerUrl;

            const saved = await persistProfileUpdate({ bannerImage: newBannerUrl });
            if (!saved) {
                profileData.bannerImage = previousBanner;
                throw new Error('Failed to persist banner image');
            }

            profileUser = { ...profileUser, bannerImage: newBannerUrl };
        } catch (error) {
            console.error('Banner upload error:', error);
            profileData.bannerImage = previousBanner;
            profileUser = { ...profileUser, bannerImage: previousBanner };
            alert(t('profile.bannerUploadError') ?? 'Banner yüklenirken bir sorun oluştu.');
        } finally {
            bannerUploading = false;
            input.value = "";
        }
    };

    const handleBannerRemove = async () => {
        if (!profileData.bannerImage) return;

        const previous = profileData.bannerImage;
        profileData.bannerImage = "";

        try {
            const response = await fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: previous })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const saved = await persistProfileUpdate({ bannerImage: '' });
            if (!saved) {
                throw new Error('Failed to persist banner removal');
            }

            profileUser = { ...profileUser, bannerImage: '' };
        } catch (error) {
            console.error('Banner remove error:', error);
            profileData.bannerImage = previous;
            profileUser = { ...profileUser, bannerImage: previous };
        }
    };

    const startEditing = () => {
        isEditing = true;
    };


    const addInterest = (interest: string) => {
        if (interest.trim() && !profileData.interests.includes(interest.trim())) {
            profileData.interests = [...profileData.interests, interest.trim()];
        }
    };

    const removeInterest = (interest: string) => {
        profileData.interests = profileData.interests.filter(i => i !== interest);
    };

    let newInterest = $state("");

    const navigateToArticle = (slug: string) => {
        goto(`/article/${slug}`);
    };

    // Follow/block handlers
    const loadFollowStatus = async (targetId?: string | null) => {
        const targetUserId = targetId ?? profileUserId;
        if (!targetUserId || isOwnProfile) return;
        try {
            const response = await fetch(`/api/users/${targetUserId}/follow`);
            if (!response.ok) {
                if (response.status !== 401) {
                    const errorMessage = await response.text().catch(() => response.statusText);
                    console.error('Load follow status error:', errorMessage);
                }
                return;
            }

            const data = await response.json();
            isFollowing = !!data.following;
            followersCount = typeof data.followersCount === 'number' ? data.followersCount : followersCount;
            followingCount = typeof data.followingCount === 'number' ? data.followingCount : followingCount;
        } catch (error) {
            console.error('Load follow status error:', error);
        }
    };

    const loadBlockStatus = async (targetId?: string | null) => {
        const targetUserId = targetId ?? profileUserId;
        if (!targetUserId || isOwnProfile) return;

        // Eğer zaten server'dan gelen veri varsa ve API çağrısı yapılmıyorsa, kullan
        if (viewerBlocksProfile !== undefined && !isBlockedChanging) {
            isBlocked = viewerBlocksProfile;
            return;
        }

        try {
            const response = await fetch(`/api/users/${targetUserId}/block`);
            if (!response.ok) {
                if (response.status !== 401) {
                    const errorMessage = await response.text().catch(() => response.statusText);
                    console.error('Load block status error:', errorMessage);
                }
                return;
            }

            const data = await response.json();
            // Sadece state değişmiyorsa güncelle (manuel değişimi koru)
            if (!isBlockedChanging) {
                isBlocked = !!data.blocked;
            }
        } catch (error) {
            console.error('Load block status error:', error);
        }
    };

    const handleFollowUser = async () => {
        const targetUserId = profileUserId;
        if (!targetUserId) return;
        try {
            const response = await fetch(`/api/users/${targetUserId}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const errorMessage = await response.text().catch(() => response.statusText);
                console.error('Follow error:', errorMessage);
                return;
            }

            await loadFollowStatus(targetUserId);
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    const handleUnfollowUser = async () => {
        const targetUserId = profileUserId;
        if (!targetUserId) return;
        try {
            const response = await fetch(`/api/users/${targetUserId}/follow`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const errorMessage = await response.text().catch(() => response.statusText);
                console.error('Unfollow error:', errorMessage);
                return;
            }

            await loadFollowStatus(targetUserId);
        } catch (error) {
            console.error('Unfollow error:', error);
        }
    };

    const handleBlockUser = async () => {
        const targetUserId = profileUserId;
        if (!targetUserId) return;
        
        // Anında state'i güncelle
        isBlocked = true;
        isBlockedChanging = true;
        
        try {
            const response = await fetch(`/api/users/${targetUserId}/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const errorMessage = await response.text().catch(() => response.statusText);
                console.error('Block error:', errorMessage);
                // Hata durumunda state'i geri al
                isBlocked = false;
                isBlockedChanging = false;
                return;
            }

            // Başarılı olduğunda viewerBlocksProfile'u güncelle
            viewerBlocksProfile = true;
            await loadBlockStatus(targetUserId);
            await loadFollowStatus(targetUserId);
        } catch (error) {
            console.error('Block error:', error);
            // Hata durumunda state'i geri al
            isBlocked = false;
        } finally {
            isBlockedChanging = false;
        }
    };

    const handleUnblockUser = async () => {
        const targetUserId = profileUserId;
        if (!targetUserId) return;
        
        // Anında state'i güncelle
        isBlocked = false;
        isBlockedChanging = true;
        
        try {
            const response = await fetch(`/api/users/${targetUserId}/block`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                const errorMessage = await response.text().catch(() => response.statusText);
                console.error('Unblock error:', errorMessage);
                // Hata durumunda state'i geri al
                isBlocked = true;
                isBlockedChanging = false;
                return;
            }

            // Başarılı olduğunda viewerBlocksProfile'u güncelle
            viewerBlocksProfile = false;
            await loadBlockStatus(targetUserId);
        } catch (error) {
            console.error('Unblock error:', error);
            // Hata durumunda state'i geri al
            isBlocked = true;
        } finally {
            isBlockedChanging = false;
        }
    };

    // Load follow/block status on component mount
    loadFollowStatus(profileUserId);
    loadBlockStatus(profileUserId);
    // Define article type with translations
    interface ArticleTranslation {
        title: string;
        content: any;
        excerpt: string;
        slug: string;
        language: string;
    }

    interface Article {
        _id: string;
        title: string;
        content: any;
        excerpt: string;
        slug: string;
        language: string;
        translations: Record<string, ArticleTranslation>;
        stats?: {
            likes: number;
            dislikes: number;
            views: number;
            comments: number;
        };
        author?: {
            id: string;
            name: string;
            avatar?: string;
        };
        authorId?: string;
        category: string;
        subcategory?: string;
        tags: string[];
        publishedAt: string;
        readTime?: number;
        featured?: boolean;
        coverImage?: string;
    }

       const article = $derived({
        ...data.article,
        ...(data.article?.translations?.[currentLocale] || {}),
        translations: data.article?.translations || {}
    } as Article);
    
    
    // Update article content when locale changes
    $effect(() => {
        currentLocale = getCurrentLocale();
    });

    // localStorage'dan beğenme durumunu yükle
    $effect(() => {
        if (typeof window !== 'undefined' && data.article?._id) {
            const savedReaction = localStorage.getItem(`article_reaction_${data.article._id}`);
            if (savedReaction && ['like', 'dislike'].includes(savedReaction)) {
                reaction = savedReaction as 'like' | 'dislike';
            }
        }
    });
    
    // Comment system state
    let comments = $state<any[]>([]);
    const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    let newComment = $state<any>(emptyDoc); // Edra JSON
    let replyingTo = $state<string | null>(null);
    let replyContent = $state<any>(emptyDoc); // Edra JSON
    let loadingComments = $state(false);
    let commentEditor = $state<Editor | null>(null);
    let replyEditor = $state<Editor | null>(null);
    let userReactions = $state<Record<string, 'like' | 'dislike' | null>>({});

    // Alert Dialog states
    let showDeleteDialog = $state(false);
    let showHideDialog = $state(false);
    let dialogType = $state<'article' | 'comment'>('article');
    let selectedArticle = $state<any>(null);
    let selectedComment = $state<any>(null);


    async function toggleReaction(type: 'like' | 'dislike') {
        // Kullanıcı giriş kontrolü
        if (!$page.data.user) {
            showToast(t('LoginRequiredForReactions'), 'error');
            return;
        }

        if (!data.article?._id) return;

        let newReaction: 'like' | 'dislike' | null = reaction === type ? null : type;

        try {
            const res = await fetch(`/api/articles/${data.article._id}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newReaction })
            });

            if (!res.ok) {
                if (res.status === 401) {
                    showToast(t('LoginRequiredForReactions'), 'error');
                }
                return;
            }
            const json = await res.json();

            // Güncel state'i API'den veya lokal olarak ayarla
            reaction = json.reaction ?? newReaction;

            // localStorage'a kaydet
            if (typeof window !== 'undefined') {
                if (reaction) {
                    localStorage.setItem(`article_reaction_${data.article._id}`, reaction);
                } else {
                    localStorage.removeItem(`article_reaction_${data.article._id}`);
                }
            }

            // API'den gelen güncel sayıları kullan
            if (json.stats) {
                likesCount = Number(json.stats.likes) || 0;
                dislikesCount = Number(json.stats.dislikes) || 0;
            }

        } catch (e) {
            console.error(e);
        }
    }

    if (!article) {
        // Handle article not found
        console.error('Article not found');
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(t.currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    function isArticleOwner(): boolean {
        const uid = $page.data.user?.id;
        return Boolean(uid && (article?.authorId === uid || article?.author?.id === uid));
    }


    function onEditArticle() {
        if (!article?._id) {
            return;
        }

        const params = new URLSearchParams({
            articleId: article._id,
            mode: 'edit'
        });

        const slug = article?.slug;
        if (slug) {
            params.set('slug', slug);
        }

        window.location.href = `/write?${params.toString()}`;
    }
    function onDeleteArticle() {
        selectedArticle = article;
        dialogType = 'article';
        showDeleteDialog = true;
    }
    function onShowArticle() {
        selectedArticle = article;
        dialogType = 'article';
        showHideDialog = true;
    }

    function onHideArticle() {
        selectedArticle = article;
        dialogType = 'article';
        showHideDialog = true;
    }

    function isCommentOwner(a: any): boolean {
        const uid = $page.data.user?.id;
        return Boolean(uid && (a?.author?.id === uid || a?.userId === uid));
    }
    function reportComment(id: string) { showToast(t('Reported'), 'info'); }
    function editComment(id: string) { showToast(t('NotImplemented'), 'warning'); }
    function deleteComment(id: string) {
        const comment = comments.find(c => c.id === id);
        if (comment) {
            selectedComment = comment;
            dialogType = 'comment';
            showDeleteDialog = true;
        }
    }
    function hideComment(id: string) {
        const comment = comments.find(c => c.id === id);
        if (comment) {
            selectedComment = comment;
            dialogType = 'comment';
            showHideDialog = true;
        }
    }

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
                // Initialize user reactions
                if ($page.data.user?.id) {
                    const reactionsRes = await fetch(`/api/comments/user-reactions?articleId=${article._id}`);
                    if (reactionsRes.ok) {
                        const data = await reactionsRes.json();
                        userReactions = data.reactions || {};
                    }
                } else {
                    userReactions = {};
                }
            }
        } catch (e) {
            console.error('Failed to load comments:', e);
        } finally {
            loadingComments = false;
        }
    }

    function isRichText(content: any): boolean {
        if (!content) return false;
        if (typeof content === 'string') {
            try {
                JSON.parse(content);
                return true;
            } catch {
                return false;
            }
        }
        return typeof content === 'object';
    }

    function findComment(commentList: any[], id: string): any | null {
        for (const comment of commentList) {
            if (comment.id === id) return comment;
            if (comment.replies?.length) {
                const found = findComment(comment.replies, id);
                if (found) return found;
            }
        }
        return null;
    }

    function extractPlainText(doc: any): string {
        try {
            const json = typeof doc === 'string' ? JSON.parse(doc) : doc;
            const nodes = json?.content ?? [];
            return nodes
                .map((n: any) => {
                    if (n.type === 'text') return n.text ?? '';
                    if (Array.isArray(n.content)) {
                        return n.content.map((c: any) => (c.type === 'text' ? c.text ?? '' : '')).join('');
                    }
                    return '';
                })
                .join('')
                .trim();
        } catch {
            return '';
        }
    }

    function isCommentEmpty(content: any): boolean {
        if (!content) return true;
        if (typeof content === 'string') return content.trim() === '';
        return extractPlainText(content) === '';
    }

    function onCommentEditorUpdate() {
        if (commentEditor) {
            newComment = commentEditor.getJSON();
        }
    }

    function onReplyEditorUpdate() {
        if (replyEditor) {
            replyContent = replyEditor.getJSON();
        }
    }
    
    async function postComment() {
        // Kullanıcı giriş kontrolü
        if (!$page.data.user) {
            showToast(t('LoginRequiredForComments'), 'error');
            return;
        }

        if (isCommentEmpty(newComment) || !article) return;
        try {
            const res = await fetch(`/api/articles/${article._id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                const comment = await res.json();
                comments = [comment, ...comments];
                newComment = emptyDoc;
                if (commentEditor) commentEditor.commands.setContent('');
            } else if (res.status === 401) {
                persistToast(t('LoginRequiredForComments'), 'error');
            }
        } catch (e) {
            console.error('Failed to post comment:', e);
        }
    }
    
    async function postReply(parentId: string) {
        const content = replyContent;
        if (isCommentEmpty(content) || !article) return;
        try {
            const res = await fetch(`/api/articles/${article._id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, parentId })
            });
            if (res.ok) {
                await res.json();
                await loadComments();
                replyContent = emptyDoc;
                if (replyEditor) replyEditor.commands.setContent('');
                replyEditor = null;
                replyingTo = null;
            }
        } catch (e) {
            console.error('Failed to post reply:', e);
        }
    }
    
    async function toggleCommentReaction(commentId: string, type: 'like' | 'dislike', isReply: boolean, parentId?: string) {
        // Kullanıcı giriş kontrolü
        if (!$page.data.user) {
            showToast(t('LoginRequiredForReactions'), 'error');
            return;
        }

        // Optimistic UI update
        const previousReaction = userReactions[commentId];
        const comment = findComment(comments, commentId);
        
        // Update local state immediately
        if (previousReaction === type) {
            // Toggle off if clicking the same reaction
            userReactions[commentId] = null;
            if (comment) {
                if (type === 'like') comment.likes = Math.max(0, (comment.likes || 0) - 1);
                else if (type === 'dislike') comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
            }
        } else {
            // Update to new reaction
            const previousReaction = userReactions[commentId];
            userReactions[commentId] = type;
            
            if (comment) {
                // Remove previous reaction count
                if (previousReaction === 'like') comment.likes = Math.max(0, (comment.likes || 0) - 1);
                else if (previousReaction === 'dislike') comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
                
                // Add new reaction count
                if (type === 'like') comment.likes = (comment.likes || 0) + 1;
                else if (type === 'dislike') comment.dislikes = (comment.dislikes || 0) + 1;
            }
        }

        try {
            const res = await fetch(`/api/comments/${commentId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: previousReaction === type ? null : type })
            });

            if (!res.ok) {
                // Revert on error
                if (res.status === 401) {
                    showToast(t('LoginRequiredForReactions'), 'error');
                }
                // Reload comments to sync with server
                await loadComments();
            }
        } catch (e) {
            console.error('Failed to react to comment:', e);
            // Revert on error
            await loadComments();
        }
    }
    
    // Alert Dialog handlers
    async function confirmDelete() {
        if (dialogType === 'article' && selectedArticle) {
            await deleteArticle(selectedArticle._id);
        } else if (dialogType === 'comment' && selectedComment) {
            await deleteCommentAPI(selectedComment.id);
        }
        resetDialogs();
    }

    async function confirmHide() {
        if (dialogType === 'article' && selectedArticle) {
            // Eğer gizlenmişse göster, gizlenmemişse gizle
            const shouldHide = !selectedArticle.hidden;
            await hideArticle(selectedArticle._id, shouldHide);
        } else if (dialogType === 'comment' && selectedComment) {
            // Eğer gizlenmişse göster, gizlenmemişse gizle
            const shouldHide = !selectedComment.hidden;
            await hideCommentAPI(selectedComment.id, shouldHide);
        }
        resetDialogs();
    }

    function resetDialogs() {
        showDeleteDialog = false;
        showHideDialog = false;
        selectedArticle = null;
        selectedComment = null;
        dialogType = 'article';
    }

    async function deleteArticle(articleId: string) {
        try {
            const res = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                showToast(t('ArticleDeleted'), 'success');
                // Redirect to articles page or home
                window.location.href = '/articles';
            } else if (res.status === 401) {
                showToast(t('LoginRequired'), 'error');
            } else if (res.status === 403) {
                showToast(t('PermissionDenied'), 'error');
            } else {
                showToast(t('DeleteFailed'), 'error');
            }
        } catch (e) {
            console.error('Failed to delete article:', e);
            showToast(t('DeleteFailed'), 'error');
        }
    }

    async function hideArticle(articleId: string, shouldHide: boolean = true) {
        try {
            const res = await fetch(`/api/articles/${articleId}/hide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden: shouldHide })
            });

            if (res.ok) {
                const action = shouldHide ? 'gizlendi' : 'gösterildi';
                showToast(t('ArticleHidden'), 'success');
                // Update article state to reflect hidden status
                if (article && article._id === articleId) {
                    article.hidden = shouldHide;
                }
            } else if (res.status === 401) {
                showToast(t('LoginRequired'), 'error');
            } else if (res.status === 403) {
                showToast(t('PermissionDenied'), 'error');
            } else {
                showToast(t('HideFailed'), 'error');
            }
        } catch (e) {
            console.error('Failed to hide article:', e);
            showToast(t('HideFailed'), 'error');
        }
    }

    async function deleteCommentAPI(commentId: string) {
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                showToast(t('CommentDeleted'), 'success');
                await loadComments(); // Refresh comments
            } else if (res.status === 401) {
                showToast(t('LoginRequired'), 'error');
            } else if (res.status === 403) {
                showToast(t('PermissionDenied'), 'error');
            } else {
                showToast(t('DeleteFailed'), 'error');
            }
        } catch (e) {
            console.error('Failed to delete comment:', e);
            showToast(t('DeleteFailed'), 'error');
        }
    }

    async function hideCommentAPI(commentId: string, shouldHide: boolean = true) {
        try {
            const res = await fetch(`/api/comments/${commentId}/hide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden: shouldHide })
            });

            if (res.ok) {
                showToast(t('CommentHidden'), 'success');
                await loadComments(); // Refresh comments
            } else if (res.status === 401) {
                showToast(t('LoginRequired'), 'error');
            } else if (res.status === 403) {
                showToast(t('PermissionDenied'), 'error');
            } else {
                showToast(t('HideFailed'), 'error');
            }
        } catch (e) {
            console.error('Failed to hide comment:', e);
            showToast(t('HideFailed'), 'error');
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
    
    const formatNumber = (num: number): string => {
        if (num < 1000) return num.toString();
        if (num < 10000) return (num / 1000).toFixed(1) + 'k';
        if (num < 100000) return (num / 1000).toFixed(0) + 'k';
        if (num < 1000000) return (num / 1000).toFixed(0) + 'k';
        if (num < 10000000) return (num / 1000000).toFixed(1) + 'm';
        return (num / 1000000).toFixed(0) + 'm';
    };
    
    // Load comments on mount
    $effect(() => {
        if (article) {
            loadComments();
        }
    });

  // Sadece client-side'da Motion fonksiyonlarını kullan
  let mouseX = browser ? useMotionValue(0) : { set: () => {} };
  let mouseY = browser ? useMotionValue(0) : { set: () => {} };
  let background = browser && mouseX && mouseY ? useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(51, 51, 51, 0.4), transparent 80%)` : '';

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
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  role="presentation"
  onmousemove={(e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();

    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }}
  class="group relative h-fit w-full overflow-hidden rounded-xl bg-card"
>

  <Motion
    style={{
      background,
    }}
    let:motion
  >
    <div
      use:motion
      class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-75 "
    ></div>
  </Motion>
<main class="min-h-screen bg-background">
    {#if !article}
        <!-- Article not found -->
        <div class="container mx-auto px-4 py-12 text-center">
            <h1 class="text-2xl font-bold mb-4">Makale Bulunamadı</h1>
            <p class="text-muted-foreground mb-6">Aradığınız makale mevcut değil veya kaldırılmış olabilir.</p>
            <Button size="sm" href="/articles">Makalelere Dön</Button>
        </div>
    {:else}
        <!-- Article content -->
        <article class="container mx-auto px-4 py-6 max-w-5xl">
            <!-- Back button -->
                         <!-- Article content -->

            <div class="mb-6 flex flex-row gap-2 justify-between items-center">
                <Button variant="outline" size="xs" href="/articles">
                    <ArrowLeftIcon triggers={{ hover: false }} animationState="loading" duration={2000}/>
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
            <Separator />
            <!-- Article header -->
            <header class="relative my-5">
                <div class="absolute top-2 right-2">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger >
											<Button variant="outline" class="h-6 w-6 p-0">
												<EllipsisIcon triggers={{ hover: false }} animationState="loading" duration={1400} loop={true} />
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end" class="w-48">
											<DropdownMenu.Item onclick={() => showReportDrawer = true} class="text-destructive">
												<BadgeAlertIcon triggers={{ hover: false }}  animationState="loading"  duration={3000} loop={true}  class="mr-2 h-4 w-4" />
												Bildir
											</DropdownMenu.Item>
											{#if isArticleOwner()}
                                                <DropdownMenu.Separator />

													<DropdownMenu.Item onclick={onDeleteArticle}>
														<BookMinusIcon triggers={{ hover: false }}  animationState="loading" duration={3000}  loop={true}  class="mr-2 h-4 w-4" />
														Kaldır
													</DropdownMenu.Item>

													<DropdownMenu.Item onclick={onEditArticle}>
														<NotebookPenIcon triggers={{ hover: false }}  animationState="loading" duration={3000}  loop={true}  class="mr-2 h-4 w-4" />
														Düzenle
													</DropdownMenu.Item>
                        {#if article.hidden}
                            <DropdownMenu.Item onclick={onShowArticle}>														
														<Eye class="mr-2 h-4 w-4" />
Göster</DropdownMenu.Item>
                        {:else}
                            <DropdownMenu.Item onclick={onHideArticle}>														
														<EyeOffIcon triggers={{ hover: false }}  class="mr-2 h-4 w-4" />
 Gizle</DropdownMenu.Item>
                        {/if}
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
                                                    
								</div>
                <div class="mb-3 flex flex-col gap-3">
                    <div class="flex flex-col sm:flex-row gap-3 items-center">
                        <h1 class="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                            {article.title}
                        </h1>
                        {#if article.status === 'pending'}
                            <Badge variant="warning">{t('articles.status.pending')}</Badge>
                        {:else if article.status === 'draft'}
                            <Badge variant="outline">{t('articles.status.draft')}</Badge>
                        {/if}
                        <div class="flex items-center gap-1">
                            <Badge variant="default">{t(article.category)}</Badge>
                            <Badge variant="secondary">{t(article.subcategory)}</Badge>
                        </div>
                    </div>
                    {#if article.status === 'pending'}
                        <div class="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                            {t('articles.pendingApproval')}
                        </div>
                    {/if}
                </div>
                {#if article.thumbnail}
                    <div class="mb-3 rounded-lg overflow-hidden">
                        <Lens>
                        <img 
                            src={article.thumbnail} 
                            alt={article.title} 
                            class="w-full h-auto max-h-[500px] object-cover"
                        /></Lens>
                    </div>
                {/if}

                {#if article.excerpt}
                    <p class="text-base sm:text-lg text-secondary-foreground mb-3">
                        {article.excerpt}
                    </p>
                {/if}

                <!-- Article meta -->
                <div class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-3">
                    <!-- Author -->
                    <a href="/{article.author.nickname}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User class="w-4 h-4" />
                        </div>
                        <span class="font-medium">
                            {article.author.name && article.author.surname 
                                ? `${article.author.name} ${article.author.surname}`
                                : article.author.nickname}
                        </span>
                    </a>

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
                    <Tooltip.Provider>
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                <div class="flex items-center gap-1">
                                    <Eye class="w-4 h-4" />
                                    <span>{formatNumber(article.stats.views)}</span>
                                </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <p>{article.stats.views.toLocaleString()} görüntüleme</p>
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>

                    <div class="flex items-center gap-2">
                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <Motion whileTap={{ scale: 0.95 }} let:motion>
                                        <div use:motion>
                                            <Button
                                                variant={reaction === 'like' ? "default" : "ghost"}
                                                size="sm"
                                                class={cn(
                                                    "h-8 gap-1 transition-all duration-200",
                                                    reaction === 'like' && "bg-primary text-primary-foreground "
                                                )}
                                                onclick={() => toggleReaction('like')}
                                            >
                                                <ThumbsUp class={cn(
                                                    "h-4 w-4 transition-all duration-200",
                                                    reaction === 'like' && "fill-current"
                                                )} />
                                                <span class={cn("max-w-12 w-4", reaction === 'like' && "font-medium")}>{formatNumber(likesCount)}</span>
                                            </Button>
                                        </div>
                                    </Motion>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                    <p>{likesCount.toLocaleString()} beğeni</p>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>

                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <Motion whileTap={{ scale: 0.95 }} let:motion>
                                        <div use:motion>
                                            <Button
                                                variant={reaction === 'dislike' ? "default" : "ghost"}
                                                size="sm"
                                                class={cn(
                                                    "h-8 gap-1 transition-all duration-200",
                                                    reaction === 'dislike' && "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                                                )}
                                                onclick={() => toggleReaction('dislike')}
                                            >
                                                <ThumbsDown class={cn(
                                                    "h-4 w-4 transition-all duration-200",
                                                    reaction === 'dislike' && "fill-current"
                                                )} />
                                                <span class={cn("max-w-12 w-4", reaction === 'dislike' && "font-medium")}>{formatNumber(dislikesCount)}</span>
                                            </Button>
                                        </div>
                                    </Motion>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                    <p>{dislikesCount.toLocaleString()} beğenmeme</p>
                                </Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </div>

                    <Tooltip.Provider>
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                <div class="flex items-center gap-1">
                                    <MessageCircle class="w-4 h-4" />
                                    <span>{formatNumber(article.stats.comments)}</span>
                                </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <p>{article.stats.comments.toLocaleString()} yorum</p>
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                    
                    <Button variant="ghost" size="sm" class="ml-auto">
                        <Share2 class="w-4 h-4" />
                        Paylaş
                    </Button>

            </header>



                    <div class="mt-6 prose prose-lg max-w-none">
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
                <div class="my-8 pt-8">
                    <h3 class="text-sm font-medium text-muted-foreground mb-3">Etiketler</h3>
                    <div class="flex flex-wrap gap-2">
                        {#each article.tags as tag}
                            <Badge variant="outline">#{tag}</Badge>
                        {/each}
                    </div>
                </div>
            {/if}
            <Separator class="my-10"/>
            <ProfileCard
                profileData={profileData}
                profileUser={profileUser}
                isOwnProfile={isOwnProfile}
                showProfileLink={true}
                isEditing={isEditing}
                isSaving={isSaving}
                avatarUploading={avatarUploading}
                bannerUploading={bannerUploading}
                avatarInputId={avatarInputId}
                bannerInputId={bannerInputId}
                joinDate={stats.joinDate}
                formatDate={formatDate}
                onToggleEdit={startEditing}
                onCancelEdit={handleCancelEdit}
                onSaveProfile={handleSaveProfile}
                onTriggerAvatarFile={triggerAvatarFileDialog}
                onAvatarUpload={handleAvatarUpload}
                onAvatarRemove={handleAvatarRemove}
                onInterestAdd={addInterest}
                onInterestRemove={removeInterest}
                onBannerColorChange={handleBannerColorChange}
                onTriggerBannerFile={triggerBannerFileDialog}
                onBannerUpload={handleBannerUpload}
                onBannerRemove={handleBannerRemove}
                onFollowUser={handleFollowUser}
                onUnfollowUser={handleUnfollowUser}
                onBlockUser={handleBlockUser}
                onUnblockUser={handleUnblockUser}
                isFollowing={isFollowing}
                isBlocked={isBlocked}
                followersCount={followersCount}
                followingCount={followingCount}
                isFollowingMe={isFollowingMe}
                followersList={followersList}
                followingList={followingList}
                currentUserId={currentUserId}
            />

            <Separator class="my-10"/>

            <!-- Comments Section -->
            <div class="mt-12 ">
                <div class="flex flex-col items-center justify-center mb-6 gap-1">
                <MessageSquareIcon size={36} triggers={{ hover: false }} duration={2500} animationState="loading" class="text-primary" />
                <h2 class="text-lg font-bold">{t('Comments')}</h2>
                </div>
                
                <!-- Comment Form -->
                <div class="mb-8">
                    <div class="mb-3 border p-2 rounded-lg">
                        {#if commentEditor}
                            <EdraToolBar editor={commentEditor} class=" overflow-y-auto h-min mb-2" />
                        {/if}
                        <EdraEditor
                            bind:editor={commentEditor}
                            content={newComment}
                            class="min-h-[140px] "
                            onUpdate={onCommentEditorUpdate}
                            placeholder={t('WriteYourComment')}
                        />
                    </div>
                    <div class="flex justify-end mt-2">
                        <Button onclick={postComment} disabled={isCommentEmpty(newComment)}>Yorum Yap</Button>
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
                        {#each comments as comment (comment.id)}
                            <ContextMenu.Root>
                            <ContextMenu.Trigger asChild>
                            <div class="border rounded-lg p-4" id={`comment-${comment.id}`}>
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User class="w-5 h-5" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="font-medium">
                                                {comment.author?.name && comment.author?.surname 
                                                    ? `${comment.author.name} ${comment.author.surname}`
                                                    : comment.author?.nickname || 'Anonim'}
                                            </span>
                                            <span class="text-sm text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <Separator class="mb-4"/>
                                        <div class="text-sm mb-2">
                                                    <EdraEditor content={comment.content} editable={false} />
                                        </div>
                                                                                <Separator class="my-4"/>

                                        <div class="flex items-center gap-4">
                                            <Button 
                                                variant={userReactions[comment.id] === 'like' ? 'default' : 'ghost'}
                                                size="sm"
                                                class={cn(
                                                    "h-8 gap-1 transition-all duration-200 text-xs",
                                                    userReactions[comment.id] === 'like' && "bg-primary text-primary-foreground"
                                                )}
                                                onclick={() => toggleCommentReaction(comment.id, 'like', false)}
                                            >
                                                <ThumbsUp class={cn(
                                                    "h-3 w-3 transition-all duration-200",
                                                    userReactions[comment.id] === 'like' && "fill-current"
                                                )} />
                                                <span class={cn("max-w-12 w-4", userReactions[comment.id] === 'like' && "font-medium")}>
                                                    {formatNumber(comment.likes || 0)}
                                                </span>
                                            </Button>
                                            <Button 
                                                variant={userReactions[comment.id] === 'dislike' ? 'default' : 'ghost'}
                                                size="sm"
                                                class={cn(
                                                    "h-8 gap-1 transition-all duration-200 text-xs",
                                                    userReactions[comment.id] === 'dislike' && "bg-primary text-primary-foreground "
                                                )}
                                                onclick={() => toggleCommentReaction(comment.id, 'dislike', false)}
                                            >
                                                <ThumbsDown class={cn(
                                                    "h-3 w-3 transition-all duration-200",
                                                    userReactions[comment.id] === 'dislike' && "fill-current"
                                                )} />
                                                <span class={cn("max-w-12 w-4", userReactions[comment.id] === 'dislike' && "font-medium")}>
                                                    {formatNumber(comment.dislikes || 0)}
                                                </span>
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                class="h-8 gap-1"
                                                onclick={() => { replyingTo = replyingTo === comment.id ? null : comment.id; if (replyEditor) replyEditor.commands.setContent(''); replyContent = null; }}
                                            >
                                                <MessageCircle class="w-3 h-3" />
                                                <span class="text-xs">Yanıtla</span>
                                            </Button>
                                        </div>

                                        <!-- Reply form -->
                                        {#if replyingTo === comment.id}
                                            <div class="mt-4">
                                                {#key replyingTo}
                                                    <div class="mb-2 border p-2 rounded-lg">
                                                        {#if replyEditor}
                                                            <EdraToolBar editor={replyEditor} class="mb-1 overflow-y-auto text-sm" />
                                                        {/if}
                                                        <EdraEditor
                                                            bind:editor={replyEditor}
                                                            content={replyContent}
                                                            class="min-h-[100px]  rounded-lg h-min text-sm"
                                                            onUpdate={onReplyEditorUpdate}
                                                            placeholder="Yanıtınızı yazın..."
                                                        />
                                                    </div>
                                                {/key}
                                                <div class="flex justify-end gap-2 mt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onclick={() => { replyingTo = null; replyContent = null; if (replyEditor) replyEditor.commands.setContent(''); replyEditor = null; }}
                                                    >
                                                        İptal
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onclick={() => postReply(comment.id)}
                                                        disabled={isCommentEmpty(replyContent)}
                                                    >
                                                        Yanıtla
                                                    </Button>
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Nested replies -->
                                        {#if comment.replies && comment.replies.length > 0}
                                            <div class="mt-4 ml-6 space-y-4 border-l-2 pl-4">
                                                {#each comment.replies as reply (reply.id)}
                                                    <ContextMenu.Root>
                                                    <ContextMenu.Trigger asChild>
                                                    <div class="flex items-start gap-3" id={`comment-${reply.id}`}>
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
                                                            <div class="text-sm mb-2">
                                                                        <EdraEditor content={reply.content} editable={false} />
                                                            </div>
                                                            <div class="flex items-center gap-3">
                                                                    <Button 
                                                                        variant={userReactions[reply.id] === 'like' ? 'default' : 'ghost'}
                                                                        size="sm"
                                                                        class={cn(
                                                                            "h-7 gap-1 transition-all duration-200 text-xs",
                                                                            userReactions[reply.id] === 'like' && "bg-primary text-primary-foreground"
                                                                        )}
                                                                        onclick={() => toggleCommentReaction(reply.id, 'like', true, comment.id)}
                                                                    >
                                                                        <ThumbsUp class={cn(
                                                                            "h-3 w-3 transition-all duration-200",
                                                                            userReactions[reply.id] === 'like' && "fill-current"
                                                                        )} />
                                                                        <span class={cn("max-w-12 w-4", userReactions[reply.id] === 'like' && "font-medium")}>
                                                                            {formatNumber(reply.likes || 0)}
                                                                        </span>
                                                                    </Button>
                                                                    <Button 
                                                                        variant={userReactions[reply.id] === 'dislike' ? 'default' : 'ghost'}
                                                                        size="sm"
                                                                        class={cn(
                                                                            "h-7 gap-1 transition-all duration-200 text-xs",
                                                                            userReactions[reply.id] === 'dislike' && "bg-primary text-primary-foreground "
                                                                        )}
                                                                        onclick={() => toggleCommentReaction(reply.id, 'dislike', true, comment.id)}
                                                                    >
                                                                        <ThumbsDown class={cn(
                                                                            "h-3 w-3 transition-all duration-200",
                                                                            userReactions[reply.id] === 'dislike' && "fill-current"
                                                                        )} />
                                                                        <span class={cn("max-w-12 w-4", userReactions[reply.id] === 'dislike' && "font-medium")}>
                                                                            {formatNumber(reply.dislikes || 0)}
                                                                        </span>
                                                                    </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    class="h-7 gap-1"
                                                                    onclick={() => { replyingTo = replyingTo === reply.id ? null : reply.id; if (replyEditor) replyEditor.commands.setContent(''); replyContent = null; }}
                                                                >
                                                                    <MessageCircle class="w-3 h-3" />
                                                                    <span class="text-xs">Yanıtla</span>
                                                                </Button>
                                                            </div>
                                                            {#if replyingTo === reply.id}
                                                                <div class="mt-3 ml-4 border p-2 rounded-lg">
                                                                    {#key replyingTo}
                                                                        <div class="mb-2">
                                                                            {#if replyEditor}
                                                                                <EdraToolBar editor={replyEditor} class="mb-1 overflow-y-auto text-sm" />
                                                                            {/if}
                                                                            <EdraEditor
                                                                                bind:editor={replyEditor}
                                                                                content={replyContent}
                                                                                class="min-h-[80px]  h-min rounded-lg  text-sm"
                                                                                onUpdate={onReplyEditorUpdate}
                                                                                placeholder="Yanıtınızı yazın..."
                                                                            />
                                                                        </div>
                                                                    {/key}
                                                                    <div class="flex justify-end gap-2 mt-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onclick={() => { replyingTo = null; replyContent = null; if (replyEditor) replyEditor.commands.setContent(''); replyEditor = null; }}
                                                                        >
                                                                            İptal
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onclick={() => postReply(reply.id)}
                                                                            disabled={isCommentEmpty(replyContent)}
                                                                        >
                                                                            Yanıtla
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            {/if}

                                                            {#if reply.replies && reply.replies.length > 0}
                                                                <div class="mt-3 ml-4 space-y-3 border-l pl-3">
                                                                    {#each reply.replies as nested (nested.id)}
                                                                        <ContextMenu.Root>
                                                                        <ContextMenu.Trigger asChild>
                                                                        <div class="flex items-start gap-3" id={`comment-${nested.id}`}>
                                                                            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                                <User class="w-3 h-3" />
                                                                            </div>
                                                                            <div class="flex-1">
                                                                                <div class="flex items-center gap-2 mb-1">
                                                                                    <span class="font-medium text-xs">
                                                                                        {nested.author?.name && nested.author?.surname 
                                                                                            ? `${nested.author.name} ${nested.author.surname}`
                                                                                            : nested.author?.nickname || 'Anonim'}
                                                                                    </span>
                                                                                    <span class="text-xs text-muted-foreground">{formatTimeAgo(nested.createdAt)}</span>
                                                                                </div>
                                                                                <div class="text-xs mb-2">
                                                                                            <EdraEditor content={nested.content} editable={false} />
                                                                                </div>
                                                                                <div class="flex items-center gap-2">
                                                                                    <Button 
                                                                                        variant={userReactions[nested.id] === 'like' ? 'default' : 'ghost'}
                                                                                        size="sm"
                                                                                        class={cn(
                                                                                            "h-6 gap-1 transition-all duration-200 text-xs",
                                                                                            userReactions[nested.id] === 'like' && "bg-primary text-primary-foreground"
                                                                                        )}
                                                                                        onclick={() => toggleCommentReaction(nested.id, 'like', true, reply.id)}
                                                                                    >
                                                                                        <ThumbsUp class={cn(
                                                                                            "h-2.5 w-2.5 transition-all duration-200",
                                                                                            userReactions[nested.id] === 'like' && "fill-current"
                                                                                        )} />
                                                                                        <span class={cn("max-w-12 w-4", userReactions[nested.id] === 'like' && "font-medium")}>
                                                                                            {formatNumber(nested.likes || 0)}
                                                                                        </span>
                                                                                    </Button>
                                                                                    <Button 
                                                                                        variant={userReactions[nested.id] === 'dislike' ? 'default' : 'ghost'}
                                                                                        size="sm"
                                                                                        class={cn(
                                                                                            "h-6 gap-1 transition-all duration-200 text-xs",
                                                                                            userReactions[nested.id] === 'dislike' && "bg-primary text-primary-foreground"
                                                                                        )}
                                                                                        onclick={() => toggleCommentReaction(nested.id, 'dislike', true, reply.id)}
                                                                                    >
                                                                                        <ThumbsDown class={cn(
                                                                                            "h-2.5 w-2.5 transition-all duration-200",
                                                                                            userReactions[nested.id] === 'dislike' && "fill-current"
                                                                                        )} />
                                                                                        <span class={cn("max-w-12 w-4", userReactions[nested.id] === 'dislike' && "font-medium")}>
                                                                                            {formatNumber(nested.dislikes || 0)}
                                                                                        </span>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        </ContextMenu.Trigger>
                                                                        <ContextMenu.Content class="w-56">
                                                                            <ContextMenu.Item onclick={() => reportComment(nested.id)}>Bildir</ContextMenu.Item>
                                                                            {#if isCommentOwner(nested)}
                                                                                <ContextMenu.Separator />
                                                                                <ContextMenu.Item onclick={() => editComment(nested.id)}>Düzenle</ContextMenu.Item>
                                                                                <ContextMenu.Item onclick={() => deleteComment(nested.id)}>Sil</ContextMenu.Item>
                                                                                {#if nested.hidden}
                                                                                    <ContextMenu.Item onclick={() => hideComment(nested.id)}>Göster</ContextMenu.Item>
                                                                                {:else}
                                                                                    <ContextMenu.Item onclick={() => hideComment(nested.id)}>Gizle</ContextMenu.Item>
                                                                                {/if}
                                                                            {/if}
                                                                        </ContextMenu.Content>
                                                                        </ContextMenu.Root>
                                                                    {/each}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    </ContextMenu.Trigger>
                                                    <ContextMenu.Content class="w-56">
                                                        <ContextMenu.Item onclick={() => reportComment(reply.id)}>Bildir</ContextMenu.Item>
                                                        {#if isCommentOwner(reply)}
                                                            <ContextMenu.Separator />
                                                            <ContextMenu.Item onclick={() => editComment(reply.id)}>Düzenle</ContextMenu.Item>
                                                            <ContextMenu.Item onclick={() => deleteComment(reply.id)}>Sil</ContextMenu.Item>
                                                            {#if reply.hidden}
                                                                <ContextMenu.Item onclick={() => hideComment(reply.id)}>Göster</ContextMenu.Item>
                                                            {:else}
                                                                <ContextMenu.Item onclick={() => hideComment(reply.id)}>Gizle</ContextMenu.Item>
                                                            {/if}
                                                        {/if}
                                                    </ContextMenu.Content>
                                                    </ContextMenu.Root>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            </ContextMenu.Trigger>
                            <ContextMenu.Content class="w-56">
                                <ContextMenu.Item onclick={() => reportComment(comment.id)}>Bildir</ContextMenu.Item>
                                {#if isCommentOwner(comment)}
                                    <ContextMenu.Separator />
                                    <ContextMenu.Item onclick={() => editComment(comment.id)}>Düzenle</ContextMenu.Item>
                                    <ContextMenu.Item onclick={() => deleteComment(comment.id)}>Sil</ContextMenu.Item>
                                    {#if comment.hidden}
                                        <ContextMenu.Item onclick={() => hideComment(comment.id)}>Göster</ContextMenu.Item>
                                    {:else}
                                        <ContextMenu.Item onclick={() => hideComment(comment.id)}>Gizle</ContextMenu.Item>
                                    {/if}
                                {/if}
                            </ContextMenu.Content>
                            </ContextMenu.Root>
                        {/each}
                    {/if}
                </div>
            </div>
        </article>

    {/if}
</main>
</div>

<!-- Alert Dialogs -->
<AlertDialog.Root bind:open={showDeleteDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                {dialogType === 'article' ? 'Makaleyi Sil' : 'Yorumu Sil'}
            </AlertDialog.Title>
            <AlertDialog.Description>
                {dialogType === 'article'
                    ? 'Bu makaleyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
                    : 'Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>İptal</AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmDelete} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sil
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showHideDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                {selectedArticle?.hidden || selectedComment?.hidden ? 'Göster' : 'Gizle'}
                {dialogType === 'article' ? ' Makaleyi' : ' Yorumu'}
            </AlertDialog.Title>
            <AlertDialog.Description>
                {selectedArticle?.hidden || selectedComment?.hidden
                    ? `Bu ${dialogType === 'article' ? 'makaleyi' : 'yorumu'} göstermek istediğinizden emin misiniz?`
                    : `Bu ${dialogType === 'article' ? 'makaleyi' : 'yorumu'} gizlemek istediğinizden emin misiniz? ${dialogType === 'article' ? 'Makale' : 'Yorum'} diğer kullanıcılar tarafından görülemeyecek.`}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>İptal</AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmHide}>
                {selectedArticle?.hidden || selectedComment?.hidden ? 'Göster' : 'Gizle'}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
 <ReportDrawer
	bind:open={showReportDrawer}
	reportType="article"
	targetId={data.article?._id}
	targetTitle={data.article?.title}
/>
<Footer />
