import type { PageServerLoad } from './$types';
import { getUsers, getArticles, getFollowersList, getFollowingList, getFollowCounts, isUserBlockedRelation, isFollowing } from '$db/queries';
import { error } from '@sveltejs/kit';
import { slugify } from '$lib/utils/slugify';
import { getUserBadges } from '$lib/server/badges';

interface ArticleVersion {
    title: string;
    excerpt: string;
    slug: string;
    language: string;
    content?: any;
}

const toSerializableId = (value: unknown) => {
	if (!value) return value;
	if (typeof value === 'string') return value;
	if (typeof value === 'object' && typeof (value as { toString: () => string }).toString === 'function') {
		return (value as { toString: () => string }).toString();
	}
	return value;
};

const sanitizeRelationEntries = <T extends Record<string, any>>(
	entries: T[] | undefined,
	idKey: keyof T,
	dateKey?: keyof T
): T[] | undefined => {
	if (!Array.isArray(entries)) return undefined;
	return entries.map((entry) => ({
		...entry,
		[idKey]: toSerializableId(entry[idKey]),
		...(dateKey
			? {
				[dateKey]: entry[dateKey] instanceof Date
					? (entry[dateKey] as Date).toISOString()
					: entry[dateKey]
			}
			: {})
	}));
};

interface Article {
    _id: any;
    versions?: Record<string, ArticleVersion>;
    title?: string;
    excerpt?: string;
    slug: string;
    language?: string;
    category?: string;
    tags?: string[];
    stats?: {
        views: number;
        likes: number;
        comments: number;
    };
    publishedAt?: Date | string;
    createdAt: Date | string;
    status?: string;
    deletedAt?: Date;
    authorId: any;
}

const sanitizeContent = (content: unknown): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;

  try {
    return JSON.stringify(content);
  } catch {
    return '';
  }
};

