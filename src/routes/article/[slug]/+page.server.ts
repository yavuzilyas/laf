// src/routes/article/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;
  const articles = await getArticlesCollection();

  // Try finding by slug across known locales
  const localesToTry = ['en', 'tr', 'de', 'fr', 'es'];
  let article: any = null;
  let matchedLang: string | null = null;

  for (const lang of localesToTry) {
    const found = await articles.findOne({
      [`translations.${lang}.slug`]: slug,
      status: 'published'
    });
    if (found) {
      article = found;
      matchedLang = lang;
      break;
    }
  }

  if (!article) {
    throw error(404, 'Article not found');
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
  try {
    if (article.authorId) {
      const users = await getUsersCollection();
      const userDoc = await users.findOne({ _id: new ObjectId(article.authorId) });
      if (userDoc) {
        author = {
          id: userDoc._id.toString(),
          nickname: userDoc.nickname,
          name: userDoc.name,
          surname: userDoc.surname
        };
      } else {
        author = { id: String(article.authorId) };
      }
    }
  } catch {
    author = { id: String(article.authorId) };
  }

  return {
    article: {
      _id: article._id.toString(),
      language: currentLang,
      title: tr?.title ?? '',
      excerpt: tr?.excerpt ?? '',
      content: tr?.content ?? '',
      thumbnail: article.thumbnail || '',
      category: article.category,
      subcategory: article.subcategory,
      tags: article.tags || [],
      stats: article.stats || { views: 0, likes: 0, comments: 0, dislikes: 0 },
      author,
      authorId: article.authorId ? String(article.authorId) : undefined,
      createdAt: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      availableTranslations
    }
  };
};