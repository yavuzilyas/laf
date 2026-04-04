<script lang="ts">
    import { t } from '$lib/stores/i18n.svelte';
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
    import { afterNavigate, goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Loader from "$lib/components/load.svelte";
    import ArticleList from '$lib/components/ArticleList.svelte';

    // Layout mode state
    let layoutMode = $state("grid");

    let { data } = $props();
    let profileUser = data.profileUser;
    let userProfileData = data.userProfileData;
    const currentUser = data.currentUser;
    const currentUserId = currentUser?.id;
    const isModeratorOrAdmin = currentUser?.role === 'moderator' || currentUser?.role === 'admin';

    // SEO Meta computation
    const seoMeta = $derived((() => {
        const siteName = 'LAF - Libertarian Anarchist Foundation';
        const siteUrl = 'https://laf.international';
        const url = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/${profileUser?.username || profileUser?.id}`;

        const displayName = profileUser?.name && profileUser?.surname
            ? `${profileUser.name} ${profileUser.surname}`
            : profileUser?.username || 'LAF User';

        const bio = profileUser?.bio || `${displayName}'in LAF profili ve makaleleri.`;
        const title = `${displayName} (@${profileUser?.username}) | LAF`;

        return {
            title,
            description: bio,
            canonical: url,
            og: {
                title,
                description: bio,
                type: 'profile',
                url,
                site_name: siteName,
                image: profileUser?.avatar_url || `${siteUrl}/og-default.png`,
                image_alt: `${displayName}'s profile picture`
            },
            twitter: {
                card: 'summary',
                site: '@lafoundation',
                title,
                description: bio,
                image: profileUser?.avatar_url || `${siteUrl}/og-default.png`,
                image_alt: `${displayName}'s profile picture`
            },
            structuredData: {
                '@context': 'https://schema.org',
                '@type': 'ProfilePage',
                name: title,
                description: bio,
                url,
                mainEntity: {
                    '@type': 'Person',
                    name: displayName,
                    alternateName: profileUser?.username,
                    ...(profileUser?.avatar_url && { image: profileUser.avatar_url }),
                    description: bio,
                    url,
                    ...(profileUser?.created_at && {
                        memberOf: {
                            '@type': 'Organization',
                            name: siteName,
                            url: siteUrl
                        }
                    })
                }
            },
            breadcrumbs: {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Ana Sayfa',
                        item: siteUrl
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: displayName,
                        item: url
                    }
                ]
            }
        };
    })());

    const profileusernameSlug = $derived(() => {
        const value = profileUser?.username || profileUser?.id || 'user';
        return value
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'user';
    });
    const profileUserId = $derived(profileUser?.id);
    const serverArticles = data.articles ?? [];
    let stats = data.stats;
    let isOwnProfile = data.isOwnProfile;
    let isFollowingMe = data.isFollowingMe ?? false;
    let followersList = $state(data.followersList ?? []);
    let followingList = $state(data.followingList ?? []);
    
    // Track URL changes and reload when username changes
    onMount(() => {
        let previoususername = $page.params.nickname;
        
        return afterNavigate(({ to }) => {
            const newusername = to?.params.nickname;
            if (newusername && newusername !== previoususername) {
                previoususername = newusername;
                // Force a full page reload to ensure all data is refreshed
                window.location.href = to.url.href;
            }
        });
    });
    let viewerBlocksProfile = data.viewerBlocksProfile ?? false;

    // Reactive articles (using $derived rune)
    const articles = $derived(
        serverArticles.map((article) => {
            const translations = article.translations || {};
            const translationKeys = Object.keys(translations);
            const fallbackKey = translationKeys[0] || article.language || article.defaultLanguage || 'tr';
            const translation = translations[fallbackKey] || {};

            return {
                ...article,
                title: translation.title || article.title || 'Başlıksız',
                excerpt: translation.excerpt || article.excerpt || '',
                slug: translation.slug || article.slug,
                language: fallbackKey,
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
            : data?.followCounts?.followersCount ?? 0
    );
    let followingCount = $state(
        Array.isArray(profileUser?.following)
            ? profileUser.following.length
            : data?.followCounts?.followingCount ?? 0
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
        const previous = profileFormData.avatar;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'avatars');
            if (profileFormData.avatar) {
                formData.append('previousUrl', profileFormData.avatar);
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
            profileFormData.avatar = newAvatarUrl;

            const saved = await persistProfileUpdate({ avatar: newAvatarUrl });
            if (!saved) {
                profileFormData.avatar = previous;
                throw new Error('Failed to persist avatar');
            }

            profileUser = { ...profileUser, avatar_url: newAvatarUrl };
        } catch (error) {
            
            profileFormData.avatar = previous;
            profileUser = { ...profileUser, avatar_url: previous };
            alert(t('profile.avatarUploadError'));
        } finally {
            avatarUploading = false;
            input.value = "";
        }
    };

    const handleAvatarRemove = async () => {
        if (!profileFormData.avatar) return;

        const previous = profileFormData.avatar;
        profileFormData.avatar = "";

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

            profileUser = { ...profileUser, avatar_url: '' };
        } catch (error) {
            
            profileFormData.avatar = previous;
            profileUser = { ...profileUser, avatar_url: previous };
        }
    };

    // Profile form data
    let profileFormData = $state({
        name: profileUser?.name || "",
        surname: profileUser?.surname || "",
        username: profileUser?.username || "",
        bio: profileUser?.bio || "",
        avatar: profileUser?.avatar_url || "",
        location: profileUser?.location || "",
        website: profileUser?.preferences?.website || "",
        interests: profileUser?.preferences?.interests || [],
        bannerColor: profileUser?.preferences?.bannerColor || "#0f172a",
        bannerImage: profileUser?.preferences?.bannerImage || "",
        phoneNumber: profileUser?.phone_number || "",
        phoneNumberVisible: profileUser?.preferences?.phoneNumberVisible || false,
        email: profileUser?.email || "",
        emailVisible: profileUser?.preferences?.emailVisible || false,
        socialLinks: profileUser?.preferences?.socialLinks || {
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
            
            return false;
        }
    };

    const handleSaveProfile = async (formData?: any) => {
        isSaving = true;
        try {
            const dataToSave = formData || profileFormData;
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (response.ok) {
                isEditing = false;
                profileUser = { ...profileUser, ...dataToSave };
                // Sync profileFormData with saved data
                profileFormData = { ...profileFormData, ...dataToSave };
            } else {
                
            }
        } catch (error) {
            
        } finally {
            isSaving = false;
        }
    };

    const handleCancelEdit = () => {
        profileFormData = {
            name: profileUser?.name || "",
            surname: profileUser?.surname || "",
            username: profileUser?.username || "",
            bio: profileUser?.bio || "",
            avatar: profileUser?.avatar_url || "",
            location: profileUser?.location || "",
            website: profileUser?.preferences?.website || "",
            interests: profileUser?.preferences?.interests || [],
            bannerColor: profileUser?.preferences?.bannerColor || "#0f172a",
            bannerImage: profileUser?.preferences?.bannerImage || "",
            phoneNumber: profileUser?.phone_number || "",
            phoneNumberVisible: profileUser?.preferences?.phoneNumberVisible || false,
            email: profileUser?.email || "",
            emailVisible: profileUser?.preferences?.emailVisible || false,
            socialLinks: profileUser?.preferences?.socialLinks || {
                twitter: "",
                github: "",
                linkedin: ""
            }
        };
        isEditing = false;
    };

    const handleBannerColorChange = (color: string) => {
        profileFormData.bannerColor = color || DEFAULT_BANNER_COLOR;
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

        const previousBanner = profileFormData.bannerImage;
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
            if (profileFormData.bannerImage) {
                formData.append('previousUrl', profileFormData.bannerImage);
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
            profileFormData.bannerImage = newBannerUrl;

            const saved = await persistProfileUpdate({ bannerImage: newBannerUrl });
            if (!saved) {
                profileFormData.bannerImage = previousBanner;
                throw new Error('Failed to persist banner image');
            }

            profileUser = { ...profileUser, preferences: { ...profileUser.preferences, bannerImage: newBannerUrl } };
        } catch (error) {
            
            profileFormData.bannerImage = previousBanner;
            profileUser = { ...profileUser, preferences: { ...profileUser.preferences, bannerImage: previousBanner } };
            alert(t('profile.bannerUploadError') ?? 'Banner yüklenirken bir sorun oluştu.');
        } finally {
            bannerUploading = false;
            input.value = "";
        }
    };

    const handleBannerRemove = async () => {
        if (!profileFormData.bannerImage) return;

        const previous = profileFormData.bannerImage;
        profileFormData.bannerImage = "";

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

            profileUser = { ...profileUser, preferences: { ...profileUser.preferences, bannerImage: '' } };
        } catch (error) {
            
            profileFormData.bannerImage = previous;
            profileUser = { ...profileUser, preferences: { ...profileUser.preferences, bannerImage: previous } };
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
        if (interest.trim() && !profileFormData.interests.includes(interest.trim())) {
            profileFormData.interests = [...profileFormData.interests, interest.trim()];
        }
    };

    const removeInterest = (interest: string) => {
        profileFormData.interests = profileFormData.interests.filter(i => i !== interest);
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
                    
                }
                return;
            }

            const data = await response.json();
            isFollowing = !!data.following;
            followersCount = typeof data.followersCount === 'number' ? data.followersCount : followersCount;
            followingCount = typeof data.followingCount === 'number' ? data.followingCount : followingCount;
        } catch (error) {
            
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
                    
                }
                return;
            }

            const data = await response.json();
            // Sadece state değişmiyorsa güncelle (manuel değişimi koru)
            if (!isBlockedChanging) {
                isBlocked = !!data.blocked;
            }
        } catch (error) {
            
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
                
                return;
            }

            await loadFollowStatus(targetUserId);
        } catch (error) {
            
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
                
                return;
            }

            await loadFollowStatus(targetUserId);
        } catch (error) {
            
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
                
                // Hata durumunda state'i geri al
                isBlocked = true;
                isBlockedChanging = false;
                return;
            }

            // Başarılı olduğunda viewerBlocksProfile'u güncelle
            viewerBlocksProfile = false;
            await loadBlockStatus(targetUserId);
        } catch (error) {
            
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
    <title>{seoMeta.title}</title>
    <meta name="description" content={seoMeta.description} />
    <link rel="canonical" href={seoMeta.canonical} />

    <!-- Open Graph -->
    <meta property="og:title" content={seoMeta.og.title} />
    <meta property="og:description" content={seoMeta.og.description} />
    <meta property="og:type" content={seoMeta.og.type} />
    <meta property="og:url" content={seoMeta.og.url} />
    <meta property="og:site_name" content={seoMeta.og.site_name} />
    <meta property="og:image" content={seoMeta.og.image} />
    <meta property="og:image:alt" content={seoMeta.og.image_alt} />
    <meta property="og:image:width" content="400" />
    <meta property="og:image:height" content="400" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content={seoMeta.twitter.card} />
    <meta name="twitter:site" content={seoMeta.twitter.site} />
    <meta name="twitter:title" content={seoMeta.twitter.title} />
    <meta name="twitter:description" content={seoMeta.twitter.description} />
    <meta name="twitter:image" content={seoMeta.twitter.image} />
    <meta name="twitter:image:alt" content={seoMeta.twitter.image_alt} />

    <!-- Structured Data -->
    {@html `<script type="application/ld+json">${JSON.stringify(seoMeta.structuredData)}</script>`}
    {@html `<script type="application/ld+json">${JSON.stringify(seoMeta.breadcrumbs)}</script>`}
</svelte:head>

<Navbar />

<main class="min-h-screen bg-background">
    <div class="container mx-auto px-3 py-10 sm:px-4 max-w-6xl">
        <!-- Hidden Profile Warning for Moderators/Admins -->
        {#if profileUser?.is_hidden && isModeratorOrAdmin}
            <div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-4">
                <Shield class="h-5 w-5 shrink-0" />
                <div>
                    <p class="font-medium text-sm">{t('moderatorViewingHiddenProfile') ?? 'Moderatör Görünümü: Gizli Profil'}</p>
                </div>
            </div>
        {/if}

        <!-- Profile Header -->
        <div class="mb-8">
            <ProfileCard
                profileData={profileFormData}
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
                    {isOwnProfile ? t('profile.myArticlesDescription') : `@${profileUser.username}'s articles`}
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
                    <ArticleSearch
                        value={searchQuery}
                        suggestions={[]}
                        recentSearches={recentSearches}
                        articles={articles}
                        onSearch={handleSearch}
                        onClear={() => {
                            searchQuery = '';
                            applyFiltersAndSearch();
                        }}
                        class="w-full sm:max-w-xl"
                    />

                        <ArticleFilterPopover
                            options={filterOptions}
                            activeFilters={activeFilters}
                            onFiltersChange={handleFiltersChange}
                        />

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