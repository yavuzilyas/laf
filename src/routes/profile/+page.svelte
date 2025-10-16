<script lang="ts">
    import Navbar from "$lib/Navbar.svelte";
    import Footer from "$lib/Footer.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
    import { Separator } from "$lib/components/ui/separator";
    import { t } from '$lib/stores/i18n.svelte.ts';
    import { 
        User, 
        Mail, 
        Calendar, 
        MapPin, 
        Link as LinkIcon, 
        Edit, 
        Save, 
        X, 
        Settings,
        BookOpen,
        MessageCircle,
        Heart,
        Eye,
        Shield,
        Globe
    } from "@lucide/svelte";
    import { page } from '$app/stores';

    // Get user data from layout
    let { data } = $props();
    let user = data?.user;

    // Profile editing state
    let isEditing = $state(false);
    let isSaving = $state(false);

    // Profile form data
    let profileData = $state({
        name: user?.name || "",
        surname: user?.surname || "",
        nickname: user?.nickname || "",
        email: user?.email || "",
        bio: user?.bio || "",
        location: user?.location || "",
        website: user?.website || "",
        birthDate: user?.birthDate || "",
        interests: user?.interests || [],
        socialLinks: user?.socialLinks || {
            twitter: "",
            github: "",
            linkedin: ""
        }
    });

    // Mock user stats - replace with real data
    let userStats = {
        articlesCount: 12,
        commentsCount: 45,
        likesReceived: 234,
        profileViews: 1250,
        joinDate: user?.createdAt || new Date().toISOString()
    };

    // Mock user articles - replace with real data
    let userArticles = [
        {
            id: "1",
            title: "Özgürlük ve Bireysel Haklar",
            excerpt: "Modern toplumda bireysel hakların önemi...",
            publishedAt: "2024-01-15",
            views: 450,
            likes: 23,
            comments: 8
        },
        {
            id: "2", 
            title: "Anarşist Düşüncenin Temelleri",
            excerpt: "Anarşist felsefenin temel prensipleri...",
            publishedAt: "2024-01-10",
            views: 320,
            likes: 18,
            comments: 12
        }
    ];

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
                // Update user data
                user = { ...user, ...profileData };
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
        // Reset form data
        profileData = {
            name: user?.name || "",
            surname: user?.surname || "",
            nickname: user?.nickname || "",
            email: user?.email || "",
            bio: user?.bio || "",
            location: user?.location || "",
            website: user?.website || "",
            birthDate: user?.birthDate || "",
            interests: user?.interests || [],
            socialLinks: user?.socialLinks || {
                twitter: "",
                github: "",
                linkedin: ""
            }
        };
        isEditing = false;
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
      import { Motion, useAnimation } from "svelte-motion";

    let list = {
  visible: {
    clipPath: "inset(0% 0% 0% 0% round 12px)",
    transition: {
      type: "spring",
      bounce: 0,
    },
    filter: "blur(0px)",
  },
  hidden: {
    clipPath: "inset(5% 5% 95% 95% round 12px)", // sağdan sola kapanır
    transition: {
      duration: 0.45,
      type: "spring",
      bounce: 0,
    },
    filter: "blur(12px)",
  },
};
    import Loader from "$lib/components/load.svelte";
    import NotLogged from "$lib/components/notLogged.svelte";
</script>
<Loader />
<svelte:head>
    <title>{t('profile.title')} - LAF</title>
    <meta name="description" content={t('profile.description')} />
</svelte:head>

<Navbar />

