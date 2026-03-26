// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getArticles, getUsers, getBlockedUsers, getFollows } from '$db/queries';

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

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = (locals as any)?.user ?? null;

  // Get viewer data
  let viewerDoc: any = null;
  if (user) {
    const userData = await getUsers({ id: user.id });
    viewerDoc = userData[0] || null;
  }

  // Format following data
  const formattedUser = viewerDoc ? {
    ...viewerDoc,
    id: viewerDoc.id,
    avatar: viewerDoc.avatar_url || '',
    bannerColor: viewerDoc.banner_color || '#0f172a',
    bannerImage: viewerDoc.banner_image || '',
    createdAt: viewerDoc.created_at,
    updatedAt: viewerDoc.updated_at
  } : null;

  // Get blocked users
  let viewerBlockedIds = new Set<string>();
  if (user) {
    const blockedData = await getBlockedUsers(user.id);
    if (blockedData && blockedData.blocked_actor_ids) {
      viewerBlockedIds = new Set(blockedData.blocked_actor_ids);
    }
  }

  // Get users who blocked the viewer
  let blockedViewerIds = new Set<string>();
  if (user) {
    // Query users who have blocked the current user
    const sql = `SELECT user_id FROM blocked_users WHERE $1 = ANY(blocked_actor_ids)`;
    // For now, we'll skip this as it requires a different query approach
  }

  // Get following user IDs
  let followingUserIds: string[] = [];
  if (user) {
    const follows = await getFollows({ follower_id: user.id });
    followingUserIds = follows.map((f: any) => f.following_id);
  }

  // Build filters based on user role
  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';
  const isAuthor = !!user?.id;

  let filters: any = {
    is_hidden: false,
    limit: 30,
    sort_by: 'published_at'
  };

  if (isModeratorOrAdmin) {
    // Moderators and admins can see all articles regardless of status
    filters.status = ['published', 'pending', 'draft'];
    delete filters.is_hidden; // They can see hidden articles too
  } else if (isAuthor) {
    // Authors can see their own articles (any status) and published articles from others
    // We need to get all and filter manually
    filters.status = 'published';
  } else {
    // Regular users only see published articles
    filters.status = 'published';
  }

  const docs = await getArticles(filters);

  // If user is author, also get their own articles
  let ownArticles: any[] = [];
  if (isAuthor && !isModeratorOrAdmin) {
    ownArticles = await getArticles({ author_id: user.id });
  }

  // Combine and deduplicate
  const allDocs = isAuthor && !isModeratorOrAdmin 
    ? [...docs, ...ownArticles.filter((a: any) => !docs.some((d: any) => d.id === a.id))]
    : docs;

  const items: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    author: { name: string; avatar?: string; nickname?: string };
    authorId?: string;
    publishedAt: string;
    readTime: number;
    category: string;
    tags: string[];
    views: number;
    comments: number;
    likes: number;
    featured?: boolean;
    coverImage?: string;
    dislikes?: number;
    status?: 'published' | 'pending' | 'draft';
    defaultLanguage: string;
    translations: Record<string, {
      title: string;
      excerpt: string;
      slug: string;
      language: string;
      content?: unknown;
      readTime: number;
    }>;
    availableLanguages: string[];
    subcategory?: string;
  }> = [];

  for (const a of allDocs) {
    const authorIdStr = a.author_id ? String(a.author_id) : '';
    if (user && authorIdStr && viewerBlockedIds.has(authorIdStr)) {
      continue;
    }

    const translations: Record<string, {
      title: string;
      excerpt: string;
      slug: string;
      language: string;
      content?: unknown;
      readTime: number;
    }> = {};

    if (a.translations && typeof a.translations === 'object') {
      for (const [langKey, trans] of Object.entries(a.translations)) {
        const t = trans as any;
        const title = t?.title || '';
        const excerpt = t?.excerpt || '';
        const slug = t?.slug || '';
        const content = t?.content;

        translations[langKey] = {
          title,
          excerpt,
          slug,
          language: t?.language || langKey,
          content,
          readTime: calculateReadTime(content)
        };
      }
    }

    if (Object.keys(translations).length === 0) {
      const fallbackLanguage = a.default_language || 'tr';
      translations[fallbackLanguage] = {
        title: '',
        excerpt: '',
        slug: '',
        language: fallbackLanguage,
        content: null,
        readTime: 1
      };
    }

    const defaultLanguage = a.default_language || Object.keys(translations)[0] || 'tr';
    const displayLanguage = translations[defaultLanguage]
      ? defaultLanguage
      : Object.keys(translations)[0];

    const translation = displayLanguage ? translations[displayLanguage] : undefined;
    const title = translation?.title || '';
    const excerpt = translation?.excerpt || '';
    const slug = translation?.slug || '';
    const readTime = translation?.readTime || calculateReadTime(translation?.content);

    const publishedRaw = a.published_at || a.created_at || new Date();
    const publishedAt = toIsoString(publishedRaw);

    // Author info is already joined
    const authorName = a.author_full_name 
      ? `${a.author_full_name} ${a.author_surname || ''}`.trim() 
      : a.author_nickname || a.author_username || 'Unknown';
    const authorAvatar = a.author_avatar;
    const authorNickname = a.author_nickname;

    items.push({
      id: a.id,
      slug,
      title,
      excerpt,
      author: { name: authorName, avatar: authorAvatar, nickname: authorNickname },
      authorId: authorIdStr,
      publishedAt,
      readTime,
      category: a.category || '',
      tags: a.tags || [],
      views: a.views || 0,
      comments: a.comments_count || 0,
      likes: a.likes_count || 0,
      dislikes: a.dislikes || 0,
      featured: false,
      coverImage: a.thumbnail || undefined,
      status: a.status,
      defaultLanguage,
      translations,
      availableLanguages: Object.keys(translations),
      subcategory: a.subcategory
    });
  }

  return {
    user: formattedUser,
    articles: items,
    categories: Array.from(new Set(items.map((item) => item.category).filter(Boolean))),
    popularTags: Array.from(new Set(items.flatMap((item) => item.tags || []))).slice(0, 50),
    availableLanguages: Array.from(new Set(items.flatMap((item) => item.availableLanguages || []))),
    followingUserIds
  };
};
