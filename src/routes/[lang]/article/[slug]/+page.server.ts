// src/routes/article/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getArticleBySlug, getArticleById, getArticles, incrementArticleViews, getUsers, getBlockedUsers, getFollows, getSimilarArticles } from '$db/queries';

const toSerializableId = (value: unknown) => {
  if (!value) return value;
  if (typeof value === 'string') return value;
  return String(value);
};

// All available languages for translation
const ALL_LANGUAGES = ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'pt', 'it', 'nl', 'pl', 'sv', 'ko', 'hi', 'vi', 'th', 'id', 'cs', 'hu', 'ro', 'el', 'he', 'uk', 'da', 'fi', 'no', 'sk', 'bg', 'hr', 'sr', 'sl', 'lt', 'lv', 'et', 'mt', 'ga', 'is', 'lb', 'mk', 'mn', 'ka', 'az', 'hy', 'bn', 'ur', 'ta', 'te', 'ml', 'kn', 'mr', 'gu', 'pa', 'ne', 'si', 'my', 'km', 'lo', 'tl', 'jv', 'su', 'ms', 'sw', 'am', 'so', 'af', 'zu', 'xh', 'sn', 'st', 'sq', 'be', 'tg', 'uz', 'kk', 'ky', 'mo', 'lu', 'wo', 'yo', 'ig', 'ha', 'ff', 'bm', 'bo', 'dz', 'ii', 'ug', 'yi', 'iw', 'ji', 'in', 'sh', 'mo', 'mo'];

// Filter translations based on user role and translation status
async function filterTranslationsByRole(
  article: any, 
  viewer: any
): Promise<Record<string, any>> {
  const translations = article.translations || {};
  const filteredTranslations: Record<string, any> = {};
  
  // Determine user role
  const isAdmin = viewer?.role === 'admin';
  const isModerator = viewer?.role === 'moderator';
  const isAuthor = viewer?.id === article.author_id;
  const isPrivileged = isAdmin || isModerator || isAuthor;
  
  for (const [lang, translation] of Object.entries(translations)) {
    // Default language is always visible
    if (lang === article.default_language) {
      filteredTranslations[lang] = translation;
      continue;
    }
    
    // If translation exists but has no content, skip
    if (!translation || !(translation as any).title) {
      continue;
    }
    
    // For privileged users, show all translations
    if (isPrivileged) {
      filteredTranslations[lang] = translation;
      continue;
    }
    
    // For public users, only show approved translations
    // Check if there's an approved translation status
    const { isTranslationApproved } = await import('$db/queries-translation-status');
    const isApproved = await isTranslationApproved(article.id, lang);
    
    if (isApproved) {
      filteredTranslations[lang] = translation;
    }
  }
  
  return filteredTranslations;
}

