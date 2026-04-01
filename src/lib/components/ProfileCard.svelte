<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
  import { Card, CardContent } from "$lib/components/ui/card";
  import A from "$lib/components/ui/a.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import BadgeList from "$lib/components/BadgeList.svelte";
  import { t } from '$lib/stores/i18n.svelte';
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { MoreVertical, Flag } from "@lucide/svelte";
  import ReportDrawer from "$lib/components/ReportDrawer.svelte";
    import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Popover from "$lib/components/ui/popover/index.js";
    import Loader from "@lucide/svelte/icons/loader";
  import {
    Camera,
    Edit,
    X,
    Save,
    ExternalLink,
    MapPin,
    Link as LinkIcon,
    Calendar,
    Loader2,
    Image as ImageIcon,
    Trash2,
    Palette,
    UserPlus,
    UserMinus,
    Ban,
    Shield
  } from "@lucide/svelte";
      let showAvatarDialog = $state(false);
      let showFollowersDialog = $state(false);
      let showFollowingDialog = $state(false);

    const openAvatarDialog = () => {
        showAvatarDialog = true;
    };

    const closeAvatarDialog = () => {
        showAvatarDialog = false;
    };

    const openFollowersDialog = () => {
        showFollowersDialog = true;
    };

    const openFollowingDialog = () => {
        showFollowingDialog = true;
    };

    const closeFollowersDialog = () => {
        showFollowersDialog = false;
    };

    const closeFollowingDialog = () => {
        showFollowingDialog = false;
    };

    // Debug: Check isFollowing values (only in browser)
    $effect(() => {
        if (typeof window !== 'undefined') {
            if (followersList) {
                console.log('Followers with isFollowing:', followersList.map(f => ({id: f.id, username: f.username, isFollowing: f.isFollowing})));
            }
            if (followingList) {
                console.log('Following with isFollowing:', followingList.map(f => ({id: f.id, username: f.username, isFollowing: f.isFollowing})));
            }
        }
    });

    // Follow/unfollow functions for dialog users
    const handleFollowUser = async (userId: string) => {
        try {
            console.log('Attempting to follow user:', userId);
            console.log('Current user ID:', currentUserId);
            
            // Don't allow self-follow
            if (userId === currentUserId) {
                console.log('Cannot follow yourself');
                return;
            }
            
            // Call the API to follow user
            const response = await fetch(`/api/users/${userId}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Follow response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Follow API error:', errorData);
                return;
            }
            
            // Update the local state to reflect the follow
            // Create new arrays to trigger reactivity in Svelte 5
            if (followersList) {
                followersList = followersList.map(f => 
                    f.id === userId ? { ...f, isFollowing: true } : f
                );
            }
            if (followingList) {
                followingList = followingList.map(f => 
                    f.id === userId ? { ...f, isFollowing: true } : f
                );
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const handleUnfollowUser = async (userId: string) => {
        try {
            console.log('Attempting to unfollow user:', userId);
            console.log('Current user ID:', currentUserId);
            
            // Don't allow self-unfollow
            if (userId === currentUserId) {
                console.log('Cannot unfollow yourself');
                return;
            }
            
            // Call the API to unfollow user
            const response = await fetch(`/api/users/${userId}/follow`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Unfollow response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Unfollow API error:', errorData);
                return;
            }
            
            // Update the local state to reflect the unfollow
            // Create new arrays to trigger reactivity in Svelte 5
            if (followersList) {
                followersList = followersList.map(f => 
                    f.id === userId ? { ...f, isFollowing: false } : f
                );
            }
            if (followingList) {
                followingList = followingList.map(f => 
                    f.id === userId ? { ...f, isFollowing: false } : f
                );
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            console.log('Attempting to block user:', userId);
            console.log('Current user ID:', currentUserId);
            
            if (userId === currentUserId) {
                console.log('Cannot block yourself');
                return;
            }
            
            const response = await fetch(`/api/users/${userId}/block`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Block response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Block API error:', errorData);
                return;
            }
            
            // Update the local state to reflect the block
            // Blocked users are removed from followers/following lists automatically by API
            if (followersList) {
                followersList = followersList.filter(f => f.id !== userId);
            }
            if (followingList) {
                followingList = followingList.filter(f => f.id !== userId);
            }
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    const handleUnblockUser = async (userId: string) => {
        try {
            console.log('Attempting to unblock user:', userId);
            console.log('Current user ID:', currentUserId);
            
            if (userId === currentUserId) {
                console.log('Cannot unblock yourself');
                return;
            }
            
            const response = await fetch(`/api/users/${userId}/block`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Unblock response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Unblock API error:', errorData);
                return;
            }
            
            // Update the local state to reflect the unblock
            if (followersList) {
                followersList = followersList.map(f => 
                    f.id === userId ? { ...f, isBlocked: false } : f
                );
            }
            if (followingList) {
                followingList = followingList.map(f => 
                    f.id === userId ? { ...f, isBlocked: false } : f
                );
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };
  type ProfileData = {
    name?: string;
    surname?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    interests?: string[];
    avatar?: string;
    bannerColor?: string;
    bannerImage?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      [key: string]: string | undefined;
    };
    badges?: any[];
  };

  type ProfileUser = {
    username: string;
  } & Record<string, unknown>;

  let {
    profileData,
    profileUser,
    isOwnProfile = false,
    isEditing = false,
    isSaving = false,
    avatarUploading = false,
    bannerUploading = false,
    avatarInputId = 'avatar-upload',
    bannerInputId = 'banner-upload',
    joinDate,
    formatDate = (date) => new Date(date).toLocaleDateString(),
    onToggleEdit = () => {},
    onCancelEdit = () => {},
    onSaveProfile = () => {},
    onTriggerAvatarFile = () => {},
    onAvatarUpload = () => {},
    onAvatarRemove = () => {},
    onInterestAdd = () => {},
    onInterestRemove = () => {},
    onBannerColorChange = () => {},
    onTriggerBannerFile = () => {},
    onBannerUpload = () => {},
    onBannerRemove = () => {},
    onFollowUser = () => {},
    onUnfollowUser = () => {},
    onBlockUser = () => {},
    onUnblockUser = () => {},
    isFollowing = false,
    isBlocked = false,
    followersCount = 0,
    followingCount = 0,
    isFollowingMe = false,
    followersList = [],
    followingList = [],
    currentUserId = '',
    showProfileLink = false, // New prop to control link visibility
  } = $props();

  let showEditForm = $state(false);
  let showReportDrawer = $state(false);
  let cardRef: HTMLDivElement;

  // Create reactive form data for editing
  let formData = $state({
    name: profileData?.name || "",
    surname: profileData?.surname || "",
    bio: profileData?.bio || "",
    location: profileData?.location || profileData?.preferences?.location || "",
    website: profileData?.website || profileData?.preferences?.website || "",
    interests: profileData?.interests || profileData?.preferences?.interests || [],
    bannerColor: profileData?.bannerColor || profileData?.preferences?.bannerColor || "#0f172a",
    bannerImage: profileData?.bannerImage || profileData?.preferences?.bannerImage || "",
    avatar: profileData?.avatar || ""
  });

  // Watch for profileData changes to keep formData in sync
  $effect(() => {
    if (!isEditing) {
      formData = {
        name: profileData?.name || "",
        surname: profileData?.surname || "",
        bio: profileData?.bio || "",
        location: profileData?.location || profileData?.preferences?.location || "",
        website: profileData?.website || profileData?.preferences?.website || "",
        interests: profileData?.interests || profileData?.preferences?.interests || [],
        bannerColor: profileData?.bannerColor || profileData?.preferences?.bannerColor || "#0f172a",
        bannerImage: profileData?.bannerImage || profileData?.preferences?.bannerImage || "",
        avatar: profileData?.avatar || ""
      };
    }
  });

  // Watch for isEditing changes to handle animation timing
  $effect(() => {
    if (isEditing) {
      // Reset form data when entering edit mode
      formData = {
        name: profileData?.name || "",
        surname: profileData?.surname || "",
        bio: profileData?.bio || "",
        location: profileData?.location || profileData?.preferences?.location || "",
        website: profileData?.website || profileData?.preferences?.website || "",
        interests: profileData?.interests || profileData?.preferences?.interests || [],
        bannerColor: profileData?.bannerColor || profileData?.preferences?.bannerColor || "#0f172a",
        bannerImage: profileData?.bannerImage || profileData?.preferences?.bannerImage || "",
        avatar: profileData?.avatar || ""
      };
      
      // Reset showEditForm when entering edit mode
      showEditForm = false;
      
      // Wait for card expansion animation to complete (500ms)
      const timer = setTimeout(() => {
        showEditForm = true;
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      showEditForm = false;
    }
  });

  const getDisplayName = (user: any) => {
    if (!user) return '';
    const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim();
    return fullName || user.username || '';
  };

  let interestInput = $state("");

  const submitInterest = () => {
    const value = interestInput.trim();
    if (!value) return;
    onInterestAdd(value);
    interestInput = "";
  };

  const handleInterestKey = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitInterest();
    }
  };

  const handleColorInput = (value: string) => {
    if (!formData) return;
    formData.bannerColor = value;
    onBannerColorChange(value);
  };
</script>

<Card class="overflow-hidden pt-0 h-full transition-all duration-500 ease-in-out {isEditing ? 'min-h-[760px] sm:min-h-[660px]' : 'min-h-[350px]'} flex flex-col">
  <div class="relative w-full pt-0 transition-all duration-500 ease-in-out {isEditing ? 'min-h-[150px] sm:min-h-[225px]' : 'min-h-[185px] sm:min-h-[300px]'}">
    {#if profileData?.bannerImage}
      <img
        src={profileData.bannerImage}
        alt={t('profile.bannerAlt') ?? 'Profile banner'}
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-background/10  to-background"></div>
    {:else}
      <div
        class="absolute inset-0"
        style={`background: ${profileData?.bannerColor || '#0f172a'}`}
      ></div>
    {/if}

    {#if bannerUploading}
      <div class="absolute inset-0 flex items-center justify-center bg-black/40">
        <Loader2 class="h-8 w-8 animate-spin text-white" />
      </div>
    {/if}

    {#if isOwnProfile && isEditing}
      <div class="absolute z-20 bottom-3 right-3 flex flex-wrap gap-2">
        <Button size="xs" variant="outline" onclick={onTriggerBannerFile}>
          {#if bannerUploading}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
            <ImageIcon class="h-4 w-4" />
          {/if}
          <span class="hidden sm:inline">{t('profile.changeBanner')}</span>
        </Button>
        <input
          type="color"
          class="hidden"
          id="banner-color-input"
          value={formData.bannerColor || '#0f172a'}
          oninput={(event) => handleColorInput((event.target as HTMLInputElement).value)}
        />
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button size="xs" variant="outline">
              <Palette class="h-4 w-4" />
              <span class="hidden sm:inline">{t('profile.changeBannerColor')}</span>
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-auto p-3" side="bottom" align="start">
            <div class="flex items-center gap-3">
              <input
                type="color"
                class="h-10 w-16 cursor-pointer rounded border"
                value={formData.bannerColor || '#0f172a'}
                oninput={(event) => handleColorInput((event.target as HTMLInputElement).value)}
              />
              <Input
                value={formData.bannerColor || '#0f172a'}
                onchange={(event) => handleColorInput((event.target as HTMLInputElement).value)}
                placeholder="#0f172a"
                class="w-24"
              />
            </div>
          </Popover.Content>
        </Popover.Root>
        {#if profileData?.bannerImage}
          <Button size="xs" variant="destructive" onclick={onBannerRemove}>
            <Trash2 class="h-4 w-4" />
            <span class=" hidden sm:inline">{t('profile.removeBanner')}</span>
          </Button>
        {/if}
      </div>
    {/if}
  </div>

  <CardContent class="pt-0 transition-all duration-500 ease-in-out {isEditing ? 'translate-y-1' : 'translate-y-0'} flex-1 flex flex-col">
    <div class="flex flex-col gap-4 sm:gap-6 md:flex-row flex-1">
      <div class="relative -mt-14 sm:-mt-16 flex-shrink-0">
        <div class="relative">
          <Avatar class="h-21 w-21 sm:h-32 sm:w-32 rounded-full border-background shadow-lg transition-all duration-300 ease-in-out {isEditing ? 'scale-110 shadow-xl' : 'scale-100 hover:scale-105'}">
            {#if profileData?.avatar}
              <AvatarImage
                src={profileData.avatar}
                alt={profileData.username || 'Avatar'}
                class="object-cover"
              />
            {/if}
            <AvatarFallback class="text-3xl">
              {(() => {
                const name = profileData?.name;
                const surname = profileData?.surname;
                const username = profileData?.username || profileUser?.username;
                
                if (name && surname) {
                  return (name[0] + surname[0]).toUpperCase();
                } else if (name) {
                  return name[0].toUpperCase();
                } else if (username) {
                  return username[0].toUpperCase();
                }
                return 'U';
              })()}
            </AvatarFallback>
          </Avatar>

        </div>

      </div>

      <div class="flex-1 -mt-10 sm:-mt-3 space-y-4 pt-8 md:pt-4 transition-all duration-1200 ease-in-out flex flex-col">
        <div>
          <div class="flex items-center gap-1">
            <h1 class="text-lg font-bold text-foreground">
              {profileData?.name && profileData?.surname 
                ? `${profileData.name} ${profileData.surname}`
                : profileData?.name || profileData?.username}
            </h1>
            {#if showProfileLink && profileData?.username}
              <a 
                href={`/${profileData.username}`}
                class="text-muted-foreground hover:text-primary transition-colors ml-1"
                aria-label={t('profile.viewProfile')}
                title={t('profile.viewProfile')}
              >
                <ExternalLink class="h-3 w-3" />
              </a>
            {/if}
          </div>
          <p class="text-muted-foreground">@{profileUser?.username || profileData?.username}</p>
        </div>

        {#if showEditForm && isEditing && isOwnProfile}
          <div class="space-y-4 opacity-0 animate-slideDown">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label for="name">{t('Name')}</Label>
                <Input id="name" bind:value={formData.name} placeholder="{t('Name')}" class="transition-all duration-300 ease-in-out " />
              </div>
              <div>
                <Label for="surname">{t('Surname')}</Label>
                <Input id="surname" bind:value={formData.surname} placeholder="{t('Surname')}" class="transition-all duration-300 ease-in-out " />
              </div>
            </div>

            <div>
              <Label for="bio">{t('profile.bio')}</Label>
              <Textarea
                id="bio"
                bind:value={formData.bio}
                placeholder={t('profile.bioPlaceholder')}
                rows="3"
                class="max-h-fit transition-all duration-300 ease-in-out "
              />
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label for="location">{t('profile.location')}</Label>
                <Input id="location" bind:value={formData.location} placeholder={t('profile.location')} class="transition-all duration-300 ease-in-out " />
              </div>
              <div>
                <Label for="website">{t('profile.website')}</Label>
                <Input id="website" bind:value={formData.website} type="url" placeholder="https://" class="transition-all duration-300 ease-in-out " />
              </div>
            </div>
<!-- 
            <div>
              <Label>{t('profile.interests')}</Label>
              <div class="mt-2 flex gap-2">
                <Input
                  bind:value={interestInput}
                  placeholder={t('profile.addInterest')}
                  onkeydown={handleInterestKey}
                />
                <Button size="xs" onclick={submitInterest}>
                  {t('Add')}
                </Button>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                {#each profileData?.interests ?? [] as interest}
                  <Badge variant="outline" class="gap-1">
                    {interest}
                    <Button
                      onclick={() => onInterestRemove(interest)}
                    >
                      <X class="h-3 w-3" />
                    </Button>
                  </Badge>
                {/each}
              </div>
            </div> -->

            <Button onclick={() => onSaveProfile(formData)} disabled={isSaving} size="xs" class="w-full" >
              {#if isSaving}
                <Save class=" h-4 w-4 animate-spin" />
                {t('Saving')}
              {:else}
                <Save class=" h-4 w-4" />
                {t('Save')}
              {/if}
            </Button>
          </div>
        {:else}
          <div class="space-y-2 sm:space-y-3 opacity-0 animate-fadeIn flex-1 flex flex-col">
            {#if profileData?.bio}
              <p class="text-sm text-foreground">{profileData.bio}</p>
            {/if}
            
            {#if profileData?.badges && profileData.badges.length > 0}
              <div class="flex items-center gap-2">
                <BadgeList badges={profileData.badges} size="sm" maxVisible={3} />
              </div>
            {/if}
            
            <div class="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {#if (profileData?.location || profileData?.preferences?.location)}
                <div class="flex items-center gap-1">
                  <MapPin class="h-4 w-4" />
                  {profileData?.location || profileData?.preferences?.location}
                </div>
              {/if}
              {#if (profileData?.website || profileData?.preferences?.website)}
                <div class="flex items-center gap-1">
                  <LinkIcon class="h-4 w-4" />
                  <a
                    href={profileData?.website || profileData?.preferences?.website}
                    target="_blank"
                    class="flex items-center gap-1 text-primary hover:underline"
                  >
                    {profileData?.website || profileData?.preferences?.website}
                    <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
              {/if}
              {#if joinDate}
                <div class="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <Calendar class="h-4 w-4" />
                  {formatDate(String(joinDate))} {t('profile.joined')}
                </div>
              {/if}
                
              
                  <div class="flex flex-wrap items-center gap-0.5 w-full text-sm -mt-1">
                                        <Button
                      variant="ghost"
                      size="xs"
                      onclick={openFollowersDialog}
                      aria-label={t('profile.followers')}
                    >
                      <strong>{followersCount}</strong> {t('profile.followers')}
                    </Button>
                                        <Button
                      variant="ghost"
                      size="xs"
                      onclick={openFollowingDialog}
                      aria-label={t('profile.following')}
                    >
                      <strong>{followingCount}</strong> {t('profile.following')}
                    </Button>
                                  {#if !isOwnProfile && isFollowingMe}
                <Badge variant="secondary" class="text-[11px] font-medium">
                  {t('profile.followsYou') ?? 'Seni takip ediyor'}
                </Badge>
              {/if}
                  </div>
            </div>
            
            {#if !isOwnProfile}
              <div class="absolute top-2 right-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreVertical class="h-4 w-4" />
                      <span class="sr-only">More options</span>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onclick={() => showReportDrawer = true}>
                      <Flag class="h-4 w-4" />
                      <span>{t('report.reportProfile')}</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            {/if}

            <!-- {#if (profileData?.interests ?? []).length > 0}
              <div class="mt-4 flex flex-wrap gap-2">
                {#each profileData?.interests ?? [] as interest}
                  <Badge variant="secondary">{interest}</Badge>
                {/each}
              </div>
            {/if} -->
          </div>
        {/if}
      </div>

        <div class="flex flex-col gap-2 mt-auto">
          {#if isOwnProfile}

 
         
            <Button size="xs" variant="outline" onclick={onTriggerAvatarFile}>
              {#if avatarUploading}
                <Loader class="h-4 w-4 text-primary animate-spin" />
                {t('profile.avatarUploading')}
              {:else}
                <Camera class="h-4 w-4" />
                {t('profile.changeAvatar')}
              {/if}
            </Button>
            {#if profileData?.avatar}
              <Button size="xs" variant="destructive" onclick={onAvatarRemove}>
                <Trash2 class="h-4 w-4" />
                {t('profile.removeAvatar')}
              </Button>
            {/if}
                       <Button
              size="xs"
              variant={isEditing ? "destructive" : "outline"}
              onclick={isEditing ? onCancelEdit : onToggleEdit}
            >
              {#if isEditing}
                <X class="h-4 w-4" />
                {t('Cancel')}
              {:else}
                <Edit class="h-4 w-4" />
                {t('profile.edit')}
              {/if}
            </Button>
          {:else}
            <div class="flex gap-2 items-center">
              {#if isFollowing}
                <Button size="xs" variant="outline" onclick={onUnfollowUser}>
                  <UserMinus class="h-4 w-4" />
                  {t('profile.unfollow')}
                </Button>
              {:else}
                <Button size="xs" onclick={onFollowUser}>
                  <UserPlus class="h-4 w-4" />
                  {t('profile.follow')}
                </Button>
              {/if}
              {#if isBlocked}
                <Button size="xs" variant="outline" onclick={onUnblockUser}>
                  <Shield class="h-4 w-4" />
                  {t('profile.unblock')}
                </Button>
              {:else}
                <Button size="xs" variant="outline" onclick={onBlockUser}>
                  <Ban class="h-4 w-4" />
                  {t('profile.block')}
                </Button>
              {/if}

            </div>
          {/if}
        </div>
    </div>

    <input
      id={avatarInputId}
      class="hidden"
      type="file"
      accept="image/*"
      onchange={onAvatarUpload}
    />
    <input
      id={bannerInputId}
      class="hidden"
      type="file"
      accept="image/*"
      onchange={onBannerUpload}
    />
  </CardContent>
  </Card>

  <!-- Report Drawer -->
  {#if !isOwnProfile}
    <ReportDrawer 
      bind:open={showReportDrawer} 
      reportType="profile"
       targetId={profileUser?._id || profileUser?.id}
      targetTitle={profileUser?.username}
    />
  {/if}

  <!-- Avatar Edit Dialog -->
  <Dialog.Root bind:open={showAvatarDialog} onOpenChange={closeAvatarDialog}>
    <Dialog.Content class="w-15/16  sm:w-1/2 md:w-2/7 ">
      <Dialog.Header>
            <Dialog.Title>{t('profile.editAvatar')}</Dialog.Title>
            <Dialog.Description>
                {t('profile.avatarDescription')}
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="py-4">
            <div class="flex flex-col items-center gap-4">
                <div class="relative">
                    <Avatar class="h-40 w-40">
                        {#if profileData.avatar}
                            <AvatarImage 
                                src={profileData.avatar} 
                                alt={profileData.username || 'Avatar'} 
                                class="object-cover" 
                            />
                        {/if}
                        <AvatarFallback class="text-4xl">
                            {(profileData?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    
                    {#if avatarUploading}
                        <div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader class="h-4 w-4 text-primary animate-spin" />
                        </div>
                    {/if}
                </div>
                
                <div class="flex flex-col sm:flex-row gap-2 w-fit">
                    <Button 
                        variant="outline" 
                        class="flex-1" 
                        onclick={onTriggerAvatarFile}
                        disabled={avatarUploading}
                    >
                        {#if avatarUploading}
                <Loader class="h-4 w-4 text-primary animate-spin" />
                            {t('profile.avatarUploading')}
                        {:else}
                            <Camera class="h-4 w-4 " />
                            {t('profile.changeAvatar')}
                        {/if}
                    </Button>
                    
                    {#if profileData.avatar}
                        <Button 
                            variant="destructive" 
                            class="flex-1"
                            onclick={onAvatarRemove}
                            disabled={avatarUploading}
                        >
                            <Trash2 class="h-4 w-4 " />
                            {t('profile.removeAvatar')}
                        </Button>
                    {/if}
                </div>
                
                <div class="text-xs text-muted-foreground mt-2 text-center">
                    {t('profile.avatarRequirements')}
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showFollowersDialog} onOpenChange={closeFollowersDialog}>
  <Dialog.Content class="w-15/16 sm:w-2/3 md:w-2/7 ">
    <Dialog.Header>
      <Dialog.Title>{t('profile.followers')}</Dialog.Title>
    </Dialog.Header>

    <ScrollArea class="max-h-[60vh]">
      {#if (followersList?.length ?? 0) > 0}
        <ul class="space-y-3">
          {#each followersList ?? [] as follower (follower.id)}
            <li class="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div class="flex max-w-[calc(100%-4rem)] items-center gap-3 flex-1">
                <a href={`/${follower.username}`}>
                <Avatar class="h-10 w-10">
                  {#if follower.avatar}
                    <AvatarImage src={follower.avatar} alt={getDisplayName(follower)} class="object-cover" />
                  {/if}
                  <AvatarFallback>
                    {(follower.username?.[0] ?? '?').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                </a>
                <div class="flex flex-col text-sm flex-1">
                  <a href={`/${follower.username}`} class="font-semibold text-foreground hover:text-primary transition-colors">{getDisplayName(follower)}</a>
                  <a href={`/${follower.username}`} class="text-muted-foreground hover:text-primary transition-colors">@{follower.username}</a>
                </div>
              </div>
              {#if follower.id !== currentUserId}
                {#if follower.isFollowing}
                  <Button size="icon" variant="outline" onclick={() => handleUnfollowUser(follower.id)}>
                    <UserMinus class="h-3 w-3" />
                  </Button>
                {:else}
                  <Button size="icon" onclick={() => handleFollowUser(follower.id)}>
                    <UserPlus class="h-3 w-3 " />
                  </Button>
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-muted-foreground">
          {t('profile.noFollowers') ?? 'Henüz takipçisi yok.'}
        </p>
      {/if}
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showFollowingDialog} onOpenChange={closeFollowingDialog}>
  <Dialog.Content class="w-15/16 sm:w-2/3 md:w-3/7 ">
    <Dialog.Header>
      <Dialog.Title>{t('profile.following')}</Dialog.Title>
    </Dialog.Header>

    <ScrollArea class="max-h-[60vh] ">
      {#if (followingList?.length ?? 0) > 0}
        <ul class="space-y-3 list-outside">
          {#each followingList ?? [] as following (following.id)}
            <li class="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div class="flex items-center gap-3 flex-1">
                <a href={`/${following.username}`}>
                  <Avatar class="h-10 w-10">
                    {#if following.avatar}
                      <AvatarImage src={following.avatar} alt={getDisplayName(following)} class="object-cover" />
                    {/if}
                    <AvatarFallback>
                      {(following.username?.[0] ?? '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </a>
                <div class="flex flex-col text-sm flex-1">
                  <a href={`/${following.username}`} class="font-semibold text-foreground hover:text-primary transition-colors">{getDisplayName(following)}</a>
                  <a href={`/${following.username}`} class="text-muted-foreground hover:text-primary transition-colors">@{following.username}</a>
                </div>
              </div>
              {#if following.id !== currentUserId}
                {#if following.isFollowing}
                  <Button size="icon" variant="outline" onclick={() => handleUnfollowUser(following.id)}>
                    <UserMinus class="h-3 w-3" />
                  </Button>
                {:else}
                  <Button size="icon" onclick={() => handleFollowUser(following.id)}>
                    <UserPlus class="h-3 w-3" />
                  </Button>
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-muted-foreground">
          {t('profile.noFollowing') ?? 'Henüz takip edilen kullanıcı yok.'}
        </p>
      {/if}
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
