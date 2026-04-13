<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';
	import Footer from '$lib/Footer.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Lens from '$lib/components/Lens.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { t, getCurrentLocale, localeConfig } from '$lib/stores/i18n.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { languages, localeNames, getLanguageDirection } from '$lib/data/languages';


	// Locale-aware URL helper
	const l = (path: string) => `/${currentLocale}${path}`;
	import { onMount } from 'svelte';
	import { afterNavigate, goto, replaceState } from '$app/navigation';
	import { EdraEditor, EdraToolBar } from '$lib/components/edra/shadcn/index.js';
	import type { Editor } from '@tiptap/core';
	import ProfileCard from '$lib/components/ProfileCard.svelte';
	import {
		Calendar,
		Clock,
		Eye,
		EyeOff,
		Heart,
		MessageCircle,
		Share2,
		User,
		Users,
		ArrowLeft,
		Languages,
		ThumbsDown,
		ThumbsUp,
		Hammer,
		Ellipsis,
		Trash
	} from '@lucide/svelte';
	import { BarSpinner } from '$lib/components/spell/bar-spinner';

	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { showToast, persistToast } from '$lib/hooks/toast';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		ArrowLeftIcon,
		MessageSquareIcon,
		EllipsisIcon,
		BookMinusIcon,
		NotebookPenIcon,
		EyeOffIcon,
		BadgeAlertIcon
	} from 'svelte-animate-icons';
	import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
	import { browser } from '$app/environment';
	import ReportDrawer from '$lib/components/ReportDrawer.svelte';
	import ArticleRecommendation from '$lib/components/ArticleRecommendation.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Dialog from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';

	let { data } = $props();
	let collaborators = $state(data.collaborators || []);
	let collaboratorProfiles = $state(data.collaboratorProfiles || []);
	let likesCount = $state<number>(Number(data.article?.stats?.likes) || 0);
	let dislikesCount = $state<number>(Number(data.article?.stats?.dislikes) || 0);
	let reaction = $state<'like' | 'dislike' | null>(null);
	let showReportDrawer = $state(false);

	// State for collaborator profile editing when the collaborator is the current user
	let collaboratorProfileData = $state<Record<string, any>>({});
	let collaboratorEditing = $state<Record<string, boolean>>({});
	let collaboratorSaving = $state<Record<string, boolean>>({});
	let collaboratorAvatarUploading = $state<Record<string, boolean>>({});
	let collaboratorBannerUploading = $state<Record<string, boolean>>({});
	let collaboratorFollowing = $state<Record<string, boolean>>({});
	let collaboratorBlocked = $state<Record<string, boolean>>({});

	// Initialize collaborator profile data when component mounts
	$effect(() => {
		collaboratorProfiles.forEach((collaborator: any) => {
			if (collaborator.id === currentUserId && !collaboratorProfileData[collaborator.id]) {
				collaboratorProfileData[collaborator.id] = {
					name: collaborator.name || '',
					surname: collaborator.surname || '',
					nickname: collaborator.nickname || '',
					bio: collaborator.bio || '',
					location: collaborator.preferences?.location || '',
					website: collaborator.preferences?.website || '',
					interests: collaborator.preferences?.interests || [],
					avatar: collaborator.avatar || '',
					bannerColor:
						collaborator.bannerColor ||
						collaborator.preferences?.bannerColor ||
						DEFAULT_BANNER_COLOR,
					bannerImage: collaborator.bannerImage || collaborator.preferences?.bannerImage || '',
					socialLinks: collaborator.preferences?.socialLinks || {
						twitter: '',
						github: '',
						linkedin: ''
					}
				};
				collaboratorEditing[collaborator.id] = false;
				collaboratorSaving[collaborator.id] = false;
				collaboratorAvatarUploading[collaborator.id] = false;
				collaboratorBannerUploading[collaborator.id] = false;
			}

			// Initialize follow/block status for all collaborators (except current user)
			if (collaborator.id !== currentUserId) {
				if (collaboratorFollowing[collaborator.id] === undefined) {
					collaboratorFollowing[collaborator.id] = false;
				}
				if (collaboratorBlocked[collaborator.id] === undefined) {
					collaboratorBlocked[collaborator.id] = false;
				}

				// Load actual follow/block status from server
				loadCollaboratorFollowStatus(collaborator.id);
			}
		});
	});

	// Load follow/block status for a specific collaborator
	const loadCollaboratorFollowStatus = async (collaboratorId: string) => {
		try {
			// Load follow status
			const followResponse = await fetch(`/api/users/${collaboratorId}/follow`);
			if (followResponse.ok) {
				const followData = await followResponse.json();
				collaboratorFollowing[collaboratorId] = !!followData.following;
			}

			// Load block status
			const blockResponse = await fetch(`/api/users/${collaboratorId}/block`);
			if (blockResponse.ok) {
				const blockData = await blockResponse.json();
				collaboratorBlocked[collaboratorId] = !!blockData.blocked;
			}
		} catch (error) {}
	};

	// Helper functions for collaborator follow/block
	const handleCollaboratorFollow = async (collaboratorId: string) => {
		if (!collaboratorId) return;
		try {
			const response = await fetch(`/api/users/${collaboratorId}/follow`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				return;
			}

			collaboratorFollowing[collaboratorId] = true;
			// Update followers count
			const collaboratorIndex = collaboratorProfiles.findIndex((c: any) => c.id === collaboratorId);
			if (collaboratorIndex !== -1) {
				collaboratorProfiles[collaboratorIndex] = {
					...collaboratorProfiles[collaboratorIndex],
					followersCount: (collaboratorProfiles[collaboratorIndex].followersCount || 0) + 1
				};
			}

			// Reload status to confirm
			await loadCollaboratorFollowStatus(collaboratorId);
		} catch (error) {}
	};

	const handleCollaboratorUnfollow = async (collaboratorId: string) => {
		if (!collaboratorId) return;
		try {
			const response = await fetch(`/api/users/${collaboratorId}/follow`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				return;
			}

			collaboratorFollowing[collaboratorId] = false;
			// Update followers count
			const collaboratorIndex = collaboratorProfiles.findIndex((c: any) => c.id === collaboratorId);
			if (collaboratorIndex !== -1) {
				collaboratorProfiles[collaboratorIndex] = {
					...collaboratorProfiles[collaboratorIndex],
					followersCount: Math.max(
						0,
						(collaboratorProfiles[collaboratorIndex].followersCount || 0) - 1
					)
				};
			}

			// Reload status to confirm
			await loadCollaboratorFollowStatus(collaboratorId);
		} catch (error) {}
	};

	const handleCollaboratorBlock = async (collaboratorId: string) => {
		if (!collaboratorId) return;

		collaboratorBlocked[collaboratorId] = true;

		try {
			const response = await fetch(`/api/users/${collaboratorId}/block`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				collaboratorBlocked[collaboratorId] = false;
				return;
			}

			// If following, unfollow first
			if (collaboratorFollowing[collaboratorId]) {
				await handleCollaboratorUnfollow(collaboratorId);
			}

			// Reload status to confirm
			await loadCollaboratorFollowStatus(collaboratorId);
		} catch (error) {
			collaboratorBlocked[collaboratorId] = false;
		}
	};

	const handleCollaboratorUnblock = async (collaboratorId: string) => {
		if (!collaboratorId) return;

		try {
			const response = await fetch(`/api/users/${collaboratorId}/block`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				return;
			}

			collaboratorBlocked[collaboratorId] = false;

			// Reload status to confirm
			await loadCollaboratorFollowStatus(collaboratorId);
		} catch (error) {}
	};

	// Helper functions for collaborator profile management
	const getCollaboratorProfileData = (collaboratorId: string) => {
		return (
			collaboratorProfileData[collaboratorId] ||
			collaboratorProfiles.find((c: any) => c.id === collaboratorId)
		);
	};

	const startCollaboratorEditing = (collaboratorId: string) => {
		collaboratorEditing[collaboratorId] = true;
	};

	const handleCollaboratorCancelEdit = (collaboratorId: string) => {
		const collaborator = collaboratorProfiles.find((c: any) => c.id === collaboratorId);
		if (collaborator) {
			collaboratorProfileData[collaboratorId] = {
				name: collaborator.name || '',
				surname: collaborator.surname || '',
				nickname: collaborator.nickname || '',
				bio: collaborator.bio || '',
				location: collaborator.preferences?.location || '',
				website: collaborator.preferences?.website || '',
				interests: collaborator.preferences?.interests || [],
				avatar: collaborator.avatar || '',
				bannerColor:
					collaborator.bannerColor || collaborator.preferences?.bannerColor || DEFAULT_BANNER_COLOR,
				bannerImage: collaborator.bannerImage || collaborator.preferences?.bannerImage || '',
				socialLinks: collaborator.preferences?.socialLinks || {
					twitter: '',
					github: '',
					linkedin: ''
				}
			};
		}
		collaboratorEditing[collaboratorId] = false;
	};

	const handleCollaboratorSaveProfile = async (collaboratorId: string) => {
		collaboratorSaving[collaboratorId] = true;
		try {
			const response = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(collaboratorProfileData[collaboratorId])
			});

			if (response.ok) {
				collaboratorEditing[collaboratorId] = false;
				// Update the collaborator in the profiles array
				const collaboratorIndex = collaboratorProfiles.findIndex(
					(c: any) => c.id === collaboratorId
				);
				if (collaboratorIndex !== -1) {
					collaboratorProfiles[collaboratorIndex] = {
						...collaboratorProfiles[collaboratorIndex],
						...collaboratorProfileData[collaboratorId]
					};
				}
			} else {
			}
		} catch (error) {
		} finally {
			collaboratorSaving[collaboratorId] = false;
		}
	};

	// Banner and avatar upload functions for collaborators
	const handleCollaboratorTriggerBannerFile = (collaboratorId: string) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				handleCollaboratorBannerUpload(collaboratorId, file);
			}
		};
		input.click();
	};

	const handleCollaboratorBannerUpload = async (collaboratorId: string, file: File) => {
		collaboratorBannerUploading[collaboratorId] = true;
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				const newBannerUrl = result.url;
				collaboratorProfileData[collaboratorId].bannerImage = newBannerUrl;

				const saveResponse = await fetch('/api/profile/update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ bannerImage: newBannerUrl })
				});

				if (saveResponse.ok) {
					// Update the collaborator in the profiles array
					const collaboratorIndex = collaboratorProfiles.findIndex(
						(c: any) => c.id === collaboratorId
					);
					if (collaboratorIndex !== -1) {
						collaboratorProfiles[collaboratorIndex] = {
							...collaboratorProfiles[collaboratorIndex],
							bannerImage: newBannerUrl
						};
					}
				}
			}
		} catch (error) {
		} finally {
			collaboratorBannerUploading[collaboratorId] = false;
		}
	};

	const handleCollaboratorBannerRemove = async (collaboratorId: string) => {
		if (!collaboratorProfileData[collaboratorId].bannerImage) return;

		collaboratorBannerUploading[collaboratorId] = true;
		try {
			collaboratorProfileData[collaboratorId].bannerImage = '';

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bannerImage: '' })
			});

			if (response.ok) {
				// Update the collaborator in the profiles array
				const collaboratorIndex = collaboratorProfiles.findIndex(
					(c: any) => c.id === collaboratorId
				);
				if (collaboratorIndex !== -1) {
					collaboratorProfiles[collaboratorIndex] = {
						...collaboratorProfiles[collaboratorIndex],
						bannerImage: ''
					};
				}
			}
		} catch (error) {
		} finally {
			collaboratorBannerUploading[collaboratorId] = false;
		}
	};

	const handleCollaboratorBannerColorChange = (collaboratorId: string, color: string) => {
		collaboratorProfileData[collaboratorId].bannerColor = color || DEFAULT_BANNER_COLOR;
	};

	const handleCollaboratorTriggerAvatarFile = (collaboratorId: string) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				handleCollaboratorAvatarUpload(collaboratorId, file);
			}
		};
		input.click();
	};

	const handleCollaboratorAvatarUpload = async (collaboratorId: string, file: File) => {
		collaboratorAvatarUploading[collaboratorId] = true;
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				const newAvatarUrl = result.url;
				collaboratorProfileData[collaboratorId].avatar = newAvatarUrl;

				const saveResponse = await fetch('/api/profile/update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ avatar: newAvatarUrl })
				});

				if (saveResponse.ok) {
					// Update the collaborator in the profiles array
					const collaboratorIndex = collaboratorProfiles.findIndex(
						(c: any) => c.id === collaboratorId
					);
					if (collaboratorIndex !== -1) {
						collaboratorProfiles[collaboratorIndex] = {
							...collaboratorProfiles[collaboratorIndex],
							avatar: newAvatarUrl
						};
					}
				}
			}
		} catch (error) {
		} finally {
			collaboratorAvatarUploading[collaboratorId] = false;
		}
	};

	const handleCollaboratorAvatarRemove = async (collaboratorId: string) => {
		if (!collaboratorProfileData[collaboratorId].avatar) return;

		collaboratorAvatarUploading[collaboratorId] = true;
		try {
			collaboratorProfileData[collaboratorId].avatar = '';

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: '' })
			});

			if (response.ok) {
				// Update the collaborator in the profiles array
				const collaboratorIndex = collaboratorProfiles.findIndex(
					(c: any) => c.id === collaboratorId
				);
				if (collaboratorIndex !== -1) {
					collaboratorProfiles[collaboratorIndex] = {
						...collaboratorProfiles[collaboratorIndex],
						avatar: ''
					};
				}
			}
		} catch (error) {
		} finally {
			collaboratorAvatarUploading[collaboratorId] = false;
		}
	};

	const handleCollaboratorInterestAdd = (collaboratorId: string, interest: string) => {
		if (
			interest.trim() &&
			!collaboratorProfileData[collaboratorId].interests.includes(interest.trim())
		) {
			collaboratorProfileData[collaboratorId].interests = [
				...collaboratorProfileData[collaboratorId].interests,
				interest.trim()
			];
		}
	};

	const handleCollaboratorInterestRemove = (collaboratorId: string, interest: string) => {
		collaboratorProfileData[collaboratorId].interests = collaboratorProfileData[
			collaboratorId
		].interests.filter((i) => i !== interest);
	};

	let currentLocale = $state(getCurrentLocale());

	let profileUser = $state(data.profileUser);
	let userProfileData = $state(data.userProfileData);

	$effect(() => {
		if (data.profileUser) {
			profileUser = data.profileUser;
		}
		if (data.userProfileData) {
			userProfileData = data.userProfileData;
		}
	});

	const currentUser = data.currentUser;
	const currentUserId = currentUser?.id;

	const profileNicknameSlug = $derived(
		(() => {
			const value = profileUser?.nickname || profileUser?.id || 'user';
			return (
				value
					.toString()
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9-_]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '') || 'user'
			);
		})()
	);

	const profileUserId = $derived(profileUser?._id || profileUser?.id);
	const serverArticles = data.articles ?? [];
	let stats = data.stats;
	let isOwnProfile = data.isOwnProfile;
	let isFollowingMe = data.isFollowingMe ?? false;
	let followersList = $state(data.followersList ?? []);
	let followingList = $state(data.followingList ?? []);

	// Track URL changes and reload when slug changes
	onMount(() => {
		let previousSlug = $page.params.slug;

		// Load follow and block status only on client side
		loadFollowStatus(profileUserId);
		loadBlockStatus(profileUserId);

		// Handle scroll-to-line hash links (e.g., #line-40)
		const handleHashScroll = (retryCount = 0) => {
			const hash = window.location.hash;
			if (hash && hash.startsWith('#line-')) {
				const lineNum = parseInt(hash.replace('#line-', ''), 10);
				if (!isNaN(lineNum) && lineNum > 0) {
					// Find the content element - try multiple selectors for robustness
					const contentEl = document.querySelector('.prose') || 
					                 document.querySelector('[class*="ProseMirror"]') ||
					                 document.querySelector('.article-content');
					if (contentEl) {
						// Get all block-level elements (paragraphs, headings, etc.)
						const blocks = contentEl.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div[class*="ProseMirror"] > *');
						if (blocks.length >= lineNum) {
							const targetBlock = blocks[lineNum - 1] as HTMLElement;
							if (targetBlock) {
								targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
								// Add temporary highlight
								targetBlock.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30', 'transition-colors', 'duration-1000');
								setTimeout(() => {
									targetBlock.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30', 'transition-colors', 'duration-1000');
								}, 2000);
							}
							// Clear hash from URL using SvelteKit's replaceState
							const url = new URL(window.location.href);
							url.hash = '';
							replaceState(url, {});
						} else if (retryCount < 5) {
							// Content not ready yet, retry with increasing delay
							setTimeout(() => handleHashScroll(retryCount + 1), 100 * (retryCount + 1));
						}
					} else if (retryCount < 5) {
						// Content element not ready yet, retry with increasing delay
						setTimeout(() => handleHashScroll(retryCount + 1), 100 * (retryCount + 1));
					}
				}
			}
		};

		// Handle initial hash on page load with delay to ensure content is rendered
		setTimeout(() => handleHashScroll(0), 300);

		// Listen for hash changes (click on scroll-to-line links)
		const hashChangeHandler = () => handleHashScroll();
		window.addEventListener('hashchange', hashChangeHandler);

		afterNavigate(({ to }) => {
			const newSlug = to?.params?.slug;
			if (newSlug && newSlug !== previousSlug) {
				previousSlug = newSlug;
				window.location.href = to.url.href;
			} else {
				// Handle hash scroll for same-page navigation with retry
				setTimeout(() => handleHashScroll(0), 200);
			}
		});

		return () => {
			window.removeEventListener('hashchange', hashChangeHandler);
		};
	});

	let viewerBlocksProfile = $state(data.viewerBlocksProfile ?? false);

	// Reactive articles based on current locale
	const articles = $derived(
		serverArticles.map((article) => {
			const translations = article.translations || {};
			const translationKeys = Object.keys(translations);
			const currentLocale = getCurrentLocale();
			const fallbackKey = translationKeys[0] || article.language || article.defaultLanguage || 'tr';
			const displayLanguage =
				currentLocale && translations[currentLocale] ? currentLocale : fallbackKey;

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

	const availableLanguages = Array.from(
		new Set(serverArticles.flatMap((article) => article.availableLanguages || []))
	);
	const categoryOptions = Array.from(
		new Set(serverArticles.map((article) => article.category).filter(Boolean))
	);
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

	let isEditing = $state(false);
	let isSaving = $state(false);

	const DEFAULT_BANNER_COLOR = '#fac800';

	let avatarUploading = $state(false);
	const avatarInputId = `profile-avatar-input-${Math.random().toString(36).substr(2, 9)}`;

	let bannerUploading = $state(false);
	const bannerInputId = `profile-banner-input-${Math.random().toString(36).substr(2, 9)}`;

	let isFollowing = $state(false);
	let isBlocked = $state(viewerBlocksProfile);
	let isBlockedChanging = $state(false);
	let followersCount = $state(
		Array.isArray(profileUser?.followers)
			? profileUser.followers.length
			: (profileUser?.followersCount ?? 0)
	);
	let followingCount = $state(
		Array.isArray(profileUser?.following)
			? profileUser.following.length
			: (profileUser?.followingCount ?? 0)
	);

	const triggerAvatarFileDialog = () => {
		if (typeof document === 'undefined') return;
		const input = document.getElementById(avatarInputId) as HTMLInputElement | null;
		input?.click();
	};

	const handleAvatarUpload = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Capture previous value before any async work
		const previous = profileData.avatar;

		const maxBytes = 4 * 1024 * 1024;
		if (file.size > maxBytes) {
			alert(t('profile.avatarSizeError'));
			input.value = '';
			return;
		}

		if (!file.type.startsWith('image/')) {
			alert(t('profile.avatarTypeError'));
			input.value = '';
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
			profileData.avatar = previous;
			profileUser = { ...profileUser, avatar: previous };
			alert(t('profile.avatarUploadError'));
		} finally {
			avatarUploading = false;
			input.value = '';
		}
	};

	const handleAvatarRemove = async () => {
		if (!profileData.avatar) return;

		const previous = profileData.avatar;
		profileData.avatar = '';

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
			profileData.avatar = previous;
			profileUser = { ...profileUser, avatar: previous };
		}
	};

	let profileData = $state({
		name: profileUser?.name || '',
		surname: profileUser?.surname || '',
		nickname: profileUser?.nickname || '',
		bio: profileUser?.bio || '',
		location: profileUser?.preferences?.location || '',
		website: profileUser?.preferences?.website || '',
		interests: profileUser?.preferences?.interests || [],
		avatar: profileUser?.avatar || '',
		bannerColor:
			profileUser?.bannerColor || profileUser?.preferences?.bannerColor || DEFAULT_BANNER_COLOR,
		bannerImage: profileUser?.bannerImage || profileUser?.preferences?.bannerImage || '',
		socialLinks: profileUser?.preferences?.socialLinks || {
			twitter: '',
			github: '',
			linkedin: ''
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
			const dataToSave = formData || profileData;
			const response = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dataToSave)
			});

			if (response.ok) {
				isEditing = false;
				profileUser = { ...profileUser, ...dataToSave };
			} else {
			}
		} catch (error) {
		} finally {
			isSaving = false;
		}
	};

	const handleCancelEdit = () => {
		profileData = {
			name: profileUser?.name || '',
			surname: profileUser?.surname || '',
			nickname: profileUser?.nickname || '',
			bio: profileUser?.bio || '',
			location: profileUser?.location || '',
			website: profileUser?.website || '',
			interests: profileUser?.interests || [],
			avatar: profileUser?.avatar || '',
			bannerColor: profileUser?.bannerColor || DEFAULT_BANNER_COLOR,
			bannerImage: profileUser?.bannerImage || '',
			socialLinks: profileUser?.socialLinks || {
				twitter: '',
				github: '',
				linkedin: ''
			}
		};
		isEditing = false;
	};

	const handleBannerColorChange = (color: string) => {
		profileData.bannerColor = color || DEFAULT_BANNER_COLOR;
	};

	const triggerBannerFileDialog = () => {
		if (typeof document === 'undefined') return;
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
			input.value = '';
			return;
		}

		if (!file.type.startsWith('image/')) {
			alert(t('profile.bannerTypeError') ?? 'Sadece görsel yükleyebilirsiniz.');
			input.value = '';
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
			profileData.bannerImage = previousBanner;
			profileUser = { ...profileUser, bannerImage: previousBanner };
			alert(t('profile.bannerUploadError') ?? 'Banner yüklenirken bir sorun oluştu.');
		} finally {
			bannerUploading = false;
			input.value = '';
		}
	};

	const handleBannerRemove = async () => {
		if (!profileData.bannerImage) return;

		const previous = profileData.bannerImage;
		profileData.bannerImage = '';

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
		profileData.interests = profileData.interests.filter((i: string) => i !== interest);
	};

	let newInterest = $state('');

	const navigateToArticle = (slug: string) => {
		goto(`/article/${slug}`);
	};

	// Follow/block handlers
	const loadFollowStatus = async (targetId?: string | null) => {
		const targetUserId = targetId ?? profileUserId;
		if (!targetUserId || isOwnProfile || !browser) return;
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
			followersCount =
				typeof data.followersCount === 'number' ? data.followersCount : followersCount;
			followingCount =
				typeof data.followingCount === 'number' ? data.followingCount : followingCount;
		} catch (error) {}
	};

	const loadBlockStatus = async (targetId?: string | null) => {
		const targetUserId = targetId ?? profileUserId;
		if (!targetUserId || isOwnProfile || !browser) return;

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
			if (!isBlockedChanging) {
				isBlocked = !!data.blocked;
			}
		} catch (error) {}
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
		} catch (error) {}
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
		} catch (error) {}
	};

	const handleBlockUser = async () => {
		const targetUserId = profileUserId;
		if (!targetUserId) return;

		isBlocked = true;
		isBlockedChanging = true;

		try {
			const response = await fetch(`/api/users/${targetUserId}/block`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				isBlocked = false;
				isBlockedChanging = false;
				return;
			}

			viewerBlocksProfile = true;
			await loadBlockStatus(targetUserId);
			await loadFollowStatus(targetUserId);
		} catch (error) {
			isBlocked = false;
		} finally {
			isBlockedChanging = false;
		}
	};

	const handleUnblockUser = async () => {
		const targetUserId = profileUserId;
		if (!targetUserId) return;

		isBlocked = false;
		isBlockedChanging = true;

		try {
			const response = await fetch(`/api/users/${targetUserId}/block`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorMessage = await response.text().catch(() => response.statusText);
				isBlocked = true;
				isBlockedChanging = false;
				return;
			}

			viewerBlocksProfile = false;
			await loadBlockStatus(targetUserId);
		} catch (error) {
			isBlocked = true;
		} finally {
			isBlockedChanging = false;
		}
	};

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
		hidden?: boolean;
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
			surname?: string;
			nickname?: string;
			avatar?: string;
		};
		authorId?: string;
		category: string;
		subcategory?: string;
		tags: string[];
		publishedAt: string;
		createdAt?: string;
		readTime?: number;
		featured?: boolean;
		coverImage?: string;
		thumbnail?: string;
		status?: string;
		availableTranslations?: Record<string, { slug: string }>;
		availableLanguages?: string[];
	}

	const article = $derived({
		...data.article,
		translations: data.article?.translations || {}
	} as Article);

	// Separate $state for article.hidden to allow mutation
	let articleHidden = $state(data.article?.hidden ?? false);

	// Check if current locale is not available in article languages
	const currentLocaleNotAvailable = $derived(
		!article.availableLanguages?.includes(currentLocale)
	);

	$effect(() => {
		currentLocale = getCurrentLocale();
	});

	$effect(() => {
		if (typeof window !== 'undefined' && data.article?._id) {
			// First try to get reaction from server (source of truth)
			fetch(`/api/articles/${data.article._id}/react`)
				.then(res => res.json())
				.then(json => {
					if (json.reaction && ['like', 'dislike'].includes(json.reaction)) {
						reaction = json.reaction;
						// Sync localStorage with server state
						localStorage.setItem(`article_reaction_${data.article._id}`, json.reaction);
					} else {
						reaction = null;
						localStorage.removeItem(`article_reaction_${data.article._id}`);
					}
				})
				.catch(() => {
					// Fallback to localStorage if server request fails
					const savedReaction = localStorage.getItem(`article_reaction_${data.article._id}`);
					if (savedReaction && ['like', 'dislike'].includes(savedReaction)) {
						reaction = savedReaction as 'like' | 'dislike';
					}
				});
		}
	});

	let comments = $state<any[]>([]);
	const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
	let newComment = $state<any>(emptyDoc);
	let replyingTo = $state<string | null>(null);
	let replyContent = $state<any>(emptyDoc);
	let loadingComments = $state(false);
	let commentEditor = $state<Editor | null>(null);
	let replyEditor = $state<Editor | null>(null);
	let userReactions = $state<Record<string, 'like' | 'dislike' | null>>({});

	let replyEditors = $state<Record<string, Editor | null>>({});
	let replyContents = $state<Record<string, any>>({});

	let editingCommentId = $state<string | null>(null);
	let editingContent = $state<any>(null);
	let editingEditor = $state<Editor | null>(null);

	let expandedComments = $state<Set<string>>(new Set());
	const DEFAULT_VISIBLE_LEVELS = 1;

	let showDeleteDialog = $state(false);
	let showHideDialog = $state(false);
	let dialogType = $state<'article' | 'comment'>('article');
	let selectedArticle = $state<any>(null);
	let selectedComment = $state<any>(null);

	// Dialog for nested comments
	let showNestedDialog = $state(false);
	let dialogComments = $state<any[]>([]);
	let dialogParentComment = $state<any>(null);
	let dialogLevel = $state(0);
	let dialogParentId = $state<string | null>(null);
	const DIALOG_VISIBLE_LEVELS = 2;

	// Dialog history for back navigation
	let dialogHistory = $state<
		Array<{
			comments: any[];
			parentComment: any;
			level: number;
			parentId: string | null;
		}>
	>([]);

	// Loading states for spam protection
	let postingComment = $state(false);
	let postingReply = $state<Record<string, boolean>>({});
	let lastCommentTime = $state(0);
	let commentCooldown = $state(0);

	async function toggleReaction(type: 'like' | 'dislike') {
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

			reaction = json.reaction ?? newReaction;

			if (typeof window !== 'undefined') {
				if (reaction) {
					localStorage.setItem(`article_reaction_${data.article._id}`, reaction);
				} else {
					localStorage.removeItem(`article_reaction_${data.article._id}`);
				}
			}

			if (json.stats) {
				likesCount = Number(json.stats.likes) || 0;
				dislikesCount = Number(json.stats.dislikes) || 0;
			}
		} catch (e) {}
	}

	if (!article) {
	}

	const getAuthorIdentifier = (author: any) => {
		return author?.nickname || author?.id || 'user';
	};

	const getAuthorDisplayName = (author: any) => {
		if (author?.name && author?.surname) {
			return `${author.name} ${author.surname}`.trim();
		}
		return author?.name || author?.nickname || 'Unknown User';
	};

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

	function isCollaborator(): boolean {
		const uid = $page.data.user?.id;
		if (!uid || !collaborators || collaborators.length === 0) return false;
		return collaborators.some((c: any) => c.id === uid);
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

	function onTranslateArticle() {
		if (!article?._id) {
			return;
		}

		const params = new URLSearchParams({
			articleId: article._id,
			mode: 'edit',
			translator: 'true'
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

	function handleCommentReported() {
		// Refresh dialog if it's open and the reported comment is in the current dialog
		if (showNestedDialog && selectedComment) {
			const reportedCommentInDialog = findComment(dialogComments, selectedComment.id);
			if (reportedCommentInDialog) {
				// Comment is in current dialog, refresh dialog comments
				const parentComment = findComment(comments, dialogParentId);
				if (parentComment) {
					dialogComments = parentComment.replies || [];
				}
			}
		}
	}

	function reportComment(id: string) {
		showReportDrawer = true;
		// First try to find in main comments
		let comment = comments.find((c: any) => c.id === id);

		// If not found and dialog is open, look in dialog comments
		if (!comment && showNestedDialog) {
			comment = findComment(dialogComments, id);
		}

		selectedComment = comment;
	}

	function editComment(id: string) {
		// First try to find in main comments
		let comment = findComment(comments, id);

		// If not found and dialog is open, look in dialog comments
		if (!comment && showNestedDialog) {
			comment = findComment(dialogComments, id);
		}

		if (comment) {
			editingCommentId = id;
			editingContent = comment.content;
		}
	}

	function deleteComment(id: string) {
		// First try to find in main comments
		let comment = comments.find((c: any) => c.id === id);

		// If not found and dialog is open, look in dialog comments
		if (!comment && showNestedDialog) {
			comment = findComment(dialogComments, id);
		}

		if (comment) {
			selectedComment = comment;
			dialogType = 'comment';
			showDeleteDialog = true;
		}
	}

	function hideComment(id: string) {
		// First try to find in main comments
		let comment = comments.find((c: any) => c.id === id);

		// If not found and dialog is open, look in dialog comments
		if (!comment && showNestedDialog) {
			comment = findComment(dialogComments, id);
		}

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
						return n.content.map((c: any) => (c.type === 'text' ? (c.text ?? '') : '')).join('');
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

	function onEditingEditorUpdate() {
		if (editingEditor) {
			editingContent = editingEditor.getJSON();
		}
	}

	async function saveEditedComment() {
		if (!editingCommentId || !editingContent) return;

		try {
			const res = await fetch(`/api/comments/${editingCommentId}/edit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: editingContent })
			});

			if (res.ok) {
				showToast(t('CommentUpdated'), 'success');
				await loadComments();

				// Refresh dialog if it's open and the edited comment is in the current dialog
				if (showNestedDialog) {
					const editedCommentInDialog = findComment(dialogComments, editingCommentId);
					if (editedCommentInDialog) {
						// Comment is in current dialog, refresh dialog comments
						const parentComment = findComment(comments, dialogParentId);
						if (parentComment) {
							dialogComments = parentComment.replies || [];
						}
					}
				}

				cancelEditComment();
			} else if (res.status === 401) {
				showToast(t('LoginRequired'), 'error');
			} else if (res.status === 403) {
				showToast(t('PermissionDenied'), 'error');
			} else {
				showToast(t('UpdateFailed'), 'error');
			}
		} catch (e) {
			showToast(t('UpdateFailed'), 'error');
		}
	}

	function cancelEditComment() {
		editingCommentId = null;
		editingContent = null;
		editingEditor = null;
	}

	function toggleCommentExpanded(commentId: string) {
		const newExpanded = new Set(expandedComments);
		if (newExpanded.has(commentId)) {
			newExpanded.delete(commentId);
		} else {
			newExpanded.add(commentId);
		}
		expandedComments = newExpanded;
	}

	function shouldShowComment(commentId: string, level: number): boolean {
		if (level <= DEFAULT_VISIBLE_LEVELS) {
			return true;
		}
		return false;
	}

	function onReplyEditorUpdate(commentId: string) {
		const editor = replyEditors[commentId];
		if (editor) {
			replyContents[commentId] = editor.getJSON();
		}
	}

	async function postComment() {
		if (!$page.data.user) {
			showToast(t('LoginRequiredForComments'), 'error');
			return;
		}

		if (isCommentEmpty(newComment) || !article) return;

		// Check cooldown
		const now = Date.now();
		if (now - lastCommentTime < commentCooldown) {
			return;
		}

		postingComment = true;
		try {
			const res = await fetch(`/api/articles/${article._id}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: newComment,
					timestamp: now
				})
			});

			const data = await res.json();

			if (res.ok) {
				showToast(t('CommentPosted'), 'success');
				await loadComments();
				newComment = emptyDoc;
				if (commentEditor) commentEditor.commands.setContent('');
				lastCommentTime = now;
				commentCooldown = 60000; // 1 minute cooldown
			} else if (res.status === 429) {
				showToast(data.error || 'Çok hızlı yorum yapıyorsunuz. Lütfen bekleyin.', 'warning');
				commentCooldown = 120000; // 2 minutes cooldown
			} else if (res.status === 400) {
				if (data.reasons && data.reasons.length > 0) {
					showToast(`Spam tespit edildi: ${data.reasons.join(', ')}`, 'error');
				} else {
					showToast(data.error || 'Yorum gönderilemedi', 'error');
				}
			} else if (res.status === 401) {
				persistToast(t('LoginRequiredForComments'), 'error');
			} else {
				showToast('Yorum gönderilemedi', 'error');
			}
		} catch (e) {
			showToast('Bağlantı hatası', 'error');
		} finally {
			postingComment = false;
		}
	}

	async function postReply(parentId: string) {
		const content = replyContents[parentId];
		if (isCommentEmpty(content) || !article) return;

		// Check cooldown
		const now = Date.now();
		if (now - lastCommentTime < commentCooldown) {
			return;
		}

		postingReply[parentId] = true;
		try {
			const res = await fetch(`/api/articles/${article._id}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content,
					parentId,
					timestamp: now
				})
			});

			const data = await res.json();

			if (res.ok) {
				showToast(t('ReplyPosted'), 'success');
				await loadComments();

				// Refresh dialog if it's open and reply is related to current dialog
				if (showNestedDialog) {
					if (dialogParentId === parentId) {
						// Reply to dialog parent comment
						const parentComment = findComment(comments, parentId);
						if (parentComment) {
							dialogComments = parentComment.replies || [];
						}
					} else if (dialogParentComment && findComment([dialogParentComment], parentId)) {
						// Reply to a comment within current dialog
						const updatedParentComment = findComment(comments, dialogParentId);
						if (updatedParentComment) {
							dialogComments = updatedParentComment.replies || [];
						}
					}
				}

				replyContents[parentId] = emptyDoc;
				const editor = replyEditors[parentId];
				if (editor) editor.commands.setContent('');
				delete replyEditors[parentId];
				delete replyContents[parentId];
				replyingTo = null;
				lastCommentTime = now;
				commentCooldown = 60000; // 1 minute cooldown
			} else if (res.status === 429) {
				showToast(data.error || 'Çok hızlı yorum yapıyorsunuz. Lütfen bekleyin.', 'warning');
				commentCooldown = 120000; // 2 minutes cooldown
			} else if (res.status === 400) {
				if (data.reasons && data.reasons.length > 0) {
					showToast(`Spam tespit edildi: ${data.reasons.join(', ')}`, 'error');
				} else {
					showToast(data.error || 'Yanıt gönderilemedi', 'error');
				}
			} else {
				showToast('Yanıt gönderilemedi', 'error');
			}
		} catch (e) {
			showToast('Bağlantı hatası', 'error');
		} finally {
			postingReply[parentId] = false;
		}
	}

	async function toggleCommentReaction(
		commentId: string,
		type: 'like' | 'dislike',
		isReply: boolean,
		parentId?: string
	) {
		if (!$page.data.user) {
			showToast(t('LoginRequiredForReactions'), 'error');
			return;
		}

		const previousReaction = userReactions[commentId];
		const comment = findComment(comments, commentId);

		if (previousReaction === type) {
			userReactions[commentId] = null;
			if (comment) {
				if (type === 'like') comment.likes = Math.max(0, (comment.likes || 0) - 1);
				else if (type === 'dislike') comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
			}
		} else {
			userReactions[commentId] = type;

			if (comment) {
				if (previousReaction === 'like') comment.likes = Math.max(0, (comment.likes || 0) - 1);
				else if (previousReaction === 'dislike')
					comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);

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
				if (res.status === 401) {
					showToast(t('LoginRequiredForReactions'), 'error');
				}
				await loadComments();
			}
		} catch (e) {
			await loadComments();
		}
	}

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
			const shouldHide = !articleHidden;
			await hideArticle(selectedArticle._id, shouldHide);
		} else if (dialogType === 'comment' && selectedComment) {
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

	function openNestedDialog(comment: any, level: number, parentId: string | null = null) {
		// Save current state to history if dialog is already open
		if (showNestedDialog) {
			dialogHistory = [
				...dialogHistory,
				{
					comments: dialogComments,
					parentComment: dialogParentComment,
					level: dialogLevel,
					parentId: dialogParentId
				}
			];
		}
		dialogParentComment = comment;
		dialogComments = comment.replies || [];
		dialogLevel = level;
		dialogParentId = parentId;
		showNestedDialog = true;
	}

	function goBackInDialog() {
		if (dialogHistory.length > 0) {
			const previousState = dialogHistory[dialogHistory.length - 1];
			dialogComments = previousState.comments;
			dialogParentComment = previousState.parentComment;
			dialogLevel = previousState.level;
			dialogParentId = previousState.parentId;
			dialogHistory = dialogHistory.slice(0, -1);
		}
	}

	function closeNestedDialog() {
		showNestedDialog = false;
		dialogComments = [];
		dialogParentComment = null;
		dialogLevel = 0;
		dialogParentId = null;
		dialogHistory = []; // Clear history when closing dialog
	}

	async function deleteArticle(articleId: string) {
		try {
			const res = await fetch(`/api/articles/${articleId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.ok) {
				showToast(t('ArticleDeleted'), 'success');
				window.location.href = '/articles';
			} else if (res.status === 401) {
				showToast(t('LoginRequired'), 'error');
			} else if (res.status === 403) {
				showToast(t('PermissionDenied'), 'error');
			} else {
				showToast(t('DeleteFailed'), 'error');
			}
		} catch (e) {
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
				showToast(t('ArticleHidden'), 'success');
				// Update the separate $state instead of the $derived article
				articleHidden = shouldHide;
			} else if (res.status === 401) {
				showToast(t('LoginRequired'), 'error');
			} else if (res.status === 403) {
				showToast(t('PermissionDenied'), 'error');
			} else {
				showToast(t('HideFailed'), 'error');
			}
		} catch (e) {
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
				showToast(t('articles.comments.commentDeleted'), 'success');
				await loadComments();

				// Refresh dialog if it's open and the deleted comment was in the current dialog
				if (showNestedDialog) {
					const deletedCommentInDialog = findComment(dialogComments, commentId);
					if (deletedCommentInDialog) {
						// Comment was in current dialog, refresh dialog comments
						const parentComment = findComment(comments, dialogParentId);
						if (parentComment) {
							dialogComments = parentComment.replies || [];
						}
					}
				}
			} else if (res.status === 401) {
				showToast(t('articles.comments.loginRequired'), 'error');
			} else if (res.status === 403) {
				showToast(t('articles.comments.permissionDenied'), 'error');
			} else {
				showToast(t('articles.comments.deleteFailed'), 'error');
			}
		} catch (e) {
			showToast(t('articles.comments.deleteFailed'), 'error');
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
				showToast(t('articles.comments.commentHidden'), 'success');
				await loadComments();

				// Refresh dialog if it's open and the hidden comment is in the current dialog
				if (showNestedDialog) {
					const hiddenCommentInDialog = findComment(dialogComments, commentId);
					if (hiddenCommentInDialog) {
						// Comment is in current dialog, refresh dialog comments
						const parentComment = findComment(comments, dialogParentId);
						if (parentComment) {
							dialogComments = parentComment.replies || [];
						}
					}
				}
			} else if (res.status === 401) {
				showToast(t('articles.comments.loginRequired'), 'error');
			} else if (res.status === 403) {
				showToast(t('articles.comments.permissionDenied'), 'error');
			} else {
				showToast(t('articles.comments.hideFailed'), 'error');
			}
		} catch (e) {
			showToast(t('articles.comments.hideFailed'), 'error');
		}
	}

	function formatTimeAgo(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return t('articles.comments.timeAgo.justNow');
		if (seconds < 3600)
			return t('articles.comments.timeAgo.minutes', { count: Math.floor(seconds / 60) });
		if (seconds < 86400)
			return t('articles.comments.timeAgo.hours', { count: Math.floor(seconds / 3600) });
		if (seconds < 604800)
			return t('articles.comments.timeAgo.days', { count: Math.floor(seconds / 86400) });
		return date.toLocaleDateString(currentLocale === 'tr' ? 'tr-TR' : 'en-US');
	}

	const formatNumber = (num: number): string => {
		if (num < 1000) return num.toString();
		if (num < 10000) return (num / 1000).toFixed(1) + 'k';
		if (num < 100000) return (num / 1000).toFixed(0) + 'k';
		if (num < 1000000) return (num / 1000).toFixed(0) + 'k';
		if (num < 10000000) return (num / 1000000).toFixed(1) + 'm';
		return (num / 1000000).toFixed(0) + 'm';
	};

	$effect(() => {
		if (article) {
			loadComments();
		}
	});

	// Share functionality
	let showShareMenu = $state(false);
	let shareMenuRef = $state<HTMLDivElement | null>(null);

	async function handleShare() {
		const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
		const shareTitle = article?.title || 'LAF Article';

		// Try native Web Share API first
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({
					title: shareTitle,
					url: shareUrl
				});
				showToast(t('articles.share.title'), 'success');
				return;
			} catch (err: any) {
				if (err.name !== 'AbortError') {
				}
			}
		}

		// Fallback: copy to clipboard
		try {
			await navigator.clipboard.writeText(shareUrl);
			showToast(t('articles.share.linkCopied'), 'success');
		} catch (err) {
			showToast(t('articles.share.shareError'), 'error');
		}
	}

	// Close share menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (shareMenuRef && !shareMenuRef.contains(event.target as Node)) {
			showShareMenu = false;
		}
	}