// Check if article has any translations (default + at least 1 other)
function isFullyTranslated(article: any): boolean {
  const translations = article.translations || {};
  const availableLangs = Object.keys(translations).filter(
    lang => translations[lang] && translations[lang].title
  );
  
  const defaultLang = article.default_language || 'tr';
  const hasDefault = availableLangs.includes(defaultLang);
  
  // If has default language AND at least 1 other translation, hide translate button
  const otherLangs = availableLangs.filter(lang => lang !== defaultLang);
  
  return hasDefault && otherLangs.length >= 1;
}

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

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  const { slug } = params;
  const viewer = (locals as any)?.user ?? null;

  // Try finding by slug across known locales
  const localesToTry = ['en', 'tr', 'de', 'fr', 'es'];
  let article: any = null;
  let matchedLang: string | null = null;

  for (const lang of localesToTry) {
    // Determine access level for this user
    const isModeratorOrAdmin = viewer?.role === 'moderator' || viewer?.role === 'admin';
    
    // Try to find article by slug and language
    const found = await getArticleBySlug(slug, lang, { 
      includeHidden: isModeratorOrAdmin || (viewer && viewer.id),
      includeDeleted: false
    });
    
    if (!found) continue;
    
    // Check access permissions
    if (!viewer) {
      // Non-logged in users can only see published articles
      if (found.status !== 'published') continue;
    } else if (!isModeratorOrAdmin) {
      // Regular users can see published articles and their own drafts/pending
      const isAuthor = viewer.id === found.author_id;
      const isCollaborator = found.collaborators?.includes(viewer.id);
      if (found.status !== 'published' && !isAuthor && !isCollaborator) continue;
    }
    
    article = found;
    matchedLang = lang;
    break;
  }

  if (!article) {
    throw error(404, 'Article not found');
  }

  // Eğer makale gizlenmişse ve kullanıcı sahibi veya moderatör/admin değilse erişim engelle
  const isModeratorOrAdmin = viewer?.role === 'moderator' || viewer?.role === 'admin';
  if (article.is_hidden && (!viewer || (String(article.author_id) !== String(viewer.id) && !isModeratorOrAdmin))) {
    throw redirect(303, '/403');
  }

  // Load viewer block lists
  let viewerBlockedIds = new Set<string>();
  const viewerId = viewer?.id;
  if (viewer) {
    const blockedData = await getBlockedUsers(viewer.id);
    if (blockedData && blockedData.blocked_actor_ids) {
      viewerBlockedIds = new Set(blockedData.blocked_actor_ids);
    }
  }

  const authorIdStr = article.author_id ? String(article.author_id) : null;
  const viewerBlocksAuthor = viewer && authorIdStr ? viewerBlockedIds.has(authorIdStr) : false;

  // Load author data
  let authorDoc: any = null;
  if (article.author_id) {
    const authorData = await getUsers({ id: article.author_id });
    authorDoc = authorData[0] || null;
  }

  // Check if author blocks viewer
  let authorBlocksViewer = false;
  if (viewer && authorDoc) {
    const authorBlockedData = await getBlockedUsers(article.author_id);
    if (authorBlockedData && authorBlockedData.blocked_actor_ids) {
      authorBlocksViewer = authorBlockedData.blocked_actor_ids.includes(viewer.id);
    }
  }

  if (viewerBlocksAuthor || authorBlocksViewer) {
    throw error(403, 'Blocked user content');
  }

  // Increment views only if user hasn't viewed this article recently (track via cookie)
  const viewedArticlesKey = 'viewed_articles';
  const viewedArticles = cookies.get(viewedArticlesKey);
  const viewedSet = new Set(viewedArticles ? JSON.parse(viewedArticles) : []);
  
  if (!viewedSet.has(article.id)) {
    await incrementArticleViews(article.id);
    viewedSet.add(article.id);
    cookies.set(viewedArticlesKey, JSON.stringify([...viewedSet]), {
      path: '/',
      maxAge: 60 * 10, // 10 minutes
      httpOnly: true,
      sameSite: 'strict'
    });
  }

  // Filter translations based on user role (admin/moderator/author see all, public sees only approved)
  const filteredTranslations = await filterTranslationsByRole(article, viewer);
  
  // Check if article is fully translated (for hiding translate button)
  const fullyTranslated = isFullyTranslated(article);

  // Build available translations map (only show approved translations to public)
  const availableTranslations: Record<string, { slug: string; title: string }> = {};
  for (const [lang, tr] of Object.entries(filteredTranslations)) {
    if (tr && typeof tr === 'object' && (tr as any).slug) {
      availableTranslations[lang] = { slug: (tr as any).slug, title: (tr as any).title };
    }
  }

  // Flatten selected translation into top-level fields for the page
  const currentLang = matchedLang || article.default_language || Object.keys(availableTranslations)[0];
  const tr = filteredTranslations[currentLang] || {};

  // Load author as plain serializable object
  let author: { id: string; nickname?: string; name?: string; surname?: string; avatar?: string } | null = null;
  if (article.author_id) {
    if (authorDoc) {
      author = {
        id: authorDoc.id,
        nickname: authorDoc.nickname || authorDoc.username || '',
        name: authorDoc.name || authorDoc.username || '',
        surname: authorDoc.surname || '',
        avatar: authorDoc.avatar_url || ''
      };
    } else {
      author = { 
        id: String(article.author_id),
        nickname: '',
        name: 'Unknown User',
        surname: '',
        avatar: ''
      };
    }
  }

  // If we have an author, fetch their full profile data for the profile card
  let profileUser = null;
  let isFollowing = false;
  let isFollowingMe = false;
  let followersList: any[] = [];
  let followingList: any[] = [];
  let isOwnProfile = false;

  if (authorDoc) {
    const authorId = authorDoc.id;
    const viewerId = viewer?.id;
    
    
    // Check if viewer is the author
    isOwnProfile = viewerId ? viewerId === authorId : false;

    // Get followers and following from follows table
    const followers = await getFollows({ following_id: authorId });
    const following = await getFollows({ follower_id: authorId });

    // Check if viewer follows the author
    isFollowing = viewerId && followers.some((f: any) => f.follower_id === viewerId);

    // Check if author follows the viewer
    isFollowingMe = viewerId && following.some((f: any) => f.following_id === viewerId);

    // Prepare followers list
    followersList = await Promise.all(followers.slice(0, 10).map(async (f: any) => {
      const followerData = await getUsers({ id: f.follower_id });
      const user = followerData[0];
      if (!user) return null;
      
      // Check if viewer follows this follower
      const followerFollowers = await getFollows({ following_id: user.id });
      const isViewerFollowing = viewerId && followerFollowers.some((follow: any) => follow.follower_id === viewerId);

      return {
        id: user.id,
        username: user.username || user.nickname || '',
        nickname: user.nickname || '',
        name: user.name || '',
        surname: user.surname || '',
        avatar: user.avatar_url || '',
        bio: user.bio || '',
        followedAt: f.created_at instanceof Date ? f.created_at.toISOString() : f.created_at,
        isFollowing: isViewerFollowing,
        isBlocked: false
      };
    }));
    followersList = followersList.filter(Boolean);

    // Prepare following list
    followingList = await Promise.all(following.slice(0, 10).map(async (f: any) => {
      const followingData = await getUsers({ id: f.following_id });
      const user = followingData[0];
      if (!user) return null;
      
      // Check if viewer follows this user
      const followingFollowers = await getFollows({ following_id: user.id });
      const isViewerFollowing = viewerId && followingFollowers.some((follow: any) => follow.follower_id === viewerId);

      return {
        id: user.id,
        username: user.username || user.nickname || '',
        nickname: user.nickname || '',
        name: user.name || '',
        surname: user.surname || '',
        avatar: user.avatar_url || '',
        bio: user.bio || '',
        followedAt: f.created_at instanceof Date ? f.created_at.toISOString() : f.created_at,
        isFollowing: isViewerFollowing,
        isBlocked: false
      };
    }));
    followingList = followingList.filter(Boolean);

    // Prepare profile data for the ProfileCard
    profileUser = {
      ...authorDoc,
      id: authorDoc.id,
      username: authorDoc.username || authorDoc.nickname || '',
      nickname: authorDoc.nickname || '',
      name: authorDoc.name || '',
      surname: authorDoc.surname || '',
      avatar: authorDoc.avatar_url || '',
      bannerColor: authorDoc.preferences?.bannerColor || authorDoc.banner_color || '#0f172a',
      bannerImage: authorDoc.preferences?.bannerImage || authorDoc.banner_image || '',
      is_hidden: authorDoc.is_hidden || false,
      followers: followers.map((f: any) => ({
        followerUserId: f.follower_id,
        followedAt: f.created_at
      })),
      following: following.map((f: any) => ({
        followingUserId: f.following_id,
        followedAt: f.created_at
      })),
      blocked: [],
      followersCount: followers.length,
      followingCount: following.length,
      createdAt: authorDoc.created_at instanceof Date ? authorDoc.created_at.toISOString() : authorDoc.created_at,
      updatedAt: authorDoc.updated_at instanceof Date ? authorDoc.updated_at.toISOString() : authorDoc.updated_at
    };
  }

  // Calculate article statistics
  const userArticles = await getArticles({
    author_id: article.author_id,
    status: 'published'
  });

  const totalArticles = userArticles.length;
  const totalViews = userArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalLikes = userArticles.reduce((sum, a) => sum + (a.likes_count || 0), 0);
  const totalComments = userArticles.reduce((sum, a) => sum + (a.comments_count || 0), 0);

  // Determine edit permissions
  const isAuthor = viewer?.id === article.author_id;
  const isCollaborator = article.collaborators?.includes(viewer?.id);
  const isAdmin = viewer?.role === 'admin';
  const isModerator = viewer?.role === 'moderator';
  
  // Authors and collaborators can edit their own articles
  let canEdit = isAuthor || isCollaborator;
  let canFullEdit = canEdit;
  
  // Admins can edit all articles
  if (isAdmin) {
    canEdit = true;
    canFullEdit = true;
  }
  // Moderators can only edit articles where author is a regular user
  else if (isModerator) {
    const authorData = await getUsers({ id: article.author_id });
    const authorRole = authorData[0]?.role || 'user';
    // Moderators can only edit user articles, not other moderators' or admins' articles
    if (authorRole === 'user') {
      canEdit = true;
      canFullEdit = true;
    }
  }

  // Load collaborator data if any
  let collaborators: Array<{ id: string; username: string; name?: string; surname?: string }> = [];
  let collaboratorProfiles: any[] = [];
  if (article.collaborators && Array.isArray(article.collaborators) && article.collaborators.length > 0) {
    const collaboratorUsers = await getUsers({ id: { $in: article.collaborators } });
    collaborators = collaboratorUsers.map(user => ({
      id: user.id,
      username: user.username || user.nickname || '',
      name: user.name || '',
      surname: user.surname || ''
    }));

    // Get profile data for each collaborator
    for (const collaborator of collaboratorUsers) {
      const collaboratorArticles = await getArticles({
        author_id: collaborator.id,
        status: 'published'
      });

      const totalArticles = collaboratorArticles.length;
      const totalViews = collaboratorArticles.reduce((sum: number, a: any) => sum + (a.views || 0), 0);
      const totalLikes = collaboratorArticles.reduce((sum: number, a: any) => sum + (a.likes_count || 0), 0);
      const totalComments = collaboratorArticles.reduce((sum: number, a: any) => sum + (a.comments_count || 0), 0);

      // Get followers and following counts for collaborator
      const collaboratorFollowers = await getFollows({ following_id: collaborator.id });
      const collaboratorFollowing = await getFollows({ follower_id: collaborator.id });

      // Prepare followers list for collaborator
      const collaboratorFollowersList = await Promise.all(collaboratorFollowers.slice(0, 10).map(async (f: any) => {
        const followerData = await getUsers({ id: f.follower_id });
        const user = followerData[0];
        if (!user) return null;
        
        const followerFollowers = await getFollows({ following_id: user.id });
        const isViewerFollowing = viewerId && followerFollowers.some((follow: any) => follow.follower_id === viewerId);

        return {
          id: user.id,
          username: user.username || user.nickname || '',
          nickname: user.nickname || '',
          name: user.name || '',
          surname: user.surname || '',
          avatar: user.avatar_url || '',
          bio: user.bio || '',
          followedAt: f.created_at instanceof Date ? f.created_at.toISOString() : f.created_at,
          isFollowing: isViewerFollowing,
          isBlocked: false
        };
      }));

      // Prepare following list for collaborator
      const collaboratorFollowingList = await Promise.all(collaboratorFollowing.slice(0, 10).map(async (f: any) => {
        const followingData = await getUsers({ id: f.following_id });
        const user = followingData[0];
        if (!user) return null;
        
        const followingFollowers = await getFollows({ following_id: user.id });
        const isViewerFollowing = viewerId && followingFollowers.some((follow: any) => follow.follower_id === viewerId);

        return {
          id: user.id,
          username: user.username || user.nickname || '',
          nickname: user.nickname || '',
          name: user.name || '',
          surname: user.surname || '',
          avatar: user.avatar_url || '',
          bio: user.bio || '',
          followedAt: f.created_at instanceof Date ? f.created_at.toISOString() : f.created_at,
          isFollowing: isViewerFollowing,
          isBlocked: false
        };
      }));

      collaboratorProfiles.push({
        ...collaborator,
        id: collaborator.id,
        username: collaborator.username || collaborator.nickname || '',
        name: collaborator.name || '',
        surname: collaborator.surname || '',
        nickname: collaborator.nickname || collaborator.username || '',
        avatar: collaborator.avatar_url || '',
        bannerColor: collaborator.preferences?.bannerColor || collaborator.banner_color || '#0f172a',
        bannerImage: collaborator.preferences?.bannerImage || collaborator.banner_image || '',
        is_hidden: collaborator.is_hidden || false,
        followersList: collaboratorFollowersList.filter(Boolean),
        followingList: collaboratorFollowingList.filter(Boolean),
        blocked: [],
        followersCount: collaboratorFollowers.length,
        followingCount: collaboratorFollowing.length,
        createdAt: collaborator.created_at instanceof Date ? collaborator.created_at.toISOString() : collaborator.created_at,
        updatedAt: collaborator.updated_at instanceof Date ? collaborator.updated_at.toISOString() : collaborator.updated_at,
        stats: {
          totalArticles: Number(totalArticles) || 0,
          totalViews: Number(totalViews) || 0,
          totalLikes: Number(totalLikes) || 0,
          totalComments: Number(totalComments) || 0
        }
      });
    }
  }

  // Load similar articles based on category and tags
  const similarArticles = await getSimilarArticles(
    article.id,
    article.category,
    article.tags || [],
    3,
    currentLang
  );

  // Create a serializable article object
  const serializedArticle = {
    _id: article.id,
    id: article.id,
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
      views: article.views || 0,
      likes: article.likes_count || 0,
      comments: article.comments_count || 0,
      dislikes: article.dislikes || 0
    },
    author,
    authorId: article.author_id ? String(article.author_id) : undefined,
    createdAt: article.created_at ? new Date(article.created_at).toISOString() : undefined,
    updatedAt: article.updated_at ? new Date(article.updated_at).toISOString() : undefined,
    publishedAt: article.published_at ? new Date(article.published_at).toISOString() : undefined,
    availableTranslations,
    fullyTranslated
  };

  // Create a safe profile user object
  const safeProfileUser = profileUser ? {
    ...profileUser,
    id: profileUser.id ? String(profileUser.id) : undefined
  } : null;

  // Create safe current user object
  const safeCurrentUser = viewer ? {
    id: viewer.id ? String(viewer.id) : undefined,
    role: viewer.role,
    nickname: viewer.nickname,
    email: viewer.email,
    name: viewer.name,
    surname: viewer.surname
  } : null;

  return {
    article: serializedArticle,
    similarArticles,
    collaborators,
    collaboratorProfiles,
    profileUser: safeProfileUser,
    isFollowing,
    isFollowingMe,
    followersList: Array.isArray(followersList) ? followersList : [],
    followingList: Array.isArray(followingList) ? followingList : [],
    isOwnProfile: Boolean(isOwnProfile),
    currentUser: safeCurrentUser,
    canEdit,
    canFullEdit,
    stats: {
      totalArticles: Number(totalArticles) || 0,
      totalViews: Number(totalViews) || 0,
      totalLikes: Number(totalLikes) || 0,
      totalComments: Number(totalComments) || 0,
      joinDate: authorDoc?.created_at 
        ? new Date(authorDoc.created_at).toISOString() 
        : new Date().toISOString()
    }
  };
};
