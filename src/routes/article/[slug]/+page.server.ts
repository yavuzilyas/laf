// src/routes/article/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';
// Add these imports at the top of the file
import { rm } from 'fs/promises';
import { resolve } from 'path';

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
    const query: any = {
      [`translations.${lang}.slug`]: slug,
      deletedAt: { $exists: false },
      $or: [
        { status: 'published' },
        { 
          status: 'draft',
          authorId: viewerObjectId || { $exists: false }
        },
        { 
          status: 'pending',
          authorId: viewerObjectId || { $exists: false }
        }
      ]
    };
    
    const found = await articles.findOne(query);
    if (found) {
      // If article is draft/pending and user is not the author, skip to next language
      if ((found.status === 'draft' || found.status === 'pending') && 
          (!viewerObjectId || !found.authorId || !found.authorId.equals(viewerObjectId))) {
        continue;
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