<main class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        {#if !user}
            <NotLogged />
        {:else}
            <!-- Profile Header -->
             
            <div class="mb-8">
                <Card>
                    <CardContent class="p-6">
                        <div class="flex flex-col md:flex-row gap-6">
                            <!-- Avatar -->
                            <div class="flex-shrink-0">
                                <div class="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User class="w-16 h-16 text-primary" />
                                </div>
                            </div>

                            <!-- Profile Info -->
                            <div class="flex-1">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 class="text-3xl font-bold">
                                            {profileData.name && profileData.surname 
                                                ? `${profileData.name} ${profileData.surname}`
                                                : profileData.nickname}
                                        </h1>
                                        <p class="text-muted-foreground">@{profileData.nickname}</p>
                                    </div>
                                    
                                    <Button
                                        variant={isEditing ? "destructive" : "outline"}
                                        size="sm"
                                        onclick={isEditing ? handleCancelEdit : () => isEditing = true}
                                    >
                                        {#if isEditing}
                                            <X class="w-4 h-4 mr-2" />
                                            {t('Cancel')}
                                        {:else}
                                            <Edit class="w-4 h-4 mr-2" />
                                            {t('profile.edit')}
                                        {/if}
                                    </Button>
                                </div>

                                {#if isEditing}
                                    <!-- Edit Mode -->
                                    <div class="space-y-4">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label for="name">{t('Name')}</Label>
                                                <Input id="name" bind:value={profileData.name} />
                                            </div>
                                            <div>
                                                <Label for="surname">{t('Surname')}</Label>
                                                <Input id="surname" bind:value={profileData.surname} />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <Label for="bio">{t('profile.bio')}</Label>
                                            <Textarea 
                                                id="bio" 
                                                bind:value={profileData.bio} 
                                                placeholder={t('profile.bioPlaceholder')}
                                                rows="3"
                                                class="max-h-fit"
                                            />
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label for="location">{t('profile.location')}</Label>
                                                <Input id="location" bind:value={profileData.location} />
                                            </div>
                                            <div>
                                                <Label for="website">{t('profile.website')}</Label>
                                                <Input id="website" bind:value={profileData.website} type="url" />
                                            </div>
                                        </div>

                                        <Button onclick={handleSaveProfile} disabled={isSaving}>
                                            {#if isSaving}
                                                <Save class="w-4 h-4 mr-2 animate-spin" />
                                                {t('Saving')}
                                            {:else}
                                                <Save class="w-4 h-4 mr-2" />
                                                {t('Save')}
                                            {/if}
                                        </Button>
                                    </div>
                                {:else}
                                    <!-- View Mode -->
                                    <div class="space-y-3">
                                        {#if profileData.bio}
                                            <p class="text-foreground">{profileData.bio}</p>
                                        {/if}
                                        
                                        <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            {#if profileData.location}
                                                <div class="flex items-center gap-1">
                                                    <MapPin class="w-4 h-4" />
                                                    {profileData.location}
                                                </div>
                                            {/if}
                                            
                                            {#if profileData.website}
                                                <div class="flex items-center gap-1">
                                                    <LinkIcon class="w-4 h-4" />
                                                    <a href={profileData.website} target="_blank" class="text-primary hover:underline">
                                                        {profileData.website}
                                                    </a>
                                                </div>
                                            {/if}
                                            
                                            <div class="flex items-center gap-1">
                                                <Calendar class="w-4 h-4" />
                                                {formatDate(userStats.joinDate)} tarihinde katıldı
                                            </div>
                                        </div>

                                        <!-- Interests -->
                                        {#if profileData.interests.length > 0}
                                            <div class="flex flex-wrap gap-2 mt-4">
                                                {#each profileData.interests as interest}
                                                    <Badge variant="secondary">{interest}</Badge>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent class="p-4 text-center">
                        <BookOpen class="w-8 h-8 text-primary mx-auto mb-2" />
                        <div class="text-2xl font-bold">{userStats.articlesCount}</div>
                        <div class="text-sm text-muted-foreground">{t('profile.articles')}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent class="p-4 text-center">
                        <MessageCircle class="w-8 h-8 text-primary mx-auto mb-2" />
                        <div class="text-2xl font-bold">{userStats.commentsCount}</div>
                        <div class="text-sm text-muted-foreground">{t('profile.comments')}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent class="p-4 text-center">
                        <Heart class="w-8 h-8 text-primary mx-auto mb-2" />
                        <div class="text-2xl font-bold">{userStats.likesReceived}</div>
                        <div class="text-sm text-muted-foreground">{t('profile.likes')}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent class="p-4 text-center">
                        <Eye class="w-8 h-8 text-primary mx-auto mb-2" />
                        <div class="text-2xl font-bold">{userStats.profileViews}</div>
                        <div class="text-sm text-muted-foreground">{t('profile.views')}</div>
                    </CardContent>
                </Card>
            </div>

            <!-- Profile Tabs -->
            <Tabs value="articles" class="w-full">
                <TabsList class="grid w-full grid-cols-3">
                    <TabsTrigger value="articles">{t('profile.myArticles')}</TabsTrigger>
                    <TabsTrigger value="activity">{t('profile.activity')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="articles" class="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.myArticles')}</CardTitle>
                            <CardDescription>{t('profile.articlesDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {#if userArticles.length > 0}
                                <div class="space-y-4">
                                    {#each userArticles as article}
                                        <div class="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                            <h3 class="font-semibold mb-2">{article.title}</h3>
                                            <p class="text-muted-foreground text-sm mb-3">{article.excerpt}</p>
                                            <div class="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{formatDate(article.publishedAt)}</span>
                                                <div class="flex items-center gap-4">
                                                    <span class="flex items-center gap-1">
                                                        <Eye class="w-3 h-3" />
                                                        {article.views}
                                                    </span>
                                                    <span class="flex items-center gap-1">
                                                        <Heart class="w-3 h-3" />
                                                        {article.likes}
                                                    </span>
                                                    <span class="flex items-center gap-1">
                                                        <MessageCircle class="w-3 h-3" />
                                                        {article.comments}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <div class="text-center py-8">
                                    <BookOpen class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p class="text-muted-foreground">{t('profile.noArticles')}</p>
                                </div>
                            {/if}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="activity" class="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.recentActivity')}</CardTitle>
                            <CardDescription>{t('profile.activityDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="text-center py-8">
                                <MessageCircle class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p class="text-muted-foreground">{t('profile.noActivity')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="settings" class="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('profile.accountSettings')}</CardTitle>
                            <CardDescription>{t('profile.settingsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <!-- Interests Management -->
                            {#if isEditing}
                                <div>
                                    <Label>{t('profile.interests')}</Label>
                                    <div class="flex gap-2 mt-2">
                                        <Input 
                                            bind:value={newInterest} 
                                            placeholder={t('profile.addInterest')}
                                            onkeydown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addInterest(newInterest);
                                                    newInterest = "";
                                                }
                                            }}
                                        />
                                        <Button 
                                            size="sm" 
                                            onclick={() => {
                                                addInterest(newInterest);
                                                newInterest = "";
                                            }}
                                        >
                                            {t('Add')}
                                        </Button>
                                    </div>
                                    <div class="flex flex-wrap gap-2 mt-3">
                                        {#each profileData.interests as interest}
                                            <Badge variant="outline" class="gap-1">
                                                {interest}
                                                <button
                                                    onclick={() => removeInterest(interest)}
                                                    class="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                >
                                                    <X class="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Privacy Settings -->
                            <div>
                                <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Shield class="w-4 h-4" />
                                    {t('profile.privacy')}
                                </h3>
                                <div class="space-y-3 text-sm text-muted-foreground">
                                    <p>{t('profile.privacyDescription')}</p>
                                </div>
                            </div>

                            <!-- Language Settings -->
                            <div>
                                <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Globe class="w-4 h-4" />
                                    {t('profile.language')}
                                </h3>
                                <div class="space-y-3 text-sm text-muted-foreground">
                                    <p>{t('profile.languageDescription')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        {/if}
    </div>
</main>

<Footer />