</script>

<svelte:head>
	{#if article}
		{@const meta = (() => {
			const siteName = t('seo.home.title') || 'LAF - Libertarian Anarchist Foundation';
			const siteUrl = 'https://laf.international';
			const url =
				typeof window !== 'undefined' ? window.location.href : `${siteUrl}/article/${article.slug}`;
			const ogImage = article.thumbnail || `${siteUrl}/og-default.png`;
			const authorName =
				article.author?.name && article.author?.surname
					? `${article.author.name} ${article.author.surname}`
					: article.author?.nickname || 'LAF';

			return {
				title: article.title,
				description:
					article.excerpt ||
					(typeof article.content === 'string' ? article.content.substring(0, 160) : '') ||
					'',
				canonical: url,
				og: {
					title: article.title,
					description: article.excerpt || '',
					type: 'article',
					url: url,
					site_name: siteName,
					image: ogImage,
					image_alt: article.title,
					article_published_time: article.publishedAt,
					article_modified_time: article.updatedAt,
					article_author: authorName,
					article_section: article.category,
					article_tag: article.tags?.join(', ')
				},
				twitter: {
					card: 'summary_large_image',
					site: '@lafoundation',
					title: article.title,
					description: article.excerpt || '',
					image: ogImage,
					image_alt: article.title
				},
				robots: article.status === 'published' ? 'index, follow' : 'noindex, nofollow',
				structuredData: {
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: article.title,
					description: article.excerpt || '',
					url: url,
					image: ogImage,
					author: {
						'@type': 'Person',
						name: authorName,
						url: article.author?.nickname ? `${siteUrl}/${article.author.nickname}` : undefined
					},
					publisher: {
						'@type': 'Organization',
						name: siteName,
						logo: {
							'@type': 'ImageObject',
							url: `${siteUrl}/logo.png`
						}
					},
					datePublished: article.publishedAt,
					dateModified: article.updatedAt || article.publishedAt,
					keywords: article.tags?.join(', ') || '',
					articleSection: article.category,
					inLanguage: article.language || 'tr'
				},
				breadcrumbs: {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					itemListElement: [
						{
							'@type': 'ListItem',
							position: 1,
							name: t('seo.homeTab'),
							item: siteUrl
						},
						{
							'@type': 'ListItem',
							position: 2,
							name: t('seo.articlesTab'),
							item: `${siteUrl}/articles`
						},
						{
							'@type': 'ListItem',
							position: 3,
							name: article.title,
							item: url
						}
					]
				}
			};
		})()}

		<title>{meta.title}</title>
		<meta name="description" content={meta.description} />
		<link rel="canonical" href={meta.canonical} />

		<!-- Open Graph -->
		<meta property="og:title" content={meta.og.title} />
		<meta property="og:description" content={meta.og.description} />
		<meta property="og:type" content={meta.og.type} />
		<meta property="og:url" content={meta.og.url} />
		<meta property="og:site_name" content={meta.og.site_name} />
		<meta property="og:image" content={meta.og.image} />
		<meta property="og:image:alt" content={meta.og.image_alt} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		{#if meta.og.article_published_time}
			<meta property="article:published_time" content={meta.og.article_published_time} />
		{/if}
		{#if meta.og.article_modified_time}
			<meta property="article:modified_time" content={meta.og.article_modified_time} />
		{/if}
		<meta property="article:author" content={meta.og.article_author} />
		<meta property="article:section" content={meta.og.article_section} />
		{#if meta.og.article_tag}
			<meta property="article:tag" content={meta.og.article_tag} />
		{/if}

		<!-- Twitter Cards -->
		<meta name="twitter:card" content={meta.twitter.card} />
		<meta name="twitter:site" content={meta.twitter.site} />
		<meta name="twitter:title" content={meta.twitter.title} />
		<meta name="twitter:description" content={meta.twitter.description} />
		<meta name="twitter:image" content={meta.twitter.image} />
		<meta name="twitter:image:alt" content={meta.twitter.image_alt} />

		<!-- Robots -->
		<meta name="robots" content={meta.robots} />

		<!-- Structured Data -->
		{@html `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`}
		{@html `<script type="application/ld+json">${JSON.stringify(meta.breadcrumbs)}</script>`}
	{:else}
		<title>{t('seo.notFoundTitle')}</title>
		<meta
			name="description"
			content={t('seo.notFoundDesc')}
		/>
		<meta name="robots" content="noindex, nofollow" />
	{/if}
</svelte:head>

<style>
	/* Re-enable browser scrollbars on article page */
	:global(::-webkit-scrollbar) {
		display: block;
		width: 8px;
		height: 8px;
	}
	:global(::-webkit-scrollbar-track) {
		background: transparent;
	}
	:global(::-webkit-scrollbar-thumb) {
		background: hsl(var(--border));
		border-radius: 4px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: hsl(var(--muted-foreground));
	}
	:global(html) {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--border)) transparent;
	}
</style>

<Navbar />
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	role="presentation"
	class="group relative h-fit w-full overflow-hidden rounded-xl bg-card"
>
	<main class="min-h-screen bg-background">
		{#if !article}
			<div class="container mx-auto px-4 py-12 text-center">
				<h1 class="text-2xl font-bold mb-4">{t('articles.noArticles')}</h1>
				<p class="text-muted-foreground mb-6">{t('articles.noArticlesDescription')}</p>
				<Button size="sm" href={l('/articles')}>{t('articles.allArticles')}</Button>
			</div>
		{:else}
			<article
				class="container mx-auto px-4 py-12 max-w-3xl"
				dir={getLanguageDirection(article.language)}
			>
				<div class="mb-6 flex flex-row gap-2 justify-between items-center">
					<Button variant="outline" size="xs" href={l('/articles')}>
						<ArrowLeftIcon triggers={{ hover: false }} animationState="loading" duration={2000} />
						{t('articles.backToArticles')}
					</Button>
					<div class="flex flex-row items-center gap-2">
						<Select.Root
							type="single"
							name="language"
							value={article.language}
							onValueChange={(val: string) => switchToLanguage(val)}
						>
							<Select.Trigger
								size="xs"
								class="text-secondary-foreground !bg-background/44 w-fit px-3 !text-xs font-bold h-8"
							>
								<div class="flex items-center gap-2">
									<Languages class="w-3.5 h-3.5" />
									{localeNames[article.language] || article.language.toUpperCase()}
								</div>
							</Select.Trigger>
							<Select.Content class="!bg-background/44 -bottom-2 !backdrop-blur-sm !text-xs font-bold">
								<Select.Group>
									<Select.Label class="text-secondary-foreground !text-xs">{t('articles.languages')}</Select.Label>
									{#each localeConfig.availableLocales as lang}
										{@const hasTranslation = lang === article.language || article.availableTranslations?.[lang]}
										{#if hasTranslation}
											<Select.Item
												class="text-secondary-foreground mt-1 !bg-background/44 !text-xs"
												value={lang}
											>
												{localeNames[lang] || lang.toUpperCase()}
											</Select.Item>
										{/if}
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

				</div>
				<Separator />

				<header class="my-5">
					<div class="mb-3 flex flex-col gap-3">
						<div class="flex flex-col gap-3">
							<div class="flex items-start justify-between gap-2">
								<h1 class="text-base sm:text-lg font-bold leading-tight">
									{article.title}
								</h1>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild>
										<Button variant="outline" class="relative h-8 w-8 p-0 shrink-0">
											<EllipsisIcon
												triggers={{ hover: false }}
												animationState="loading"
												duration={1400}
												loop={true}
											/>
											{#if currentLocaleNotAvailable}
												<div
													class="absolute -top-2 -right-2 p-1 rounded-full bg-primary flex items-center justify-center"
													title={t('translateArticleHint')}
												>
													<Languages  class="text-primary-foreground" />
												</div>
											{/if}
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-48">
										<DropdownMenu.Item
											onclick={() => (showReportDrawer = true)}
											class="text-destructive"
										>
											<BadgeAlertIcon
												triggers={{ hover: false }}
												animationState="loading"
												duration={3000}
												loop={true}
												class=" h-4 w-4"
											/>
											{t('articles.comments.report')}
										</DropdownMenu.Item>
										
										{#if data.canEdit}
											<DropdownMenu.Separator />
											<DropdownMenu.Item onclick={onDeleteArticle}>
												<BookMinusIcon
													triggers={{ hover: false }}
													animationState="loading"
													duration={3000}
													loop={true}
													class=" h-4 w-4"
												/>
												{t('articles.comments.delete')}
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={onEditArticle}>
												<NotebookPenIcon
													triggers={{ hover: false }}
													animationState="loading"
													duration={3000}
													loop={true}
													class=" h-4 w-4"
												/>
												{t('articles.comments.edit')}
											</DropdownMenu.Item>
											{#if articleHidden}
												<DropdownMenu.Item onclick={onShowArticle}>
													<Eye class=" h-4 w-4" />
													{t('articles.comments.show')}
												</DropdownMenu.Item>
											{:else}
												<DropdownMenu.Item onclick={onHideArticle}>
													<EyeOffIcon triggers={{ hover: false }} class=" h-4 w-4" />
													{t('articles.comments.hide')}
												</DropdownMenu.Item>
											{/if}
										{/if}
										{#if $page.data.user && !isArticleOwner() && !isCollaborator() && !article?.fullyTranslated}
											<DropdownMenu.Separator />
											<DropdownMenu.Item onclick={onTranslateArticle}>
												<Languages class="h-4 w-4" />
												{t('addTranslation')}
											</DropdownMenu.Item>
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								{#if article.status === 'pending'}
									<Badge variant="outline">{t('articles.status.pending')}</Badge>
								{:else if article.status === 'draft'}
									<Badge variant="outline">{t('articles.status.draft')}</Badge>
								{/if}
								{#if articleHidden}
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<EyeOff class="h-4 w-4 text-orange-600" />
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>{t('hidden')}</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								{/if}
								<Badge variant="default">            {t(`categories.${article.category}`)}
</Badge>
								{#if article.subcategory}
									<Badge variant="secondary">            {t(`categories.${article.subcategory}`)}
</Badge>
								{/if}
							</div>
						</div>
						{#if article.status === 'pending'}
							<div class="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/>
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
								/>
							</Lens>
						</div>
					{/if}

					{#if article.excerpt}
						<p class="text-base text-secondary-foreground mb-3">
							{article.excerpt}
						</p>
					{/if}

					<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
						<div class="flex items-center gap-2">
							<a
								href={l(`/${getAuthorIdentifier(article.author)}`)}
								class="flex items-center gap-2 hover:opacity-80 transition-opacity"
							>
								<div class="w-8 h-8 rounded-full flex items-center justify-center">
									<Avatar class="w-8 h-8">
										{#if article.author?.avatar}
											<AvatarImage
												src={article.author.avatar}
												alt={getAuthorDisplayName(article.author)}
												class="object-cover"
											/>
										{/if}
										<AvatarFallback class="text-xs">
											{(() => {
												const name = article.author?.name;
												const surname = article.author?.surname;
												const nickname = article.author?.nickname;

												if (name && surname) {
													return (name[0] + surname[0]).toUpperCase();
												} else if (name) {
													return name[0].toUpperCase();
												} else if (nickname) {
													return nickname[0].toUpperCase();
												}
												return 'U';
											})()}
										</AvatarFallback>
									</Avatar>
								</div>
								<span class="font-medium">
									{getAuthorDisplayName(article.author)}
								</span>
							</a>
							{#if collaborators.length > 0}
								<div class="flex items-center gap-1 text-xs">
									<Users class="w-3 h-3" />
									<span>+{collaborators.length} {t('articles.author')}</span>
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-1">
							<Calendar class="w-4 h-4" />
							<time>{formatDate(article.publishedAt || article.createdAt || '')}</time>
						</div>

						<div class="flex items-center gap-1">
							<Clock class="w-4 h-4" />
							<span>{calculateReadTime(article.content)} {t('articles.readTime')}</span>
						</div>
					</div>

					<div class="flex items-center gap-3 text-sm text-muted-foreground">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<div class="flex items-center gap-1">
										<Eye class="w-4 h-4" />
										<span>{formatNumber(article.stats?.views ?? 0)}</span>
									</div>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>{(article.stats?.views ?? 0).toLocaleString()} {t('articles.stats.view')}</p>
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
														>{formatNumber(likesCount)}</span
													>
												</Button>
											</div>
										</Motion>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>{likesCount.toLocaleString()} {t('articles.stats.like')}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>

							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Motion whileTap={{ scale: 0.95 }} let:motion>
											<div use:motion>
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
														>{formatNumber(dislikesCount)}</span
													>
												</Button>
											</div>
										</Motion>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>{dislikesCount.toLocaleString()} {t('articles.stats.dislike')}</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>

						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<div class="flex items-center gap-1">
										<MessageCircle class="w-4 h-4" />
										<span>{formatNumber(article.stats?.comments ?? 0)}</span>
									</div>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>
										{(article.stats?.comments ?? 0).toLocaleString()}
										{t('articles.stats.comment')}
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>

						<div class="relative" bind:this={shareMenuRef}>
							<Button variant="ghost" size="sm" class="ml-auto" onclick={handleShare}>
								<Share2 class="w-4 h-4" />
								{t('Share')}
							</Button>
						</div>
					</div>
				</header>

				<div class="mt-6 prose prose-ac:text-primary max-w-none text-base leading-7">
					{#if typeof article.content === 'string' && article.content.trim()}
						{@html article.content}
					{:else if article.content && (article.content.content?.length > 0 || article.content.type)}
						<div class="rounded-md">
							<EdraEditor content={article.content} editable={false} dir={getLanguageDirection(article.language)} />
						</div>
					{:else}
						<p class="text-muted-foreground italic">{t('articles.noContent')}</p>
					{/if}
				</div>

				{#if article.tags && article.tags.length > 0}
					<div class="my-8 pt-8">
						<h3 class="text-sm font-medium text-muted-foreground mb-3">{t('article.tags')}</h3>
						<div class="flex flex-wrap gap-2">
							{#each article.tags as tag}
								<Badge variant="outline">#{tag}</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</article>
			<div class="container mx-auto px-4 py-12 max-w-5xl">
				<Separator class="my-10" />

				{#if collaborators.length > 0}
					<div class="my-8 pt-8">
						<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
							<Users class="w-5 h-5" />
							{t('articles.authors')} ({1 + collaborators.length})
						</h3>
						<div class="space-y-8">
							<!-- Ana Yazar -->
							<div class="space-y-4">
								<!-- Ana Yazar ProfileCard -->
								{#if profileUser && (!profileUser.is_hidden || isOwnProfile || data.currentUser?.role === 'admin' || data.currentUser?.role === 'moderator')}
									<ProfileCard
										{profileData}
										{profileUser}
										{isOwnProfile}
										showProfileLink={true}
										{isEditing}
										{isSaving}
										{avatarUploading}
										{bannerUploading}
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
										{isFollowing}
										{isBlocked}
										{followersCount}
										{followingCount}
										{isFollowingMe}
										{followersList}
										{followingList}
										{currentUserId}
									/>
								{/if}
							</div>

							<!-- İşbirlikçiler -->
							{#each collaboratorProfiles as collaboratorProfile, index}
								{@const isCollaboratorCurrentUser = collaborators[index].id === currentUserId}
								{@const collaboratorId = collaborators[index].id}
								{#if !collaboratorProfile.is_hidden || isCollaboratorCurrentUser || data.currentUser?.role === 'admin' || data.currentUser?.role === 'moderator'}
									<div class="space-y-4">
										<!-- İşbirlikçi ProfileCard -->
										<ProfileCard
											profileData={getCollaboratorProfileData(collaboratorId)}
											profileUser={collaboratorProfile}
											isOwnProfile={isCollaboratorCurrentUser}
											showProfileLink={true}
											isEditing={isCollaboratorCurrentUser
												? collaboratorEditing[collaboratorId] || false
												: false}
											isSaving={isCollaboratorCurrentUser
												? collaboratorSaving[collaboratorId] || false
												: false}
											avatarUploading={isCollaboratorCurrentUser
												? collaboratorAvatarUploading[collaboratorId] || false
												: false}
											bannerUploading={isCollaboratorCurrentUser
												? collaboratorBannerUploading[collaboratorId] || false
												: false}
											onToggleEdit={isCollaboratorCurrentUser
												? () => startCollaboratorEditing(collaboratorId)
												: () => {}}
											onCancelEdit={isCollaboratorCurrentUser
												? () => handleCollaboratorCancelEdit(collaboratorId)
												: () => {}}
											onSaveProfile={isCollaboratorCurrentUser
												? () => handleCollaboratorSaveProfile(collaboratorId)
												: () => {}}
											onTriggerAvatarFile={isCollaboratorCurrentUser
												? () => handleCollaboratorTriggerAvatarFile(collaboratorId)
												: () => {}}
											onAvatarUpload={isCollaboratorCurrentUser
												? (file) => handleCollaboratorAvatarUpload(collaboratorId, file)
												: () => {}}
											onAvatarRemove={isCollaboratorCurrentUser
												? () => handleCollaboratorAvatarRemove(collaboratorId)
												: () => {}}
											onInterestAdd={isCollaboratorCurrentUser
												? (interest) => handleCollaboratorInterestAdd(collaboratorId, interest)
												: () => {}}
											onInterestRemove={isCollaboratorCurrentUser
												? (interest) => handleCollaboratorInterestRemove(collaboratorId, interest)
												: () => {}}
											onBannerColorChange={isCollaboratorCurrentUser
												? (color) => handleCollaboratorBannerColorChange(collaboratorId, color)
												: () => {}}
											onTriggerBannerFile={isCollaboratorCurrentUser
												? () => handleCollaboratorTriggerBannerFile(collaboratorId)
												: () => {}}
											onBannerUpload={isCollaboratorCurrentUser
												? (file) => handleCollaboratorBannerUpload(collaboratorId, file)
												: () => {}}
											onBannerRemove={isCollaboratorCurrentUser
												? () => handleCollaboratorBannerRemove(collaboratorId)
												: () => {}}
											onFollowUser={isCollaboratorCurrentUser
												? () => {}
												: () => handleCollaboratorFollow(collaboratorId)}
											onUnfollowUser={isCollaboratorCurrentUser
												? () => {}
												: () => handleCollaboratorUnfollow(collaboratorId)}
											onBlockUser={isCollaboratorCurrentUser
												? () => {}
												: () => handleCollaboratorBlock(collaboratorId)}
											onUnblockUser={isCollaboratorCurrentUser
												? () => {}
												: () => handleCollaboratorUnblock(collaboratorId)}
											isFollowing={isCollaboratorCurrentUser
												? false
												: collaboratorFollowing[collaboratorId] || false}
											isBlocked={isCollaboratorCurrentUser
												? false
												: collaboratorBlocked[collaboratorId] || false}
											followersCount={collaboratorProfile.followersCount || 0}
											followingCount={collaboratorProfile.followingCount || 0}
											isFollowingMe={false}
											followersList={collaboratorProfile.followersList || []}
											followingList={collaboratorProfile.followingList || []}
											{currentUserId}
										/>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if collaborators.length === 0 && profileUser && (!profileUser.is_hidden || isOwnProfile || data.currentUser?.role === 'admin' || data.currentUser?.role === 'moderator')}
					<ProfileCard
						{profileData}
						{profileUser}
						{isOwnProfile}
						showProfileLink={true}
						{isEditing}
						{isSaving}
						{avatarUploading}
						{bannerUploading}
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
						{isFollowing}
						{isBlocked}
						{followersCount}
						{followingCount}
						{isFollowingMe}
						{followersList}
						{followingList}
						{currentUserId}
					/>
				{/if}

				<Separator class="my-10" />

				<!-- Comments Section -->
				<div class="mt-12">
					<div class="flex flex-col items-center justify-center mb-6 gap-1">
						<MessageSquareIcon
							size={36}
							triggers={{ hover: false }}
							duration={2500}
							animationState="loading"
							class="text-primary"
						/>
						<h2 class="text-lg font-bold">{t('articles.comments.title')}</h2>
					</div>

					<!-- Comment Form -->
					<div class="mb-8">
						<div class="mb-3 border p-2 rounded-lg">
							{#if commentEditor}
								<EdraToolBar
									editor={commentEditor}
									disableFileUploads={true}
									class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
								/>
							{/if}
							<EdraEditor
								bind:editor={commentEditor}
								content={newComment}
								class="min-h-[140px]"
								onUpdate={onCommentEditorUpdate}
								placeholder={t('articles.comments.writeComment')}
								commentId={null}
								disableFileUploads={true}
							/>
						</div>
						<div class="flex justify-end mt-2">
							<Button size="xs" onclick={postComment} disabled={isCommentEmpty(newComment) || postingComment}>
								{#if postingComment}
									<BarSpinner class="text-primary" size={28} />
									{t('articles.comments.sending')}
								{:else}
									{t('articles.comments.postComment')}
								{/if}
							</Button>
						</div>
					</div>

					<!-- Comments List -->
					<div class="space-y-6">
						{#if loadingComments}
							<div class="text-center py-8">
								<p class="text-muted-foreground">{t('articles.comments.loading')}</p>
							</div>
						{:else if comments.length === 0}
							<div class="text-center py-8">
								<p class="text-muted-foreground">{t('articles.comments.empty')}</p>
							</div>
						{:else}
							{#each comments as comment (comment.id)}
								<div class="border rounded-lg p-4" id={`comment-${comment.id}`}>
									<div class="flex items-start gap-3">
										<div>
											<div class="flex items-center gap-2 mb-2">
												<a href={l(`/${getAuthorIdentifier(comment.author)}`)}>
													<div
														class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
													>
														<Avatar class="w-10 h-10">
															{#if comment.author?.avatar}
																<AvatarImage
																	src={comment.author.avatar}
																	alt={getAuthorDisplayName(comment.author)}
																	class="object-cover"
																/>
															{/if}
															<AvatarFallback class="text-sm">
																{(() => {
																	const name = comment.author?.name;
																	const surname = comment.author?.surname;
																	const nickname = comment.author?.nickname;

																	if (name && surname) {
																		return (name[0] + surname[0]).toUpperCase();
																	} else if (name) {
																		return name[0].toUpperCase();
																	} else if (nickname) {
																		return nickname[0].toUpperCase();
																	}
																	return 'U';
																})()}
															</AvatarFallback>
														</Avatar>
													</div>
												</a>
												<a href={l(`/${getAuthorIdentifier(comment.author)}`)}>
													<span class="font-medium">
														{comment.author?.name && comment.author?.surname
															? `${comment.author.name} ${comment.author.surname}`
															: comment.author?.nickname || t('articles.comments.anonymous')}
													</span>
												</a>
												<ScrollArea orientation="horizontal" class="max-w-3/4">
													<div class="flex flex-row gap-2 pb-1.5">
														<span class="text-xs truncate text-muted-foreground italic"
															>{formatTimeAgo(comment.createdAt)}</span
														>
														{#if comment.metadata?.edited}
															<span class="text-xs truncate text-muted-foreground italic"
																>({t('articles.comments.edited')})</span
															>
														{/if}
														{#if comment.hidden}
															<Tooltip.Provider>
																<Tooltip.Root>
																	<Tooltip.Trigger>
																		<EyeOff class="h-3 w-3 text-orange-600" />
																	</Tooltip.Trigger>
																	<Tooltip.Content>
																		<p>{t('hidden')}</p>
																	</Tooltip.Content>
																</Tooltip.Root>
															</Tooltip.Provider>
														{/if}
														{#if comment.reportCount > 0}
															<span class="text-xs truncate text-red-600 italic"
																>({t('articles.comments.reported')})</span
															>
														{/if}
													</div>
												</ScrollArea>
											</div>
											<Separator class="mb-4" />
											<div class="text-sm mb-2">
												{#if editingCommentId === comment.id}
													<div class="border p-2 rounded-lg">
														{#if editingEditor}
															<EdraToolBar
																editor={editingEditor}
																class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
															/>
														{/if}
														<EdraEditor
															bind:editor={editingEditor}
															content={editingContent || emptyDoc}
															class="min-h-[100px] rounded-lg h-min text-sm"
															onUpdate={onEditingEditorUpdate}
															placeholder={t('articles.comments.editPlaceholder')}
															commentId={editingCommentId}
														/>
														<div class="flex justify-end gap-2 mt-2">
															<Button variant="ghost" size="xs" onclick={cancelEditComment}>
																{t('articles.comments.cancel')}
															</Button>
															<Button
																size="sm"
																onclick={saveEditedComment}
																disabled={isCommentEmpty(editingContent)}
															>
																{t('articles.comments.save')}
															</Button>
														</div>
													</div>
												{:else}
													<EdraEditor content={comment.content} editable={false} />
												{/if}
											</div>
											<Separator />

											<div class="flex items-center gap-4">
												<Button
													variant={userReactions[comment.id] === 'like' ? 'default' : 'ghost'}
													size="sm"
													class={cn(
														'h-8 gap-1 transition-all duration-200 text-xs',
														userReactions[comment.id] === 'like' &&
															'bg-primary text-primary-foreground'
													)}
													onclick={() => toggleCommentReaction(comment.id, 'like', false)}
												>
													<ThumbsUp
														class={cn(
															'h-3 w-3 transition-all duration-200',
															userReactions[comment.id] === 'like' && 'fill-current'
														)}
													/>
													<span
														class={cn(
															'max-w-12 w-4',
															userReactions[comment.id] === 'like' && 'font-medium'
														)}
													>
														{formatNumber(comment.likes || 0)}
													</span>
												</Button>
												<Button
													variant={userReactions[comment.id] === 'dislike' ? 'default' : 'ghost'}
													size="sm"
													class={cn(
														'h-8 gap-1 transition-all duration-200 text-xs',
														userReactions[comment.id] === 'dislike' &&
															'bg-primary text-primary-foreground'
													)}
													onclick={() => toggleCommentReaction(comment.id, 'dislike', false)}
												>
													<ThumbsDown
														class={cn(
															'h-3 w-3 transition-all duration-200',
															userReactions[comment.id] === 'dislike' && 'fill-current'
														)}
													/>
													<span
														class={cn(
															'max-w-12 w-4',
															userReactions[comment.id] === 'dislike' && 'font-medium'
														)}
													>
														{formatNumber(comment.dislikes || 0)}
													</span>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													class="h-7 gap-1"
													onclick={() => {
														replyingTo = replyingTo === comment.id ? null : comment.id;
														if (!replyContents[comment.id]) replyContents[comment.id] = emptyDoc;
													}}
													disabled={postingComment}
												>
													<MessageCircle class="w-3 h-3" />
													<span class="text-xs">{t('articles.comments.reply')}</span>
												</Button>
												<DropdownMenu.Root>
													<DropdownMenu.Trigger asChild>
														<Button variant="ghost" size="xs" class="h-8 w-8 p-0">
															<Ellipsis class="w-4 h-4" />
														</Button>
													</DropdownMenu.Trigger>
													<DropdownMenu.Content align="end" class="w-48">
														<DropdownMenu.Item onclick={() => reportComment(comment.id)}>
															<BadgeAlertIcon
																triggers={{ hover: false }}
																animationState="loading"
																duration={3000}
																loop={true}
																class=" h-4 w-4"
															/>
															{t('articles.comments.report')}
														</DropdownMenu.Item>
														{#if isCommentOwner(comment) || $page.data.user?.role === 'moderator' || $page.data.user?.role === 'admin'}
															<DropdownMenu.Separator />
															<DropdownMenu.Item onclick={() => editComment(comment.id)}>
																<NotebookPenIcon
																	triggers={{ hover: false }}
																	animationState="loading"
																	duration={3000}
																	loop={true}
																	class=" h-4 w-4"
																/>
																{t('articles.comments.edit')}
															</DropdownMenu.Item>
															<DropdownMenu.Item onclick={() => deleteComment(comment.id)}>
																<BookMinusIcon
																	triggers={{ hover: false }}
																	animationState="loading"
																	duration={3000}
																	loop={true}
																	class=" h-4 w-4"
																/>
																{t('articles.comments.delete')}
															</DropdownMenu.Item>
															{#if comment.hidden}
																<DropdownMenu.Item onclick={() => hideComment(comment.id)}>
																	<Eye class=" h-4 w-4" />
																	{t('articles.comments.show')}
																</DropdownMenu.Item>
															{:else}
																<DropdownMenu.Item onclick={() => hideComment(comment.id)}>
																	<EyeOffIcon
																		triggers={{ hover: false }}
																		animationState="loading"
																		duration={3000}
																		loop={true}
																		class=" h-4 w-4"
																	/>
																	{t('articles.comments.hide')}
																</DropdownMenu.Item>
															{/if}
														{/if}
													</DropdownMenu.Content>
												</DropdownMenu.Root>
											</div>

											<!-- Reply form -->
											{#if replyingTo === comment.id}
												<div class="mt-4">
													{#key replyingTo}
														<div class="mb-2 border p-2 rounded-lg max-w-[92vw]">
															{#if replyEditors[comment.id]}
																<EdraToolBar
																	editor={replyEditors[comment.id]}
																	class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
																/>
															{/if}
															<EdraEditor
																bind:editor={replyEditors[comment.id]}
																content={replyContents[comment.id] || emptyDoc}
																class="min-h-[100px] rounded-lg h-min text-sm"
																onUpdate={() => onReplyEditorUpdate(comment.id)}
																placeholder={t('articles.comments.replyPlaceholder')}
																commentId={comment.id}
															/>
														</div>
													{/key}
													<div class="flex justify-end gap-2 mt-2">
														<Button
															variant="ghost"
															size="sm"
															onclick={() => {
																replyingTo = null;
																delete replyContents[comment.id];
																delete replyEditors[comment.id];
															}}
														>
															{t('articles.comments.cancel')}
														</Button>
														<Button
															size="sm"
															onclick={() => postReply(comment.id)}
															disabled={isCommentEmpty(replyContents[comment.id]) ||
																postingReply[comment.id] ||
																postingComment}
														>
															{#if postingReply[comment.id]}
																<BarSpinner class="text-primary" size={28} />
																{t('articles.comments.sending')}
															{:else}
																{t('articles.comments.reply')}
															{/if}
														</Button>
													</div>
												</div>
											{/if}

											<!-- Nested replies -->
											{#if comment.replies && comment.replies.length > 0}
												<div class="mt-4 ml-6 space-y-4 border-l-2 pl-4">
													{#each comment.replies as reply (reply.id)}
														{@const replyLevel = 1}
														{@const hasMoreReplies = reply.replies && reply.replies.length > 0}

														<div class="flex items-start gap-3" id={`comment-${reply.id}`}>
															<div class="flex-1">
																<div class="flex items-center gap-2 mb-3">
																	<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
																		<div
																			class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
																		>
																			<Avatar class="w-8 h-8">
																				{#if reply.author?.avatar}
																					<AvatarImage
																						src={reply.author.avatar}
																						alt={getAuthorDisplayName(reply.author)}
																						class="object-cover"
																					/>
																				{/if}
																				<AvatarFallback class="text-xs">
																					{(() => {
																						const name = reply.author?.name;
																						const surname = reply.author?.surname;
																						const nickname = reply.author?.nickname;

																						if (name && surname) {
																							return (name[0] + surname[0]).toUpperCase();
																						} else if (name) {
																							return name[0].toUpperCase();
																						} else if (nickname) {
																							return nickname[0].toUpperCase();
																						}
																						return 'U';
																					})()}
																				</AvatarFallback>
																			</Avatar>
																		</div>
																	</a>
																	<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
																		<span class="font-medium text-sm">
																			{reply.author?.name && reply.author?.surname
																				? `${reply.author.name} ${reply.author.surname}`
																				: reply.author?.nickname ||
																					t('articles.comments.anonymous')}
																		</span>
																	</a>
																	<ScrollArea orientation="horizontal" class="max-w-3/4">
																		<div class="flex flex-row gap-2 pb-1.5">
																			<span class="text-xs text-muted-foreground"
																				>{formatTimeAgo(reply.createdAt)}</span
																			>
																			{#if reply.metadata?.edited}
																				<span class="text-xs text-muted-foreground italic"
																					>({t('articles.comments.edited')})</span
																				>
																			{/if}
																			{#if reply.hidden}
																				<Tooltip.Provider>
																					<Tooltip.Root>
																						<Tooltip.Trigger>
																							<EyeOff class="h-3 w-3 text-orange-600" />
																						</Tooltip.Trigger>
																						<Tooltip.Content>
																							<p>{t('articles.comments.hidden')}</p>
																						</Tooltip.Content>
																					</Tooltip.Root>
																				</Tooltip.Provider>
																			{/if}
																			{#if reply.reportCount > 0}
																				<span class="text-xs text-red-600 italic"
																					>({t('articles.comments.reported')})</span
																				>
																			{/if}
																		</div></ScrollArea
																	>
																</div>
																<Separator />
																<div class="text-sm my-3">
																	{#if editingCommentId === reply.id}
																		<div class="mb-2 border p-2 rounded-lg max-w-[92vw]">
																			{#if editingEditor}
																				<EdraToolBar
																					editor={editingEditor}
																					class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
																				/>
																			{/if}
																			<EdraEditor
																				bind:editor={editingEditor}
																				content={editingContent || emptyDoc}
																				class="min-h-[100px] rounded-lg h-min text-sm"
																				onUpdate={onEditingEditorUpdate}
																				placeholder={t('articles.comments.editPlaceholder')}
																			/>
																			<div class="flex justify-end gap-2 mt-2">
																				<Button
																					variant="ghost"
																					size="sm"
																					onclick={cancelEditComment}
																				>
																					{t('articles.comments.cancel')}
																				</Button>
																				<Button
																					size="sm"
																					onclick={saveEditedComment}
																					disabled={isCommentEmpty(editingContent)}
																				>
																					{t('articles.comments.save')}
																				</Button>
																			</div>
																		</div>
																	{:else}
																		<EdraEditor content={reply.content} editable={false} />
																	{/if}
																</div>
																<Separator />

																<div class="flex mt-3 items-center gap-3">
																	<Button
																		variant={userReactions[reply.id] === 'like'
																			? 'default'
																			: 'ghost'}
																		size="sm"
																		class={cn(
																			'h-7 gap-1 transition-all duration-200 text-xs',
																			userReactions[reply.id] === 'like' &&
																				'bg-primary text-primary-foreground'
																		)}
																		onclick={() =>
																			toggleCommentReaction(reply.id, 'like', true, comment.id)}
																	>
																		<ThumbsUp
																			class={cn(
																				'h-3 w-3 transition-all duration-200',
																				userReactions[reply.id] === 'like' && 'fill-current'
																			)}
																		/>
																		<span
																			class={cn(
																				'max-w-12 w-4',
																				userReactions[reply.id] === 'like' && 'font-medium'
																			)}
																		>
																			{formatNumber(reply.likes || 0)}
																		</span>
																	</Button>
																	<Button
																		variant={userReactions[reply.id] === 'dislike'
																			? 'default'
																			: 'ghost'}
																		size="sm"
																		class={cn(
																			'h-7 gap-1 transition-all duration-200 text-xs',
																			userReactions[reply.id] === 'dislike' &&
																				'bg-primary text-primary-foreground'
																		)}
																		onclick={() =>
																			toggleCommentReaction(reply.id, 'dislike', true, comment.id)}
																	>
																		<ThumbsDown
																			class={cn(
																				'h-3 w-3 transition-all duration-200',
																				userReactions[reply.id] === 'dislike' && 'fill-current'
																			)}
																		/>
																		<span
																			class={cn(
																				'max-w-12 w-4',
																				userReactions[reply.id] === 'dislike' && 'font-medium'
																			)}
																		>
																			{formatNumber(reply.dislikes || 0)}
																		</span>
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		class="h-7 gap-1"
																		onclick={() => {
																			replyingTo = replyingTo === reply.id ? null : reply.id;
																			if (!replyContents[reply.id])
																				replyContents[reply.id] = emptyDoc;
																		}}
																	>
																		<MessageCircle class="w-3 h-3" />
																		<span class="text-xs">{t('articles.comments.reply')}</span>
																	</Button>
																	<DropdownMenu.Root>
																		<DropdownMenu.Trigger asChild>
																			<Button variant="ghost" size="xs" class="h-7 w-7 p-0">
																				<Ellipsis class="w-3 h-3" />
																			</Button>
																		</DropdownMenu.Trigger>
																		<DropdownMenu.Content align="end" class="w-48">
																			<DropdownMenu.Item onclick={() => reportComment(reply.id)}>
																				<BadgeAlertIcon
																					triggers={{ hover: false }}
																					animationState="loading"
																					duration={3000}
																					loop={true}
																					class=" h-4 w-4"
																				/>
																				{t('articles.comments.report')}
																			</DropdownMenu.Item>
																			{#if isCommentOwner(reply) || $page.data.user?.role === 'moderator' || $page.data.user?.role === 'admin'}
																				<DropdownMenu.Separator />
																				<DropdownMenu.Item onclick={() => editComment(reply.id)}>
																					<NotebookPenIcon
																						triggers={{ hover: false }}
																						animationState="loading"
																						duration={3000}
																						loop={true}
																						class=" h-4 w-4"
																					/>
																					{t('articles.comments.edit')}
																				</DropdownMenu.Item>
																				<DropdownMenu.Item onclick={() => deleteComment(reply.id)}>
																					<BookMinusIcon
																						triggers={{ hover: false }}
																						animationState="loading"
																						duration={3000}
																						loop={true}
																						class=" h-4 w-4"
																					/>
																					{t('articles.comments.delete')}
																				</DropdownMenu.Item>
																				{#if reply.hidden}
																					<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
																						<Eye class=" h-4 w-4" />
																						{t('articles.comments.show')}
																					</DropdownMenu.Item>
																				{:else}
																					<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
																						<EyeOffIcon
																							triggers={{ hover: false }}
																							animationState="loading"
																							duration={3000}
																							loop={true}
																							class=" h-4 w-4"
																						/>
																						{t('articles.comments.hide')}
																					</DropdownMenu.Item>
																				{/if}
																			{/if}
																		</DropdownMenu.Content>
																	</DropdownMenu.Root>
																</div>

																<!-- Reply form for this reply -->
																{#if replyingTo === reply.id}
																	<div class="mt-3 border p-2 rounded-lg">
																		{#key replyingTo}
																			<div class="mb-2 max-w-[65vw]">
																				{#if replyEditors[reply.id]}
																					<EdraToolBar
																						editor={replyEditors[reply.id]}
																						class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
																					/>
																				{/if}
																				<EdraEditor
																					bind:editor={replyEditors[reply.id]}
																					content={replyContents[reply.id] || emptyDoc}
																					class="min-h-[80px] h-min rounded-lg text-sm"
																					onUpdate={() => onReplyEditorUpdate(reply.id)}
																					placeholder={t('articles.comments.replyPlaceholder')}
																				/>
																			</div>
																		{/key}
																		<div class="flex justify-end gap-2 mt-2">
																			<Button
																				variant="ghost"
																				size="sm"
																				onclick={() => {
																					replyingTo = null;
																					delete replyContents[reply.id];
																					delete replyEditors[reply.id];
																				}}
																			>
																				{t('articles.comments.cancel')}
																			</Button>
																			<Button
																				size="sm"
																				onclick={() => postReply(reply.id)}
																				disabled={isCommentEmpty(replyContents[reply.id])}
																			>
																				{t('articles.comments.reply')}
																			</Button>
																		</div>
																	</div>
																{/if}

																<!-- Show replies dialog button for level 1 replies -->
																{#if hasMoreReplies && replyLevel >= DEFAULT_VISIBLE_LEVELS}
																	<div class="border-l mt-1 mb-2">
																		<Button
																			variant="ghost"
																			size="xs"
																			class="text-xs text-muted-foreground hover:text-foreground"
																			onclick={() =>
																				openNestedDialog(reply, replyLevel, comment.id)}
																		>
																			<MessageCircle class="w-3 h-3 mr-1" />
																			{t('articles.comments.showReplies', {
																				count: reply.replies.length
																			})}
																		</Button>
																	</div>
																{/if}

																<!-- Deeply nested replies -->
																{#if hasMoreReplies && (replyLevel < DEFAULT_VISIBLE_LEVELS || expandedComments.has(reply.id))}
																	<div class="mt-3 ml-4 space-y-3 border-l pl-3">
																		{@render NestedReplyList(
																			reply.replies,
																			replyLevel + 1,
																			reply.id
																		)}
																	</div>
																{/if}
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

				<!-- Similar Articles Recommendation -->
				{#if data.similarArticles && data.similarArticles.length > 0}
					<div class="mt-16">
						<ArticleRecommendation
							articles={data.similarArticles}
							title={t('articles.similarArticles') || 'Benzer Makaleler'}
						/>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>

<!-- Nested Reply Snippet -->
{#snippet NestedReplyList(replies: any[], level: number, parentId: string)}
	{#each replies as reply (reply.id)}
		{@const replyLevel = level}
		{@const hasMoreReplies = reply.replies && reply.replies.length > 0}

		<div class="flex items-start gap-3" id={`comment-${reply.id}`}>
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-1">
					<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
						<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
							<Avatar class="w-6 h-6">
								{#if reply.author?.avatar}
									<AvatarImage
										src={reply.author.avatar}
										alt={getAuthorDisplayName(reply.author)}
										class="object-cover"
									/>
								{/if}
								<AvatarFallback class="text-[8px]">
									{(() => {
										const name = reply.author?.name;
										const surname = reply.author?.surname;
										const nickname = reply.author?.nickname;

										if (name && surname) {
											return (name[0] + surname[0]).toUpperCase();
										} else if (name) {
											return name[0].toUpperCase();
										} else if (nickname) {
											return nickname[0].toUpperCase();
										}
										return 'U';
									})()}
								</AvatarFallback>
							</Avatar>
						</div>
					</a>
					<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
						<span class="font-medium text-xs">
							{reply.author?.name && reply.author?.surname
								? `${reply.author.name} ${reply.author.surname}`
								: reply.author?.nickname || 'Anonim'}
						</span>
					</a>

					<span class="text-xs text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
					{#if reply.metadata?.edited}
						<span class="text-xs text-muted-foreground italic"
							>({t('articles.comments.edited')})</span
						>
					{/if}
					{#if reply.hidden}
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<EyeOff class="h-3 w-3 text-orange-600" />
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>{t('hidden')}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
				</div>
				<div class="text-xs mb-2">
					<EdraEditor content={reply.content} editable={false} />
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant={userReactions[reply.id] === 'like' ? 'default' : 'ghost'}
						size="sm"
						class={cn(
							'h-6 gap-1 transition-all duration-200 text-xs',
							userReactions[reply.id] === 'like' && 'bg-primary text-primary-foreground'
						)}
						onclick={() => toggleCommentReaction(reply.id, 'like', true, parentId)}
					>
						<ThumbsUp
							class={cn(
								'h-3 w-3 transition-all duration-200',
								userReactions[reply.id] === 'like' && 'fill-current'
							)}
						/>
						<span class={cn('max-w-12 w-4', userReactions[reply.id] === 'like' && 'font-medium')}>
							{formatNumber(reply.likes || 0)}
						</span>
					</Button>
					<Button
						variant={userReactions[reply.id] === 'dislike' ? 'default' : 'ghost'}
						size="sm"
						class={cn(
							'h-6 gap-1 transition-all duration-200 text-xs',
							userReactions[reply.id] === 'dislike' && 'bg-primary text-primary-foreground'
						)}
						onclick={() => toggleCommentReaction(reply.id, 'dislike', true, parentId)}
					>
						<ThumbsDown
							class={cn(
								'h-3 w-3 transition-all duration-200',
								userReactions[reply.id] === 'dislike' && 'fill-current'
							)}
						/>
						<span
							class={cn('max-w-12 w-4', userReactions[reply.id] === 'dislike' && 'font-medium')}
						>
							{formatNumber(reply.dislikes || 0)}
						</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-6 gap-1"
						onclick={() => {
							replyingTo = replyingTo === reply.id ? null : reply.id;
							if (!replyContents[reply.id]) replyContents[reply.id] = emptyDoc;
						}}
					>
						<MessageCircle class="w-3 h-3" />
						<span class="text-xs">{t('articles.comments.reply')}</span>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild>
							<Button variant="ghost" size="xs" class="h-6 w-6 p-0">
								<Ellipsis class="w-3 h-3" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-48">
							<DropdownMenu.Item onclick={() => reportComment(reply.id)}>
								<BadgeAlertIcon
									triggers={{ hover: false }}
									animationState="loading"
									duration={3000}
									loop={true}
									class=" h-4 w-4"
								/>
								{t('articles.comments.report')}
							</DropdownMenu.Item>
							{#if isCommentOwner(reply) || $page.data.user?.role === 'moderator' || $page.data.user?.role === 'admin'}
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => editComment(reply.id)}>
									<NotebookPenIcon
										triggers={{ hover: false }}
										animationState="loading"
										duration={3000}
										loop={true}
										class=" h-4 w-4"
									/>
									{t('articles.comments.edit')}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => deleteComment(reply.id)}>
									<BookMinusIcon
										triggers={{ hover: false }}
										animationState="loading"
										duration={3000}
										loop={true}
										class=" h-4 w-4"
									/>
									{t('articles.comments.delete')}
								</DropdownMenu.Item>
								{#if reply.hidden}
									<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
										<Eye class=" h-4 w-4" />
										{t('articles.comments.show')}
									</DropdownMenu.Item>
								{:else}
									<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
										<EyeOffIcon
											triggers={{ hover: false }}
											animationState="loading"
											duration={3000}
											loop={true}
											class=" h-4 w-4"
										/>
										{t('articles.comments.hide')}
									</DropdownMenu.Item>
								{/if}
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<!-- Reply form -->
				{#if replyingTo === reply.id}
					<div class="mt-2 ml-2 border p-1 rounded-lg">
						{#key replyingTo}
							<div class="mb-1 max-w-[65vw] sm:max-w-[40vw]">
								{#if replyEditors[reply.id]}
									<EdraToolBar
										editor={replyEditors[reply.id]}
										class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
									/>
								{/if}
								<EdraEditor
									bind:editor={replyEditors[reply.id]}
									content={replyContents[reply.id] || emptyDoc}
									class="min-h-[60px] h-min rounded-lg text-xs"
									onUpdate={() => onReplyEditorUpdate(reply.id)}
									placeholder="Yanıtınızı yazın..."
								/>
							</div>
						{/key}
						<div class="flex justify-end gap-1 mt-1">
							<Button
								variant="ghost"
								size="sm"
								class="text-xs"
								onclick={() => {
									replyingTo = null;
									delete replyContents[reply.id];
									delete replyEditors[reply.id];
								}}
							>
								{t('Cancel')}
							</Button>
							<Button
								size="sm"
								class="text-xs"
								onclick={() => postReply(reply.id)}
								disabled={isCommentEmpty(replyContents[reply.id])}
							>
								{t('articles.comments.reply')}
							</Button>
						</div>
					</div>
				{/if}

				<!-- Show nested replies or dialog button -->
				{#if hasMoreReplies}
					{#if replyLevel < DEFAULT_VISIBLE_LEVELS}
						<!-- Show nested replies directly for first level -->
						<div class="mt-2 ml-2 space-y-2 border-l pl-2">
							{@render NestedReplyList(reply.replies, replyLevel + 1, reply.id)}
						</div>
					{:else}
						<!-- Show dialog button for level 1 replies and deeper -->
						<div class="mt-1 mb-2 border-l">
							<Button
								variant="ghost"
								size="xs"
								class="text-xs text-muted-foreground hover:text-foreground"
								onclick={() => openNestedDialog(reply, replyLevel, reply.id)}
							>
								<MessageCircle class="w-3 h-3 mr-1" />
								{reply.replies.length} yanıtı göster
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/each}
{/snippet}

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
			<AlertDialog.Cancel>{t('Cancel')}</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={confirmDelete}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				{t('articles.comments.delete')}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showHideDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				{articleHidden || selectedComment?.hidden ? 'Göster' : 'Gizle'}
				{dialogType === 'article' ? ' Makaleyi' : ' Yorumu'}
			</AlertDialog.Title>
			<AlertDialog.Description>
				{articleHidden || selectedComment?.hidden
					? `Bu ${dialogType === 'article' ? 'makaleyi' : 'yorumu'} göstermek istediğinizden emin misiniz?`
					: `Bu ${dialogType === 'article' ? 'makaleyi' : 'yorumu'} gizlemek istediğinizden emin misiniz? ${dialogType === 'article' ? 'Makale' : 'Yorum'} diğer kullanıcılar tarafından görülemeyecek.`}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{t('Cancel')}</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmHide}>
				{articleHidden || selectedComment?.hidden ? 'Göster' : 'Gizle'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<ReportDrawer
	bind:open={showReportDrawer}
	reportType={selectedComment ? 'comment' : 'article'}
	targetId={selectedComment ? selectedComment.id : data.article?._id}
	targetTitle={selectedComment ? 'Yorum' : data.article?.title}
	targetUrl={selectedComment
		? typeof window !== 'undefined'
			? window.location.href
			: undefined
		: undefined}
	onReported={handleCommentReported}
/>

<!-- Nested Comments Dialog -->
<Dialog.Root bind:open={showNestedDialog}>
	<Dialog.Content class="!max-w-3xl max-h-[80vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if dialogHistory.length > 0}
					<Button variant="ghost" size="xs" class="h-8 w-8 p-0 mr-1" onclick={goBackInDialog}>
						<ArrowLeft class="w-4 h-4" />
					</Button>
				{/if}
				<MessageCircle class="w-5 h-5" />
				{t('articles.replies')}
			</Dialog.Title>
			{#if dialogParentComment}
				<Dialog.Description class="text-sm text-muted-foreground">
					{dialogParentComment.author?.name && dialogParentComment.author?.surname
						? `${dialogParentComment.author.name} ${dialogParentComment.author.surname}`
						: dialogParentComment.author?.nickname || t('articles.comments.anonymous')}
					{t('articles.replyingTo')}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="mt-4 space-y-4">
			{#each dialogComments as comment (comment.id)}
				{@const commentLevel = dialogLevel}
				{@const hasMoreReplies = comment.replies && comment.replies.length > 0}

				<div class="flex flex-col">
					<div class="flex items-start gap-3">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<a href={l(`/${getAuthorIdentifier(comment.author)}`)}>
									<div
										class="w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0"
									>
										<Avatar class="w-7.5 h-7.5">
											{#if comment.author?.avatar}
												<AvatarImage
													src={comment.author.avatar}
													alt={getAuthorDisplayName(comment.author)}
													class="object-cover"
												/>
											{/if}
											<AvatarFallback class="text-[10px]">
												{(() => {
													const name = comment.author?.name;
													const surname = comment.author?.surname;
													const nickname = comment.author?.nickname;

													if (name && surname) {
														return (name[0] + surname[0]).toUpperCase();
													} else if (name) {
														return name[0].toUpperCase();
													} else if (nickname) {
														return nickname[0].toUpperCase();
													}
													return 'U';
												})()}
											</AvatarFallback>
										</Avatar>
									</div>
								</a>
								<a href={l(`/${getAuthorIdentifier(comment.author)}`)}>
									<span class="font-medium text-xs">
										{comment.author?.name && comment.author?.surname
											? `${comment.author.name} ${comment.author.surname}`
											: comment.author?.nickname || 'Anonim'}
									</span>
								</a>
								<ScrollArea orientation="horizontal" class="max-w-3/4">
									<div class="flex flex-row gap-2 pb-1.5">
										<span class="text-xs text-muted-foreground"
											>{formatTimeAgo(comment.createdAt)}</span
										>
										{#if comment.metadata?.edited}
											<span class="text-xs text-muted-foreground italic"
												>({t('articles.comments.edited')})</span
											>
										{/if}
										{#if comment.hidden}
											<Tooltip.Provider>
												<Tooltip.Root>
													<Tooltip.Trigger>
														<EyeOff class="h-3 w-3 text-orange-600" />
													</Tooltip.Trigger>
													<Tooltip.Content>
														<p>{t('hidden')}</p>
													</Tooltip.Content>
												</Tooltip.Root>
											</Tooltip.Provider>
										{/if}
										{#if comment.reportCount > 0}
											<span class="text-xs text-red-600 italic"
												>({t('articles.comments.reported')})</span
											>
										{/if}
									</div>
								</ScrollArea>
							</div>
							<Separator />
							<div class="text-sm my-3">
								{#if editingCommentId === comment.id}
									<!-- Edit form -->
									<div class="border p-2 rounded-lg">
										{#key editingCommentId}
											<div class="mb-2 max-w-[65vw] sm:max-w-[40vw]">
												{#if editingEditor}
													<EdraToolBar
														editor={editingEditor}
														class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
													/>
												{/if}
												<EdraEditor
													bind:editor={editingEditor}
													content={editingContent || emptyDoc}
													class="min-h-[80px] h-min rounded-lg text-sm"
													onUpdate={onEditingEditorUpdate}
													placeholder="Yorumunuzu düzenleyin..."
												/>
											</div>
										{/key}
										<div class="flex justify-end gap-2 mt-2">
											<Button variant="ghost" size="xs" onclick={cancelEditComment}>
												{t('Cancel')}
											</Button>
											<Button
												size="sm"
												onclick={saveEditedComment}
												disabled={isCommentEmpty(editingContent)}
											>
												{t('Save')}
											</Button>
										</div>
									</div>
								{:else}
									<!-- Normal content display -->
									<EdraEditor content={comment.content} editable={false} />
								{/if}
							</div>
							<Separator />

							<div class="flex items-center gap-3 mt-3">
								<Button
									variant={userReactions[comment.id] === 'like' ? 'default' : 'ghost'}
									size="sm"
									class={cn(
										'h-7 gap-1 transition-all duration-200 text-xs',
										userReactions[comment.id] === 'like' && 'bg-primary text-primary-foreground'
									)}
									onclick={() => toggleCommentReaction(comment.id, 'like', true, dialogParentId)}
								>
									<ThumbsUp
										class={cn(
											'h-3 w-3 transition-all duration-200',
											userReactions[comment.id] === 'like' && 'fill-current'
										)}
									/>
									<span
										class={cn(
											'max-w-12 w-4',
											userReactions[comment.id] === 'like' && 'font-medium'
										)}
									>
										{formatNumber(comment.likes || 0)}
									</span>
								</Button>
								<Button
									variant={userReactions[comment.id] === 'dislike' ? 'default' : 'ghost'}
									size="sm"
									class={cn(
										'h-7 gap-1 transition-all duration-200 text-xs',
										userReactions[comment.id] === 'dislike' && 'bg-primary text-primary-foreground'
									)}
									onclick={() => toggleCommentReaction(comment.id, 'dislike', true, dialogParentId)}
								>
									<ThumbsDown
										class={cn(
											'h-3 w-3 transition-all duration-200',
											userReactions[comment.id] === 'dislike' && 'fill-current'
										)}
									/>
									<span
										class={cn(
											'max-w-12 w-4',
											userReactions[comment.id] === 'dislike' && 'font-medium'
										)}
									>
										{formatNumber(comment.dislikes || 0)}
									</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 gap-1"
									onclick={() => {
										replyingTo = replyingTo === comment.id ? null : comment.id;
										if (!replyContents[comment.id]) replyContents[comment.id] = emptyDoc;
									}}
								>
									<MessageCircle class="w-3 h-3" />
									<span class="text-xs">{t('articles.comments.reply')}</span>
								</Button>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild>
										<Button variant="ghost" size="xs" class="h-7 w-7 p-0">
											<Ellipsis class="w-3 h-3" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-48">
										<DropdownMenu.Item onclick={() => reportComment(comment.id)}>
											<BadgeAlertIcon
												triggers={{ hover: false }}
												animationState="loading"
												duration={3000}
												loop={true}
												class=" h-4 w-4"
											/>
											{t('articles.comments.report')}
										</DropdownMenu.Item>
										{#if isCommentOwner(comment) || $page.data.user?.role === 'moderator' || $page.data.user?.role === 'admin'}
											<DropdownMenu.Separator />
											<DropdownMenu.Item onclick={() => editComment(comment.id)}>
												<NotebookPenIcon
													triggers={{ hover: false }}
													animationState="loading"
													duration={3000}
													loop={true}
													class=" h-4 w-4"
												/>
												{t('articles.comments.edit')}
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => deleteComment(comment.id)}>
												<BookMinusIcon
													triggers={{ hover: false }}
													animationState="loading"
													duration={3000}
													loop={true}
													class=" h-4 w-4"
												/>
												{t('articles.comments.delete')}
											</DropdownMenu.Item>
											{#if comment.hidden}
												<DropdownMenu.Item onclick={() => hideComment(comment.id)}>
													<Eye class=" h-4 w-4" />
													{t('articles.comments.show')}
												</DropdownMenu.Item>
											{:else}
												<DropdownMenu.Item onclick={() => hideComment(comment.id)}>
													<EyeOffIcon
														triggers={{ hover: false }}
														animationState="loading"
														duration={3000}
														loop={true}
														class=" h-4 w-4"
													/>
													{t('articles.comments.hide')}
												</DropdownMenu.Item>
											{/if}
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
					</div>
					<!-- Reply form -->
					{#if replyingTo === comment.id}
						<div class="mt-3 border p-2 rounded-lg">
							{#key replyingTo}
								<div class="mb-2 max-w-[65vw] sm:max-w-[40vw]">
									{#if replyEditors[comment.id]}
										<EdraToolBar
											editor={replyEditors[comment.id]}
											class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
										/>
									{/if}
									<EdraEditor
										bind:editor={replyEditors[comment.id]}
										content={replyContents[comment.id] || emptyDoc}
										class="min-h-[80px] h-min rounded-lg text-sm"
										onUpdate={() => onReplyEditorUpdate(comment.id)}
										placeholder={t('articles.comments.replyPlaceholder')}
									/>
								</div>
							{/key}
							<div class="flex justify-end gap-2 mt-2">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => {
										replyingTo = null;
										delete replyContents[comment.id];
										delete replyEditors[comment.id];
									}}
								>
									{t('Cancel')}
								</Button>
								<Button
									size="sm"
									onclick={() => postReply(comment.id)}
									disabled={isCommentEmpty(replyContents[comment.id])}
								>
									{t('articles.comments.reply')}
								</Button>
							</div>
						</div>
					{/if}
					<!-- Show nested replies or dialog button -->
					{#if hasMoreReplies}
						<!-- Always show nested replies for first 2 levels in dialog -->
						<div class="mt-3 ml-4 space-y-3 border-l pl-3">
							{@render DialogNestedReplyList(comment.replies, commentLevel + 1, comment.id)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Nested Reply Snippet for Dialog -->
{#snippet DialogNestedReplyList(replies: any[], level: number, parentId: string)}
	{#each replies as reply (reply.id)}
		{@const replyLevel = level}
		{@const hasMoreReplies = reply.replies && reply.replies.length > 0}

		<div class="flex items-start gap-3">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-2">
					<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
						<div class="w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0">
							<Avatar class="w-7.5 h-7.5">
								{#if reply.author?.avatar}
									<AvatarImage
										src={reply.author.avatar}
										alt={getAuthorDisplayName(reply.author)}
										class="object-cover"
									/>
								{/if}
								<AvatarFallback class="text-[10px]">
									{(() => {
										const name = reply.author?.name;
										const surname = reply.author?.surname;
										const nickname = reply.author?.nickname;

										if (name && surname) {
											return (name[0] + surname[0]).toUpperCase();
										} else if (name) {
											return name[0].toUpperCase();
										} else if (nickname) {
											return nickname[0].toUpperCase();
										}
										return 'U';
									})()}
								</AvatarFallback>
							</Avatar>
						</div>
					</a>
					<a href={l(`/${getAuthorIdentifier(reply.author)}`)}>
						<span class="font-medium text-xs">
							{reply.author?.name && reply.author?.surname
								? `${reply.author.name} ${reply.author.surname}`
								: reply.author?.nickname || 'Anonim'}
						</span>
					</a><ScrollArea orientation="horizontal" class="max-w-3/4">
						<div class="flex flex-row gap-2 pb-1.5">
							<span class="text-xs text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
							{#if reply.metadata?.edited}
								<span class="text-xs text-muted-foreground italic"
									>({t('articles.comments.edited')})</span
								>
							{/if}
							{#if reply.hidden}
								<Tooltip.Provider>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<EyeOff class="h-3 w-3 text-orange-600" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>{t('hidden')}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							{/if}
						</div>
					</ScrollArea>
				</div>
				<Separator />
				<div class="text-xs my-2">
					{#if editingCommentId === reply.id}
						<!-- Edit form for nested reply -->
						<div class="border p-2 rounded-lg">
							{#key editingCommentId}
								<div class="mb-2 max-w-[65vw] sm:max-w-[40vw]">
									{#if editingEditor}
										<EdraToolBar
											editor={editingEditor}
											class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
										/>/>
									{/if}
									<EdraEditor
										bind:editor={editingEditor}
										content={editingContent || emptyDoc}
										class="min-h-[60px] h-min rounded-lg text-xs"
										onUpdate={onEditingEditorUpdate}
										placeholder="Yorumunuzu düzenleyin..."
									/>
								</div>
							{/key}
							<div class="flex justify-end gap-2 mt-2">
								<Button variant="ghost" size="xs" class="text-xs" onclick={cancelEditComment}>
									{t('Cancel')}
								</Button>
								<Button
									size="xs"
									class="text-xs"
									onclick={saveEditedComment}
									disabled={isCommentEmpty(editingContent)}
								>
									{t('Save')}
								</Button>
							</div>
						</div>
					{:else}
						<!-- Normal content display -->
						<EdraEditor content={reply.content} editable={false} />
					{/if}
				</div>
				<Separator />

				<div class="flex items-center gap-2 mt-2">
					<Button
						variant={userReactions[reply.id] === 'like' ? 'default' : 'ghost'}
						size="sm"
						class={cn(
							'h-6 gap-1 transition-all duration-200 text-xs',
							userReactions[reply.id] === 'like' && 'bg-primary text-primary-foreground'
						)}
						onclick={() => toggleCommentReaction(reply.id, 'like', true, parentId)}
					>
						<ThumbsUp
							class={cn(
								'h-3 w-3 transition-all duration-200',
								userReactions[reply.id] === 'like' && 'fill-current'
							)}
						/>
						<span class={cn('max-w-12 w-4', userReactions[reply.id] === 'like' && 'font-medium')}>
							{formatNumber(reply.likes || 0)}
						</span>
					</Button>
					<Button
						variant={userReactions[reply.id] === 'dislike' ? 'default' : 'ghost'}
						size="sm"
						class={cn(
							'h-6 gap-1 transition-all duration-200 text-xs',
							userReactions[reply.id] === 'dislike' && 'bg-primary text-primary-foreground'
						)}
						onclick={() => toggleCommentReaction(reply.id, 'dislike', true, parentId)}
					>
						<ThumbsDown
							class={cn(
								'h-3 w-3 transition-all duration-200',
								userReactions[reply.id] === 'dislike' && 'fill-current'
							)}
						/>
						<span
							class={cn('max-w-12 w-4', userReactions[reply.id] === 'dislike' && 'font-medium')}
						>
							{formatNumber(reply.dislikes || 0)}
						</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-6 gap-1"
						onclick={() => {
							replyingTo = replyingTo === reply.id ? null : reply.id;
							if (!replyContents[reply.id]) replyContents[reply.id] = emptyDoc;
						}}
					>
						<MessageCircle class="w-3 h-3" />
						<span class="text-xs">{t('articles.comments.reply')}</span>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild>
							<Button variant="ghost" size="xs" class="h-6 w-6 p-0">
								<Ellipsis class="w-3 h-3" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-48">
							<DropdownMenu.Item onclick={() => reportComment(reply.id)}>
								<BadgeAlertIcon
									triggers={{ hover: false }}
									animationState="loading"
									duration={3000}
									loop={true}
									class=" h-4 w-4"
								/>
								{t('articles.comments.report')}
							</DropdownMenu.Item>
							{#if isCommentOwner(reply) || $page.data.user?.role === 'moderator' || $page.data.user?.role === 'admin'}
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => editComment(reply.id)}>
									<NotebookPenIcon
										triggers={{ hover: false }}
										animationState="loading"
										duration={3000}
										loop={true}
										class=" h-4 w-4"
									/>
									{t('articles.comments.edit')}
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => deleteComment(reply.id)}>
									<BookMinusIcon
										triggers={{ hover: false }}
										animationState="loading"
										duration={3000}
										loop={true}
										class=" h-4 w-4"
									/>
									{t('articles.comments.delete')}
								</DropdownMenu.Item>
								{#if reply.hidden}
									<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
										<Eye class=" h-4 w-4" />
										{t('articles.comments.show')}
									</DropdownMenu.Item>
								{:else}
									<DropdownMenu.Item onclick={() => hideComment(reply.id)}>
										<EyeOffIcon
											triggers={{ hover: false }}
											animationState="loading"
											duration={3000}
											loop={true}
											class=" h-4 w-4"
										/>
										{t('articles.comments.hide')}
									</DropdownMenu.Item>
								{/if}
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<!-- Show nested replies or dialog button -->
				{#if hasMoreReplies}
					{#if replyLevel < DIALOG_VISIBLE_LEVELS}
						<!-- Show nested replies directly for first 2 levels in dialog -->
						<div class="mt-2 ml-2 space-y-2 border-l pl-2">
							{@render DialogNestedReplyList(reply.replies, replyLevel + 1, reply.id)}
						</div>
					{:else}
						<!-- Show dialog button for deeper levels -->
						<div class="mt-2">
							<Button
								variant="ghost"
								size="xs"
								class="text-xs text-muted-foreground hover:text-foreground"
								onclick={() => openNestedDialog(reply, replyLevel + 1, reply.id)}
							>
								<MessageCircle class="w-3 h-3 mr-1" />
								{reply.replies.length} yanıtı göster
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Reply form -->
		{#if replyingTo === reply.id}
			<div class="mt-2 ml-2 border p-1 rounded-lg">
				{#key replyingTo}
					<div class="mb-1 max-w-[65vw] sm:max-w-[40vw]">
						{#if replyEditors[reply.id]}
							<EdraToolBar
								editor={replyEditors[reply.id]}
								class="bg-background/44 backdrop-blur-sm border-b rounded-md rounded-b-none flex w-full items-center overflow-x-scroll sm:overflow-x-auto  z-1 self-start"
							/>
						{/if}
						<EdraEditor
							bind:editor={replyEditors[reply.id]}
							content={replyContents[reply.id] || emptyDoc}
							class="min-h-[60px] h-min rounded-lg text-xs"
							onUpdate={() => onReplyEditorUpdate(reply.id)}
							placeholder="Yanıtınızı yazın..."
						/>
					</div>
				{/key}
				<div class="flex justify-end gap-1 mt-1">
					<Button
						variant="ghost"
						size="sm"
						class="text-xs"
						onclick={() => {
							replyingTo = null;
							delete replyContents[reply.id];
							delete replyEditors[reply.id];
						}}
					>
						{t('Cancel')}
					</Button>
					<Button
						size="sm"
						class="text-xs"
						onclick={() => postReply(reply.id)}
						disabled={isCommentEmpty(replyContents[reply.id])}
					>
						{t('articles.comments.reply')}
					</Button>
				</div>
			</div>
		{/if}
	{/each}
{/snippet}
<Footer />
