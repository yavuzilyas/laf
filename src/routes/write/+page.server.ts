import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArticleById, getArticles } from '$db/queries';

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

  const slugParam = url.searchParams.get('slug');

  // Try to find article by ID first
  let articleDoc = await getArticleById(articleId);

  // If not found by ID, try by slug
  if (!articleDoc && slugParam) {
    const slugCandidates = [slugParam, articleId];
    const languageKeys = ['tr', 'en', 'de', 'fr', 'es'];

    for (const candidate of slugCandidates) {
      for (const lang of languageKeys) {
        const articles = await getArticles({ slug: candidate, language: lang });
        if (articles && articles.length > 0) {
          articleDoc = articles[0];
          break;
        }
      }
      if (articleDoc) break;
    }
  }

  if (!articleDoc) {
    throw error(404, 'Article not found');
  }

  if (String(articleDoc.author_id) !== String(user.id)) {
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
    const fallbackLang = articleDoc.default_language || 'tr';
    const fallback = sanitizeTranslation(
      {
        title: '',
        excerpt: '',
        content: null,
        slug: ''
      },
      fallbackLang
    );

    if (fallback) {
      translations[fallbackLang] = fallback;
    }
  }

  const availableLanguages = Object.keys(translations);

  const responseArticle = {
    id: articleDoc.id,
    slug: undefined,
    defaultLanguage: articleDoc.default_language || availableLanguages[0],
    category: articleDoc.category || '',
    subcategory: articleDoc.subcategory || '',
    tags: Array.isArray(articleDoc.tags) ? articleDoc.tags : [],
    status: articleDoc.status || 'draft',
    collaborators: [],
    authorId: articleDoc.author_id ? String(articleDoc.author_id) : user.id,
    thumbnail: articleDoc.thumbnail || '',
    translations,
    availableLanguages,
    version: 1,
    publishedAt: articleDoc.published_at ? new Date(articleDoc.published_at).toISOString() : undefined
  };

  return {
    user,
    mode,
    article: responseArticle
  };
};

