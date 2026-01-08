<script lang="ts">
    import { t, getCurrentLocale } from '$lib/stores/i18n.svelte';
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import ArticleSearch from "$lib/components/ArticleSearch.svelte";
    import ArticleFilterPopover from "$lib/components/ArticleFilterPopover.svelte";
    import ProfileCard from "$lib/components/ProfileCard.svelte";
    import { 
        BookOpen,
        MessageCircle,
        Heart,
        Eye,
        Grid,
        List,
        Loader2,
        XCircle,
        Shield,
        AlertCircle
    } from "@lucide/svelte";
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Loader from "$lib/components/load.svelte";
    import ArticleList from '$lib/components/ArticleList.svelte';
    
    // Layout mode state
    let layoutMode = $state("grid");

    let { data } = $props();
    let profileUser = data.profileUser;
    const currentUser = data.currentUser;
    const currentUserId = currentUser?.id;
    const isModeratorOrAdmin = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(t.currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

    const filterOptions = $derived({
        languages: availableLanguages.length
            ? availableLanguages.map((lang) => ({ value: lang, label: lang.toUpperCase() }))
            : Object.values(articles.reduce<Record<string, { label: string; value: string }>>((acc, article) => {
                (article.availableLanguages || [article.language || 'tr']).forEach((lang: string) => {
                    if (!acc[lang]) {
                        acc[lang] = { value: lang, label: lang.toUpperCase() };
                    }
                });
                return acc;
            }, {})),
        categories: categoryOptions,
        types: ["Makale", "Analiz", "Görüş", "Çeviri", "Röportaj", "İnceleme"],
        dateRanges: [
            { label: "Son hafta", value: "week" },
            { label: "Son ay", value: "month" },
            { label: "Son yıl", value: "year" }
        ]
    });

    const recentSearches = profileUser?.recentSearches || [];

    function applyFiltersAndSearch() {
        let result = [...articles];

        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(article =>
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                (article.tags || []).some(tag => tag.toLowerCase().includes(query))
            );
        }

        if (activeFilters.category) {
            result = result.filter(article => article.category === activeFilters.category);
        }

        if (activeFilters.language) {
            result = result.filter(article => article.language === activeFilters.language);
        }

        if (activeFilters.tags && activeFilters.tags.length > 0) {
            result = result.filter(article =>
                activeFilters.tags.some((tag: string) => (article.tags || []).includes(tag))
            );
        }

        if (activeFilters.customDateRange && (activeFilters.customDateRange.start || activeFilters.customDateRange.end)) {
            const toJSDate = (d: any): Date | null => {
                if (!d) return null;
                if (d instanceof Date) return d;
                if (typeof d === 'string' || typeof d === 'number') return new Date(d);
                if (typeof d === 'object') {
                    if (typeof d.toDate === 'function') {
                        try { return d.toDate('UTC'); } catch { /* noop */ }
                    }
                    if ('year' in d && 'month' in d && 'day' in d) {
                        return new Date(d.year, (d.month as number) - 1, d.day as number);
                    }
                }
                return null;
            };

            const startDate = toJSDate(activeFilters.customDateRange.start);
            const endDateRaw = toJSDate(activeFilters.customDateRange.end);
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
        displayedArticles = result;
        hasMore = false;
    }

    const handleSearch = (query: string) => {
        searchQuery = query;
        applyFiltersAndSearch();
    };

    const handleFiltersChange = (filters: any) => {
        activeFilters = filters;
        applyFiltersAndSearch();
    };

    $effect(() => {
        articles;
        applyFiltersAndSearch();
    });
</script>

<Loader />

<svelte:head>
    <title>@{profileUser.nickname} - LAF</title>
    <meta name="description" content={profileUser.bio || `${profileUser.nickname}'s profile on LAF`} />
</svelte:head>

<Navbar />

<main class="min-h-screen bg-background">
    <div class="container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-6xl">
        <!-- Profile Header -->
        <div class="mb-8">
            <ProfileCard
                profileData={profileData}
                profileUser={profileUser}
                isOwnProfile={isOwnProfile}
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
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardContent class="p-4 text-center">
                    <BookOpen class="w-8 h-8 text-primary mx-auto mb-2" />
                    <div class="text-2xl font-bold">{stats.totalArticles}</div>
                    <div class="text-sm text-muted-foreground">{t('profile.articles')}</div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent class="p-4 text-center">
                    <Eye class="w-8 h-8 text-primary mx-auto mb-2" />
                    <div class="text-2xl font-bold">{stats.totalViews}</div>
                    <div class="text-sm text-muted-foreground">{t('profile.views')}</div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent class="p-4 text-center">
                    <Heart class="w-8 h-8 text-primary mx-auto mb-2" />
                    <div class="text-2xl font-bold">{stats.totalLikes}</div>
                    <div class="text-sm text-muted-foreground">{t('profile.likes')}</div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent class="p-4 text-center">
                    <MessageCircle class="w-8 h-8 text-primary mx-auto mb-2" />
                    <div class="text-2xl font-bold">{stats.totalComments}</div>
                    <div class="text-sm text-muted-foreground">{t('profile.comments')}</div>
                </CardContent>
            </Card>
        </div>

        <!-- Articles Tab -->
        <Card>
            <CardHeader class="space-y-2">
                <CardTitle>{t('profile.articles')}</CardTitle>
                <CardDescription>
                    {isOwnProfile ? t('profile.myArticlesDescription') : `@${profileUser.nickname}'s articles`}
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <ArticleSearch
                        value={searchQuery}
                        suggestions={[]}
                        recentSearches={recentSearches}
                        onSearch={handleSearch}
                        onClear={() => {
                            searchQuery = '';
                            applyFiltersAndSearch();
                        }}
                        class="w-full sm:max-w-xl"
                    />

                    <div class="flex items-center gap-1 rounded-lg border p-1">
                        <ArticleFilterPopover
                            options={filterOptions}
                            activeFilters={activeFilters}
                            onFiltersChange={handleFiltersChange}
                        />

                        <Button
                            variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onclick={() => layoutMode = 'grid'}
                            class="h-8 w-8 p-0"
                        >
                            <Grid class="h-4 w-4" />
                        </Button>
                        <Button
                            variant={layoutMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onclick={() => layoutMode = 'list'}
                            class="h-8 w-8 p-0"
                        >
                            <List class="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <ArticleList
                    articles={displayedArticles}
                    loading={loadingArticles}
                    layout={layoutMode}
                    variant={layoutMode === 'list' ? 'compact' : 'default'}
                    showLoadMore={false}
                    hasMore={hasMore}
                />
            </CardContent>
        </Card>
    </div>
</main>

<Footer />