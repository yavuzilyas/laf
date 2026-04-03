import { 
    createNotification, 
    isUserBlocked
} from '$db/queries';
import { getUsers, getArticles } from '$db/queries';

function toIdString(id: string | null | undefined): string | null {
    if (!id) return null;
    return id;
}

async function getUserName(userId: string): Promise<string | null> {
    const users = await getUsers({ id: userId });
    const user = users[0];
    if (!user) return null;
    if (user.username) return user.username;
    if (user.name && user.surname) return `${user.name} ${user.surname}`;
    if (user.name) return user.name;
    return null;
}

async function resolveArticleSlug(articleId: string): Promise<string | null> {
    const articles = await getArticles({ id: articleId });
    const article = articles[0];
    if (!article) return null;
    
    const translations = article.translations || {};
    const defaultLang = article.default_language || 'tr';
    
    if (translations[defaultLang]?.slug) {
        return translations[defaultLang].slug;
    }
    
    for (const lang of ['tr', 'en', 'de', 'fr', 'es']) {
        if (translations[lang]?.slug) {
            return translations[lang].slug;
        }
    }
    
    return article.id;
}

export async function notifyTranslationReview(params: { 
    articleId: string; 
    articleSlug?: string | null; 
    translatorId: string;
    articleAuthorId: string;
    languageCode: string;
    articleTitle?: string | null;
    translationStatusId: string;
}) {
    const { articleId, articleSlug, translatorId, articleAuthorId, languageCode, articleTitle, translationStatusId } = params;
    
    // Don't notify if author is the translator
    if (articleAuthorId === translatorId) return;
    
    // Check if author has blocked the translator
    if (await isUserBlocked(articleAuthorId, translatorId)) return;
    
    const articleIdStr = toIdString(articleId);
    if (!articleIdStr) return;
    
    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
    const translatorName = await getUserName(translatorId);
    
    const title = { 
        key: 'notifications.messages.newTranslation', 
        values: { 
            user: translatorName || 'Bir kullanıcı',
            language: languageCode.toUpperCase()
        } 
    };
    const message = articleTitle ? 
        { key: 'notifications.messages.newTranslationWithTitle', values: { title: articleTitle, language: languageCode.toUpperCase() } } : 
        { key: 'notifications.messages.newTranslationGeneric', values: { language: languageCode.toUpperCase() } };
    
    await createNotification({
        user_id: articleAuthorId,
        type: 'translation_review',
        title,
        content: message,
        data: {
            link: `/article/${articleSlugValue}?translation=${languageCode}`,
            actor: {
                id: translatorId,
                name: translatorName,
            },
            meta: {
                articleId: articleIdStr,
                articleSlug: articleSlugValue,
                languageCode,
                translationStatusId,
                articleTitle,
                kind: 'translation-review',
            },
        },
    });
}
