import type { PageServerLoad } from './$types';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

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

export const load: PageServerLoad = async ({ locals }) => {
  const articlesCol = await getArticlesCollection();
  const usersCol = await getUsersCollection();
  const user = (locals as any)?.user ?? null;
  const viewerObjectId = user ? new ObjectId(user.id) : null;

  const viewerDoc = viewerObjectId
    ? await usersCol.findOne({ _id: viewerObjectId })
    : null;

  // Format following data to ensure consistent string IDs
  const formattedUser = viewerDoc ? {
    ...viewerDoc,
    _id: viewerDoc._id.toString(),
    blocked: Array.isArray(viewerDoc.blocked) 
      ? viewerDoc.blocked.map((block: any) => ({
          ...block,
          blockedUserId: block.blockedUserId?.toString?.() || block.blockedUserId
        }))
      : [],
    following: Array.isArray(viewerDoc.following) 
      ? viewerDoc.following.map((follow: any) => ({
          ...follow,
          followingUserId: follow.followingUserId?.toString?.() || follow.followingUserId
        }))
      : [],
    followers: Array.isArray(viewerDoc.followers) 
      ? viewerDoc.followers.map((follower: any) => ({
          ...follower,
          followerUserId: follower.followerUserId?.toString?.() || follower.followerUserId
        }))
      : []
  } : null;

  const viewerBlockedIds = new Set(
    Array.isArray(viewerDoc?.blocked)
      ? viewerDoc!.blocked
          .map((entry: any) => entry?.blockedUserId)
          .filter(Boolean)
          .map((id: any) => id.toString())
      : []
  );

  const blockedByDocs = viewerObjectId
    ? await usersCol
        .find({ 'blocked.blockedUserId': viewerObjectId }, { projection: { _id: 1 } })
        .toArray()
    : [];

  const blockedViewerIds = new Set(blockedByDocs.map((doc) => doc._id.toString()));

  const followingUserIds = Array.isArray(formattedUser?.following)
    ? formattedUser!.following
        .map((entry: any) => entry?.followingUserId)
        .filter(Boolean)
        .map((id: any) => id.toString())
    : [];

  const docs = await articlesCol
    .find({
      status: 'published',
      deletedAt: { $exists: false },
      $or: [
        { hidden: { $ne: true } },  // Diğer kullanıcıların gizli makaleleri
        { authorId: user ? new ObjectId(user.id) : null }  // Kullanıcının kendi gizli makaleleri
      ]
    })
    .sort({ publishedAt: -1 })
    .limit(30)
    .toArray();

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

  for (const a of docs) {
    const authorIdStr = a.authorId ? a.authorId.toString() : '';
    if (user && authorIdStr && (viewerBlockedIds.has(authorIdStr) || blockedViewerIds.has(authorIdStr))) {
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
        const title = trans?.title || '';
        const excerpt = trans?.excerpt || '';
        const slug = trans?.slug || '';
        const content = trans?.content;

        translations[langKey] = {
          title,
          excerpt,
          slug,
          language: trans?.language || langKey,
          content,
          readTime: calculateReadTime(content)
        };
      }
    }

    if (Object.keys(translations).length === 0) {
      const fallbackLanguage = a.language || a.defaultLanguage || 'tr';
      const title = a.title || '';
      const excerpt = a.excerpt || '';
      const slug = a.slug || '';
      const content = a.content;

      translations[fallbackLanguage] = {
        title,
        excerpt,
        slug,
        language: fallbackLanguage,
        content,
        readTime: calculateReadTime(content)
      };
    }

    const defaultLanguage = a.defaultLanguage || Object.keys(translations)[0] || 'tr';
    const displayLanguage = translations[defaultLanguage]
      ? defaultLanguage
      : Object.keys(translations)[0];

    const translation = displayLanguage ? translations[displayLanguage] : undefined;
    const title = translation?.title || a.title || '';
    const excerpt = translation?.excerpt || a.excerpt || '';
    const slug = translation?.slug || a.slug || '';
    const readTime = translation?.readTime || calculateReadTime(translation?.content);

    const publishedRaw = a.publishedAt || a.createdAt || new Date();
    const publishedAt = toIsoString(publishedRaw);

    // Yazar bilgilerini kullanıcı koleksiyonundan al
    let authorName = 'Unknown';
    let authorAvatar: string | undefined;
    let authorNickname: string | undefined;

    if (a.authorId) {
      try {
        const userDoc = await usersCol.findOne({ _id: new ObjectId(a.authorId) });
        if (userDoc) {
          // Önce isim soyisim kontrolü, sonra kullanıcı adı
          const fullName = `${userDoc.name || ''} ${userDoc.surname || ''}`.trim();
          authorName = fullName || userDoc.nickname || 'Unknown';
          authorAvatar = userDoc.avatar;
          authorNickname = userDoc.nickname;
        }
      } catch (error) {
        console.error('Error fetching author:', error);
      }
    } else if (a.authorName) {
      authorName = a.authorName;
    }

    items.push({
      id: a._id.toString(),
      slug,
      title,
      excerpt,
      author: { name: authorName, avatar: authorAvatar, nickname: authorNickname },
      authorId: authorIdStr,
      publishedAt,
      readTime,
      category: a.category || '',
      tags: a.tags || [],
      views: a.stats?.views || 0,
      comments: a.stats?.comments || 0,
      likes: a.stats?.likes || 0,
      dislikes: a.stats?.dislikes || 0,
      featured: a.featured || false,
      coverImage: a.thumbnail || undefined,
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
