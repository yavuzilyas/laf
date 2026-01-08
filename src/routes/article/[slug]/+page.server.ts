// src/routes/article/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getArticlesCollection, getUsersCollection, toObjectId } from '$db/mongo';
import { ObjectId } from 'mongodb';
import { rm } from 'fs/promises';
import { resolve } from 'path';

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

// ... existing imports ...

export const load: PageServerLoad = async ({ params, locals }) => {
  const { slug } = params;
  const articles = await getArticlesCollection();
  const users = await getUsersCollection();
  const viewer = (locals as any)?.user ?? null;
  const viewerObjectId = viewer ? new ObjectId(viewer.id) : null;

  // Try finding by slug across known locales
  const localesToTry = ['en', 'tr', 'de', 'fr', 'es'];
  let article: any = null;
  let matchedLang: string | null = null;

  for (const lang of localesToTry) {
    // First, build the base query to find the article by slug and language
    const query: any = {
      [`translations.${lang}.slug`]: slug,
      deletedAt: { $exists: false }
    };

    // If user is not logged in, they can only see published articles
    if (!viewerObjectId) {
      query.status = 'published';
    } else {
      // For logged-in users, check their access level
      const isModeratorOrAdmin = viewer?.role === 'moderator' || viewer?.role === 'admin';
      
      if (isModeratorOrAdmin) {
        // Moderators and admins can see all articles regardless of status
        query.$or = [
          { status: 'published' },
          { status: 'pending' },
          { status: 'draft' }
        ];
      } else {
        // Regular users can see published articles and their own drafts/pending
        query.$or = [
          { status: 'published' },
          {
            $and: [
              { authorId: viewerObjectId },
              { $or: [{ status: 'draft' }, { status: 'pending' }] }
            ]
          }
        ];
      }
    }
    
    const found = await articles.findOne(query);
    if (found) {
      // If article is draft/pending and user is not the author or moderator/admin, skip to next language
      if ((found.status === 'draft' || found.status === 'pending')) {
        const isAuthor = viewerObjectId && found.authorId && found.authorId.equals(viewerObjectId);
        const isModeratorOrAdmin = viewer?.role === 'moderator' || viewer?.role === 'admin';
        
        if (!isAuthor && !isModeratorOrAdmin) {
          continue;
        }
      }
      
      article = found;
      matchedLang = lang;
      break;
    }
  }

  if (!article) {
    throw error(404, 'Article not found');
  }

  // Eğer makale gizlenmişse ve kullanıcı sahibi değilse erişim engelle
  if (article.hidden && (!locals.user || String(article.authorId) !== String(locals.user.id))) {
    throw redirect(303, '/403');
  }

  // Load viewer block lists
  let viewerBlockedIds = new Set<string>();
  if (viewerObjectId) {
    const viewerDoc = await users.findOne(
      { _id: viewerObjectId },
      { projection: { blocked: 1 } }
    );

    if (Array.isArray(viewerDoc?.blocked)) {
      viewerBlockedIds = new Set(
        viewerDoc.blocked
          .map((entry: any) => entry?.blockedUserId)
          .filter(Boolean)
          .map((id: any) => id.toString())
      );
    }
  }

  const authorIdStr = article.authorId ? String(article.authorId) : null;
  const viewerBlocksAuthor = viewer && authorIdStr ? viewerBlockedIds.has(authorIdStr) : false;

  let authorDoc: any = null;
  if (article.authorId) {
    try {
      authorDoc = await users.findOne({ _id: new ObjectId(article.authorId) });
    } catch (err) {
      console.error('Author lookup failed', err);
    }
  }

  const authorBlocksViewer = Boolean(
    viewerObjectId && authorDoc?.blocked?.some?.((entry: any) => {
      try {
        return entry?.blockedUserId && new ObjectId(entry.blockedUserId).equals(viewerObjectId);
      } catch {
        return false;
      }
    })
  );

  if (viewerBlocksAuthor || authorBlocksViewer) {
    throw error(403, 'Blocked user content');
  }

  // Increment views
  await articles.updateOne({ _id: article._id }, { $inc: { 'stats.views': 1 } });

  // Build available translations map
  const availableTranslations: Record<string, { slug: string; title: string }> = {};
  for (const [lang, tr] of Object.entries(article.translations || {})) {
    if (tr && typeof tr === 'object' && tr.slug) {
      availableTranslations[lang] = { slug: tr.slug, title: tr.title };
    }
  }

  // Flatten selected translation into top-level fields for the page
  const currentLang = matchedLang || article.defaultLanguage || Object.keys(availableTranslations)[0];
  const tr = article.translations[currentLang];

  // Load author as plain serializable object
  let author: { id: string; nickname?: string; name?: string; surname?: string } | null = null;
  if (article.authorId) {
    if (authorDoc) {
      author = {
        id: authorDoc._id.toString(),
        nickname: authorDoc.nickname,
        name: authorDoc.name,
        surname: authorDoc.surname
      };
    } else {
      author = { id: String(article.authorId) };
    }
  }

  // If we have an author, fetch their full profile data for the profile card
  let profileUser = null;
  let isFollowing = false;
  let isFollowingMe = false;
  let followersList = [];
  let followingList = [];
  let isOwnProfile = false;

  if (authorDoc) {
    const authorId = authorDoc._id;
    const viewerId = viewerObjectId;
    
    // Check if viewer is the author
    isOwnProfile = viewerId ? viewerId.equals(authorId) : false;

    // Get followers and following lists
    const followers = authorDoc.followers || [];
    const following = authorDoc.following || [];

    // Check if viewer follows the author
    isFollowing = viewerId && Array.isArray(followers) 
      ? followers.some((f: any) => f.followerUserId && f.followerUserId.toString() === viewerId.toString())
      : false;

    // Check if author follows the viewer
    isFollowingMe = viewerId && Array.isArray(following)
      ? following.some((f: any) => f.followingUserId && f.followingUserId.toString() === viewerId.toString())
      : false;

    // Prepare followers list
    if (Array.isArray(followers)) {
      followersList = await Promise.all(followers.slice(0, 10).map(async (f: any) => {
        if (!f.followerUserId) return null;
        
        const followerId = typeof f.followerUserId === 'object' 
          ? f.followerUserId.toString() 
          : String(f.followerUserId);
        
        const user = await users.findOne(
          { _id: new ObjectId(followerId) },
          { projection: { nickname: 1, name: 1, surname: 1, avatar: 1, bio: 1, followers: 1 } }
        );
        if (!user) return null;
        
        const userId = typeof user._id === 'object' ? user._id.toString() : String(user._id);
        
        // Check if viewer follows this follower
        const isViewerFollowing = viewerId && Array.isArray(user.followers) 
          ? user.followers.some((follow: any) => {
              const followId = follow.followerUserId 
                ? (typeof follow.followerUserId === 'object' 
                    ? follow.followerUserId.toString() 
                    : String(follow.followerUserId))
                : null;
              return followId === viewerId.toString();
            })
          : false;

        return {
          id: userId,
          nickname: user.nickname || '',
          name: user.name || '',
          surname: user.surname || '',
          avatar: typeof user.avatar === 'string' ? user.avatar : '',
          bio: user.bio || '',
          followedAt: f.followedAt instanceof Date ? f.followedAt.toISOString() : f.followedAt,
          isFollowing: isViewerFollowing,
          isBlocked: false
        };
      }));
      followersList = followersList.filter(Boolean);
    }

    // Prepare following list
    if (Array.isArray(following)) {
      followingList = await Promise.all(following.slice(0, 10).map(async (f: any) => {
        if (!f.followingUserId) return null;
        
        const followingId = typeof f.followingUserId === 'object' 
          ? f.followingUserId.toString() 
          : String(f.followingUserId);
        
        const user = await users.findOne(
          { _id: new ObjectId(followingId) },
          { projection: { nickname: 1, name: 1, surname: 1, avatar: 1, bio: 1, followers: 1 } }
        );
        if (!user) return null;
        
        const userId = typeof user._id === 'object' ? user._id.toString() : String(user._id);
        
        // Check if viewer follows this user
        const isViewerFollowing = viewerId && Array.isArray(user.followers) 
          ? user.followers.some((follow: any) => {
              const followId = follow.followerUserId 
                ? (typeof follow.followerUserId === 'object' 
                    ? follow.followerUserId.toString() 
                    : String(follow.followerUserId))
                : null;
              return followId === viewerId.toString();
            })
          : false;

        return {
          id: userId,
          nickname: user.nickname || '',
          name: user.name || '',
          surname: user.surname || '',
          avatar: typeof user.avatar === 'string' ? user.avatar : '',
          bio: user.bio || '',
          followedAt: f.followedAt instanceof Date ? f.followedAt.toISOString() : f.followedAt,
          isFollowing: isViewerFollowing,
          isBlocked: false
        };
      }));
      followingList = followingList.filter(Boolean);
    }

    // Prepare profile data for the ProfileCard
    const profileData = {
      name: authorDoc.name || '',
      surname: authorDoc.surname || '',
      nickname: authorDoc.nickname || '',
      bio: authorDoc.bio || '',
      avatar: typeof authorDoc.avatar === 'string' ? authorDoc.avatar : '',
      bannerColor: authorDoc.bannerColor || '#0f172a',
      bannerImage: typeof authorDoc.bannerImage === 'string' ? authorDoc.bannerImage : '',
      website: authorDoc.website || '',
      location: authorDoc.location || '',
      interests: Array.isArray(authorDoc.interests) ? authorDoc.interests : []
    };

    // Sanitize profile user data
    profileUser = {
      ...authorDoc,
      _id: authorDoc._id.toString(),
      avatar: typeof authorDoc.avatar === 'string' ? authorDoc.avatar : '',
      bannerColor: authorDoc.bannerColor || '#0f172a',
      bannerImage: typeof authorDoc.bannerImage === 'string' ? authorDoc.bannerImage : '',
      followers: sanitizeRelationEntries(authorDoc.followers, 'followerUserId', 'followedAt'),
      following: sanitizeRelationEntries(authorDoc.following, 'followingUserId', 'followedAt'),
      blocked: sanitizeRelationEntries(authorDoc.blocked, 'blockedUserId', 'blockedAt'),
      followersCount: Array.isArray(authorDoc.followers) ? authorDoc.followers.length : 0,
      followingCount: Array.isArray(authorDoc.following) ? authorDoc.following.length : 0,
      createdAt: authorDoc.createdAt instanceof Date ? authorDoc.createdAt.toISOString() : authorDoc.createdAt,
      updatedAt: authorDoc.updatedAt instanceof Date ? authorDoc.updatedAt.toISOString() : authorDoc.updatedAt,
      ...(authorDoc.moderationAction ? {
        moderationAction: {
          ...authorDoc.moderationAction,
          moderatorId: toSerializableId(authorDoc.moderationAction.moderatorId),
          timestamp: authorDoc.moderationAction.timestamp instanceof Date 
            ? authorDoc.moderationAction.timestamp.toISOString() 
            : authorDoc.moderationAction.timestamp
        }
      } : {})
    };
    
    // Ensure all ObjectIds are converted to strings
    if (profileUser._id && typeof profileUser._id !== 'string') {
      profileUser._id = profileUser._id.toString();
    }
  }

  // Calculate article statistics
  const articlesCollection = await getArticlesCollection();
  const userArticles = await articlesCollection
    .find({
      'authorId': article.authorId,
      'status': 'published',
      'deletedAt': { $exists: false }
    })
    .toArray();

  const totalArticles = userArticles.length;
  const totalViews = userArticles.reduce((sum, a) => sum + ((a.stats?.views) || 0), 0);
  const totalLikes = userArticles.reduce((sum, a) => sum + ((a.stats?.likes) || 0), 0);
  const totalComments = userArticles.reduce((sum, a) => sum + ((a.stats?.comments) || 0), 0);

  // Create a serializable article object
  const serializedArticle = {
    _id: article._id.toString(),
    language: currentLang,
    title: tr?.title ?? '',
    excerpt: tr?.excerpt ?? '',
    content: tr?.content ?? '',
    thumbnail: article.thumbnail || '',
    category: article.category,
    subcategory: article.subcategory,
    status: article.status,
    tags: Array.isArray(article.tags) ? [...article.tags] : [],
    stats: {
      views: article.stats?.views || 0,
      likes: article.stats?.likes || 0,
      comments: article.stats?.comments || 0,
      dislikes: article.stats?.dislikes || 0
    },
    author,
    authorId: article.authorId ? String(article.authorId) : undefined,
    createdAt: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
    updatedAt: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    availableTranslations
  };

  // Create a safe profile user object
  const safeProfileUser = profileUser ? {
    ...profileUser,
    _id: profileUser._id ? String(profileUser._id) : undefined,
    moderationAction: profileUser.moderationAction ? {
      ...profileUser.moderationAction,
      moderatorId: toSerializableId(profileUser.moderationAction.moderatorId),
      timestamp: profileUser.moderationAction.timestamp instanceof Date 
        ? profileUser.moderationAction.timestamp.toISOString()
        : profileUser.moderationAction.timestamp
    } : undefined
  } : null;

  // Create safe current user object
  const safeCurrentUser = locals.user ? {
    id: locals.user.id ? String(locals.user.id) : undefined,
    role: locals.user.role,
    nickname: locals.user.nickname,
    email: locals.user.email,
    name: locals.user.name,
    surname: locals.user.surname
  } : null;

  return {
    article: serializedArticle,
    profileUser: safeProfileUser,
    isFollowing,
    isFollowingMe,
    followersList: Array.isArray(followersList) ? followersList : [],
    followingList: Array.isArray(followingList) ? followingList : [],
    isOwnProfile: Boolean(isOwnProfile),
    currentUser: safeCurrentUser,
    stats: {
      totalArticles: Number(totalArticles) || 0,
      totalViews: Number(totalViews) || 0,
      totalLikes: Number(totalLikes) || 0,
      totalComments: Number(totalComments) || 0,
      joinDate: authorDoc?.createdAt 
        ? new Date(authorDoc.createdAt).toISOString() 
        : new Date().toISOString()
    }
  };
};
