import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArticlesCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

const normalizeContent = (content: unknown) => {
  if (!content) return null;
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }
  if (typeof content === 'object') {
    return content;
  }
  return null;
};

const sanitizeTranslation = (data: any, language: string) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const { title = '', excerpt = '', content = null, slug = '' } = data;
  return {
    title,
    excerpt,
    content: normalizeContent(content),
    slug: typeof slug === 'string' ? slug : '',
    language
  };
};

export const load: PageServerLoad = async ({ url, locals }) => {
  const articleId = url.searchParams.get('articleId');
  const mode = url.searchParams.get('mode') ?? 'create';

  const user = (locals as any)?.user ?? null;
  if (!user) {
    return {
      user: null,
      mode,
      article: null
    };
  }

  if (!articleId || mode !== 'edit') {
    return {
      user,
      mode,
      article: null
    };
  }

  const articles = await getArticlesCollection();
  const objectId = ObjectId.isValid(articleId) ? new ObjectId(articleId) : null;
  const slugParam = url.searchParams.get('slug');

  let articleDoc = objectId ? await articles.findOne({ _id: objectId }) : null;

  const slugCandidates = Array.from(
    new Set(
      [slugParam, articleId]
        .filter((value): value is string => Boolean(value) && value !== (objectId ? articleId : ''))
    )
  );

  if (!articleDoc && slugCandidates.length > 0) {
    const slugConditions = [] as Record<string, string>[];
    const languageKeys = ['tr', 'en', 'de', 'fr', 'es'];

    for (const candidate of slugCandidates) {
      slugConditions.push({ slug: candidate });
      for (const key of languageKeys) {
        slugConditions.push({ [`translations.${key}.slug`]: candidate } as Record<string, string>);
      }
    }

    if (slugConditions.length > 0) {
      articleDoc = await articles.findOne({ $or: slugConditions });
    }
  }

  if (!articleDoc) {
    throw error(404, 'Article not found');
  }

  if (String(articleDoc.authorId) !== String(user.id)) {
    throw error(403, 'Unauthorized');
  }

  const translations: Record<string, ReturnType<typeof sanitizeTranslation>> = {};
  for (const [lang, translation] of Object.entries(articleDoc.translations || {})) {
    const sanitized = sanitizeTranslation(translation, lang);
    if (sanitized) {
      translations[lang] = sanitized;
    }
  }

  if (Object.keys(translations).length === 0) {
    const fallbackLang = articleDoc.language || articleDoc.defaultLanguage || 'tr';
    const fallback = sanitizeTranslation(
      {
        title: articleDoc.title,
        excerpt: articleDoc.excerpt,
        content: articleDoc.content,
        slug: articleDoc.slug
      },
      fallbackLang
    );

    if (fallback) {
      translations[fallbackLang] = fallback;
    }
  }

  const availableLanguages = Object.keys(translations);

  const responseArticle = {
    id: articleDoc._id.toString(),
    slug: articleDoc.slug || undefined,
    defaultLanguage: articleDoc.defaultLanguage || availableLanguages[0],
    category: articleDoc.category || '',
    subcategory: articleDoc.subcategory || '',
    tags: Array.isArray(articleDoc.tags) ? articleDoc.tags : [],
    status: articleDoc.status || 'draft',
    collaborators: Array.isArray(articleDoc.collaborators) ? articleDoc.collaborators : [],
    authorId: articleDoc.authorId ? String(articleDoc.authorId) : user.id,
    thumbnail: articleDoc.thumbnail || '',
    translations,
    availableLanguages,
    version: articleDoc.version || 1,
    publishedAt: articleDoc.publishedAt ? new Date(articleDoc.publishedAt).toISOString() : undefined
  };

  return {
    user,
    mode,
    article: responseArticle
  };
};