const calculateReadTime = (content: unknown): number => {
  const text = sanitizeContent(content).replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 1;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

export const load: PageServerLoad = async ({ params, locals }: any) => {
	const requestedNickname = slugify(params.nickname);
	
	// Get user data from database
	const profileUsers = await getUsers({ username: requestedNickname });
	const profileUser = profileUsers[0];

	if (!profileUser) {
		throw error(404, 'User not found');
	}

	// Check if profile is hidden and viewer is not authorized
	const viewerId = locals.user?.id;
	const isModeratorOrAdmin = locals.user?.role === 'moderator' || locals.user?.role === 'admin';
	const isOwnProfile = viewerId === profileUser.id;
	
	if (profileUser.is_hidden && !isOwnProfile && !isModeratorOrAdmin) {
		throw error(403, 'Profile is hidden');
	}

	const viewerObjectId = viewerId;

	// Get viewer data for blocking information
	const viewerDoc = viewerObjectId ? await getUsers({ id: viewerObjectId }) : [];
	const viewer = viewerDoc[0];

	const viewerBlocksProfile = viewerObjectId ? await isUserBlockedRelation(viewerObjectId, profileUser.id) : false;

	// No blocking logic - everyone can view everyone's profile
	// Blocked users can see blocker's profile and vice versa

	// Get followers and following lists using PostgreSQL
	const [followersListRaw, followingListRaw, followCounts] = await Promise.all([
		getFollowersList(profileUser.id, viewerObjectId),
		getFollowingList(profileUser.id, viewerObjectId),
		getFollowCounts(profileUser.id)
	]);

	// Transform snake_case to camelCase for followers and following lists
	const followersList = followersListRaw.map((user: any) => ({
		...user,
		avatar: user.avatar_url || '',
		isFollowing: user.is_following,
		isBlocked: user.is_blocked,
		followedAt: user.followed_at
	}));

	const followingList = followingListRaw.map((user: any) => ({
		...user,
		avatar: user.avatar_url || '',
		isFollowing: user.is_following,
		isBlocked: user.is_blocked,
		followedAt: user.followed_at
	}));

	const isFollowingMe = viewerObjectId ? await isFollowing(profileUser.id, viewerObjectId) : false;
	const isFollowingUser = viewerObjectId ? await isFollowing(viewerObjectId, profileUser.id) : false;

	const profileAvatar = profileUser.avatar_url || '';

	// Get user's articles (both authored and collaborated)
	// isModeratorOrAdmin and isOwnProfile are already declared above
	const isViewingOwnProfile = isOwnProfile;

	// Build queries for authored and collaborated articles
	const authoredFilters: any = {
		author_id: profileUser.id
	};

	const collaboratedFilters: any = {
		collaborator_id: profileUser.id
	};

	// Apply status filters based on viewer role
	if (isModeratorOrAdmin) {
		// Moderators and admins can see all articles regardless of status
		// No status filter needed
	} else if (isViewingOwnProfile) {
		// Users can see all their own articles (any status)
		// No status filter needed
	} else {
		// For other users' profiles, only show published articles (exclude drafts)
		authoredFilters.status = 'published';
		collaboratedFilters.status = 'published';
		authoredFilters.is_hidden = false;
		collaboratedFilters.is_hidden = false;
	}

	// Get both authored and collaborated articles (all articles, no limit)
	const [authoredArticles, collaboratedArticles] = await Promise.all([
		getArticles(authoredFilters),
		getArticles(collaboratedFilters)
	]);

	// Combine and deduplicate articles
	const allArticles = [...authoredArticles, ...collaboratedArticles];
	const uniqueArticles = allArticles.filter((article, index, self) => 
		index === self.findIndex((a) => a.id === article.id)
	);

	// Get user's preferred language from i18n settings or use default 'tr'
	const userLanguage = locals.locale || 'tr';

	// Return all language versions and let the client handle the language switching
	const processedArticles = await Promise.all(uniqueArticles.map(async (article: any) => {
		// Extract stats from metadata
		const stats = article.metadata?.stats || {};
		
		// Extract translations from JSONB
		const translations = article.translations || {};
		const translationKeys = Object.keys(translations);
		
		// Get the default language or first available translation
		const defaultLang = article.default_language || 'tr';
		const primaryTranslation = translations[defaultLang] || translations[translationKeys[0]] || {};
		
		// Extract title and content from translations or fallback to old fields
		const title = primaryTranslation.title || article.title || 'Başlıksız';
		const excerpt = primaryTranslation.excerpt || article.content?.substring(0, 200) || '';
		const content = primaryTranslation.content || article.content || '';
		
		// Calculate read time from content
		const readTime = calculateReadTime(content);
		
		// Get author information from the query result
		const authorId = article.author_id;
		const authorName = article.author_full_name 
			? `${article.author_full_name} ${article.author_surname || ''}`.trim()
			: article.author_name || article.author_nickname || 'Unknown';
		const authorAvatar = article.author_avatar || '';
		const authorNickname = article.author_nickname || article.author_name || '';
		
		// Process collaborators
		let collaborators: Array<{ id: string; name: string; nickname: string; avatar?: string }> = [];
		let collaboratorProfiles: Array<{
			id: string;
			name: string;
			surname?: string;
			nickname: string;
			avatar?: string;
			bio?: string;
			followersCount?: number;
			followingCount?: number;
		}> = [];

		if (article.collaborator_ids && Array.isArray(article.collaborator_ids) && article.collaborator_ids.length > 0) {
			// Get collaborator user data
			const collaboratorUsers = await getUsers({ id: { $in: article.collaborator_ids } });
			
			for (const collaboratorId of article.collaborator_ids) {
				const collaboratorUser = collaboratorUsers.find((u: any) => u.id === collaboratorId);
				if (collaboratorUser) {
					const collaboratorName = collaboratorUser.name 
						? `${collaboratorUser.name} ${collaboratorUser.surname || ''}`.trim() 
						: collaboratorUser.nickname || collaboratorUser.username || 'Unknown';
					
					collaborators.push({
						id: collaboratorUser.id,
						name: collaboratorName,
						nickname: collaboratorUser.nickname || collaboratorUser.username || '',
						avatar: collaboratorUser.avatar_url || ''
					});
					
					collaboratorProfiles.push({
						id: collaboratorUser.id,
						name: collaboratorUser.name || '',
						surname: collaboratorUser.surname || '',
						nickname: collaboratorUser.nickname || collaboratorUser.username || '',
						avatar: collaboratorUser.avatar_url || '',
						bio: collaboratorUser.bio || '',
						followersCount: collaboratorUser.followers_count || 0,
						followingCount: collaboratorUser.following_count || 0
					});
				}
			}
		}

		// Return the article with proper translation and collaborator data
		return {
			id: article.id,
			publishedAt: article.published_at || article.created_at,
			tags: article.tags || [],
			author: {
				id: authorId,
				name: authorName,
				nickname: authorNickname,
				avatar: authorAvatar
			},
			authorId: authorId,
			metadata: article.metadata || {},
			defaultLanguage: defaultLang,
			translations: translations,
			views: article.views || stats.views || 0,
			likes: article.likes_count || stats.likes || 0,
			comments: article.comments_count || stats.comments || 0,
			coverImage: article.thumbnail || article.cover_image || stats.thumbnail || '',
			title: title,
			excerpt: excerpt,
			slug: primaryTranslation.slug || article.id,
			language: defaultLang,
			content: content,
			availableLanguages: translationKeys,
			collaborators,
			collaboratorProfiles,
			readTime,
			status: article.status,
			category: article.category || '',
			subcategory: article.subcategory || ''
		};
	}));

	// Calculate total statistics
	const totalArticles = processedArticles.length;
	const totalViews = processedArticles.reduce((sum, article) => sum + (article.views || 0), 0);
	const totalLikes = processedArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
	const totalComments = processedArticles.reduce((sum, article) => sum + (article.comments || 0), 0);

	// isOwnProfile and isModeratorOrAdmin are already declared above

	// Get user badges
	const userBadges = await getUserBadges(profileUser.id);

	const sanitizedProfileUser = {
		id: profileUser.id,
		username: profileUser.username,
		name: profileUser.name,
		surname: profileUser.surname,
		bio: profileUser.bio,
		avatar_url: profileUser.avatar_url || '',
		preferences: profileUser.preferences || {},
		created_at: profileUser.created_at,
		updated_at: profileUser.updated_at,
		status: profileUser.status,
		email: profileUser.email,
		is_banned: profileUser.is_banned,
		ban_reason: profileUser.ban_reason,
		is_hidden: profileUser.is_hidden,
		phone_number: profileUser.phone_number || '',
		location: profileUser.location || '',
		matrix_username: profileUser.matrix_username || ''
	};

		return {
		profileUser: sanitizedProfileUser,
		userProfileData: {
			...sanitizedProfileUser,
			badges: userBadges
		},
		articles: processedArticles,
		stats: {
			totalArticles,
			totalViews,
			totalLikes,
			totalComments,
			joinDate: profileUser.created_at
		},
		isOwnProfile,
		currentUser: locals.user,
		isFollowingMe,
		isFollowingUser,
		followersList,
		followingList,
		viewerBlocksProfile,
		followCounts,

		// ⭐ Bu satır sayfanın param değişimini yeniden yükleme tetikler
		key: requestedNickname
	};
};
