import type { PageServerLoad } from './$types';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';

export const load: PageServerLoad = async ({ locals }) => {
  const articlesCol = await getArticlesCollection();
  const user = (locals as any)?.user ?? null;

  const docs = await articlesCol
    .find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(30)
    .toArray();

  const items = [] as Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    author: { name: string; avatar?: string };
    publishedAt: string;
    readTime: number;
    category: string;
    tags: string[];
    views: number;
    comments: number;
    likes: number;
    featured?: boolean;
    coverImage?: string;
  }>;

  for (const a of docs) {
    const lang = a.defaultLanguage || Object.keys(a.translations || {})[0];
    const tr = a.translations?.[lang] || {};
    const title = tr.title || '';
    const excerpt = tr.excerpt || '';
    const contentText = typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content || '');
    const words = (title + ' ' + excerpt + ' ' + contentText.replace(/<[^>]*>/g, '')).trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    const publishedRaw = a.publishedAt || a.createdAt || new Date();
    const publishedAt = new Date(publishedRaw).toISOString();

    items.push({
      id: a._id.toString(),
      slug: tr.slug || '',
      title,
      excerpt,
      author: { name: a.authorName || 'Unknown' },
      publishedAt,
      readTime,
      category: a.category || '',
      tags: a.tags || [],
      views: a.stats?.views || 0,
      comments: a.stats?.comments || 0,
      likes: a.stats?.likes || 0,
      featured: a.featured || false,
      coverImage: a.thumbnail || undefined
    });
  }

  return {
    user,
    articles: items
  };
};
