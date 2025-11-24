import type { PageServerLoad } from './$types';
import { getUsersCollection, getArticlesCollection, toObjectId } from '$db/mongo';
import { error } from '@sveltejs/kit';
import { slugify } from '$lib/utils/slugify';

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

export const load: PageServerLoad = async ({ params, locals }) => {
	const requestedNickname = slugify(params.nickname);
	
	// Get user data from database
	const users = await getUsersCollection();
	const profileUser = await users.findOne(
		{ nickname: requestedNickname },
		{ 
			projection: { 
				password: 0,
				mnemonicHashes: 0
			} 
		}
	);

	if (!profileUser) {
		throw error(404, 'User not found');
	}

	const viewerId = locals.user?._id || locals.user?.id;
	const viewerObjectId = viewerId ? toObjectId(viewerId) : null;

	const viewerDoc = viewerObjectId
		? await users.findOne({ _id: viewerObjectId }, { projection: { blocked: 1 } })
		: null;

	const viewerBlocksProfile = !!(viewerObjectId && viewerDoc?.blocked?.some?.((entry: any) => {
		try {
			return entry?.blockedUserId && toObjectId(entry.blockedUserId).equals(profileUser._id);
		} catch {
			return false;
		}
	}));

	// No blocking logic - everyone can view everyone's profile
	// Blocked users can see blocker's profile and vice versa

	const followerEntries = Array.isArray(profileUser.followers) ? profileUser.followers : [];
	const followingEntries = Array.isArray(profileUser.following) ? profileUser.following : [];

	const followerIds = followerEntries
		.map((entry) => entry?.followerUserId)
		.filter(Boolean)
		.map((id) => toObjectId(id));

	const followingIds = followingEntries
		.map((entry) => entry?.followingUserId)
		.filter(Boolean)
		.map((id) => toObjectId(id));

	const followersData = followerIds.length
		? await users
			.find({ _id: { $in: followerIds } }, {
				projection: {
					nickname: 1,
					name: 1,
					surname: 1,
					avatar: 1,
					bio: 1
				}
			})
			.toArray()
		: [];

	const followingData = followingIds.length
		? await users
			.find({ _id: { $in: followingIds } }, {
				projection: {
					nickname: 1,
					name: 1,
					surname: 1,
					avatar: 1,
					bio: 1
				}
			})
			.toArray()
		: [];

	const followersMap = new Map(followersData.map((user) => [user._id.toString(), user]));
	const followingMap = new Map(followingData.map((user) => [user._id.toString(), user]));

	const followersList = followerEntries
		.map((entry) => {
			if (!entry?.followerUserId) return null;
			const user = followersMap.get(toObjectId(entry.followerUserId).toString());
			if (!user) return null;
			
			// Check if current user is following this follower
			const isFollowing = viewerObjectId && followingEntries?.some((followEntry) => 
				followEntry?.followingUserId && 
				toObjectId(followEntry.followingUserId).equals(toObjectId(user._id))
			);
			
			// Check if current user has blocked this follower
			const isBlocked = viewerDoc?.blocked?.some((entry: any) => {
				try {
					return entry?.blockedUserId && toObjectId(entry.blockedUserId).equals(toObjectId(user._id));
				} catch {
					return false;
				}
			});
			
			return {
				id: user._id.toString(),
				nickname: user.nickname,
				name: user.name,
				surname: user.surname,
				avatar: typeof user.avatar === 'string' ? user.avatar : '',
				bio: user.bio || '',
				followedAt: entry.followedAt instanceof Date ? entry.followedAt.toISOString() : entry.followedAt,
				isFollowing: !!isFollowing,
				isBlocked: !!isBlocked
			};
		})
		.filter(Boolean);

	const followingList = followingEntries
		.map((entry) => {
			if (!entry?.followingUserId) return null;
			const user = followingMap.get(toObjectId(entry.followingUserId).toString());
			if (!user) return null;
			
			// Check if current user has blocked this following user
			const isBlocked = viewerDoc?.blocked?.some((entry: any) => {
				try {
					return entry?.blockedUserId && toObjectId(entry.blockedUserId).equals(toObjectId(user._id));
				} catch {
					return false;
				}
			});
			
			return {
				id: user._id.toString(),
				nickname: user.nickname,
				name: user.name,
				surname: user.surname,
				avatar: typeof user.avatar === 'string' ? user.avatar : '',
				bio: user.bio || '',
				followedAt: entry.followedAt instanceof Date ? entry.followedAt.toISOString() : entry.followedAt,
				isFollowing: true,  // All users in following list are already followed
				isBlocked: !!isBlocked
			};
		})
		.filter(Boolean);

	const isFollowingMe = !!(viewerObjectId && followingEntries?.some((entry) => {
		if (!entry?.followingUserId) return false;
		try {
			return toObjectId(entry.followingUserId).equals(viewerObjectId);
		} catch {
			return false;
		}
	}));

	const profileAvatar = typeof profileUser.avatar === 'string' && profileUser.avatar.trim().length
		? profileUser.avatar
		: '';

	const profileBannerColor = typeof profileUser.bannerColor === 'string' && profileUser.bannerColor.trim().length
		? profileUser.bannerColor
		: '#0f172a';

	const profileBannerImage = typeof profileUser.bannerImage === 'string' && profileUser.bannerImage.trim().length
		? profileUser.bannerImage
		: '';

	// Get user's articles
	const articlesCollection = await getArticlesCollection();
	const userArticles = await articlesCollection
		.find({
			'authorId': toObjectId(profileUser._id),
			'status': 'published',
			'deletedAt': { $exists: false }
		})
		.sort({ publishedAt: -1 })
		.limit(10)
		.toArray();

	// Get user's preferred language from i18n settings or use default 'tr'
	const userLanguage = locals.locale || 'tr';

	// Return all language versions and let the client handle the language switching
	const processedArticles = userArticles.flatMap((article: Article) => {
		const baseArticle = {
			id: article._id.toString(),
			publishedAt: article.publishedAt || article.createdAt,
			category: article.category,
			subcategory: article.subcategory,
			tags: article.tags || [],
			views: article.stats?.views || 0,
			likes: article.stats?.likes || 0,
			comments: article.stats?.comments || 0,
			author: {
				id: profileUser._id.toString(),
				name: profileUser.name,
				surname: profileUser.surname,
				nickname: profileUser.nickname,
				avatar: profileAvatar
			},
			thumbnail: article.thumbnail || '',
			defaultLanguage: article.defaultLanguage || 'tr',
			translations: {}
		};

		if (article.translations) {
			// For multi-language articles, include all translations
			return [{
				...baseArticle,
				translations: Object.entries(article.translations).reduce((acc, [lang, trans]) => ({
					...acc,
					[lang]: {
						title: trans.title || 'Başlıksız',
						excerpt: trans.excerpt || '',
						slug: trans.slug || article.slug,
						language: trans.language || lang,
						content: trans.content
					}
				}), {})
			}];
		}

		// For backward compatibility with single-language articles
		return [{
			...baseArticle,
			title: article.title || 'Başlıksız',
			excerpt: article.excerpt || '',
			slug: article.slug,
			language: article.language || 'tr',
			translations: {
				[article.language || 'tr']: {
					title: article.title || 'Başlıksız',
					excerpt: article.excerpt || '',
					slug: article.slug,
					language: article.language || 'tr',
					content: article.content
				}
			}
		}];
	});

	// Calculate total statistics
	const totalArticles = processedArticles.length;
	const totalViews = processedArticles.reduce((sum, article) => sum + (article.views || 0), 0);
	const totalLikes = processedArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
	const totalComments = processedArticles.reduce((sum, article) => sum + (article.comments || 0), 0);

	// Check if viewing own profile
	const isOwnProfile = locals.user && profileUser._id && 
	    (locals.user._id?.toString() === profileUser._id.toString() || 
	     locals.user.nickname?.toLowerCase() === profileUser.nickname?.toLowerCase());

	const sanitizedProfileUser = {
		...profileUser,
		_id: profileUser._id.toString(),
		avatar: profileAvatar,
		bannerColor: profileBannerColor,
		bannerImage: profileBannerImage,
		followers: sanitizeRelationEntries(profileUser.followers, 'followerUserId', 'followedAt'),
		following: sanitizeRelationEntries(profileUser.following, 'followingUserId', 'followedAt'),
		blocked: sanitizeRelationEntries(profileUser.blocked, 'blockedUserId', 'blockedAt'),
		followersCount: Array.isArray(profileUser.followers)
			? profileUser.followers.length
			: profileUser.followersCount || 0,
		followingCount: Array.isArray(profileUser.following)
			? profileUser.following.length
			: profileUser.followingCount || 0,
		createdAt: profileUser.createdAt instanceof Date
			? profileUser.createdAt.toISOString()
			: profileUser.createdAt,
		updatedAt: profileUser.updatedAt instanceof Date
			? profileUser.updatedAt.toISOString()
			: profileUser.updatedAt
	};

		return {
		profileUser: sanitizedProfileUser,
		articles: processedArticles,
		stats: {
			totalArticles,
			totalViews,
			totalLikes,
			totalComments,
			joinDate: profileUser.createdAt
		},
		isOwnProfile,
		currentUser: locals.user,
		isFollowingMe,
		followersList,
		followingList,
		viewerBlocksProfile,

		// ⭐ Bu satır sayfanın param değişimini yeniden yükleme tetikler
		key: requestedNickname
	};
};


