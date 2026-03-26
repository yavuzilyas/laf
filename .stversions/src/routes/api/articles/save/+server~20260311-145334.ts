// src/routes/api/articles/save/+server.ts
import { json } from '@sveltejs/kit';
import { getArticles, createArticle, updateArticle, getArticleById, getUsers, upsertDraft, createVersion, countVersions, deleteDraft } from '$db/queries';
import { slugify } from '$lib/utils/slugify';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { notifyNewArticle } from '$lib/server/notifications-pg';

export async function POST({ request, locals }) {
    const user = (locals as any)?.user;
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

type JSONContent = {
    type?: string;
    attrs?: Record<string, any>;
    content?: JSONContent[];
    [key: string]: any;
};

function extractMediaUrlsFromContent(content: unknown, target: Set<string>) {
    if (!content) return;

    let normalized: JSONContent | JSONContent[] | null = null;
    if (typeof content === 'string') {
        try {
            normalized = JSON.parse(content);
        } catch {
            normalized = null;
        }
    } else {
        normalized = content as JSONContent | JSONContent[];
    }

    if (!normalized) return;

    if (Array.isArray(normalized)) {
        for (const node of normalized) {
            extractMediaUrlsFromContent(node, target);
        }
        return;
    }

    const node = normalized as JSONContent;
    const src = node?.attrs?.src;
    if (typeof src === 'string') {
        target.add(src);
    }

    const contentNodes = node?.content;
    if (Array.isArray(contentNodes)) {
        for (const child of contentNodes) {
            extractMediaUrlsFromContent(child, target);
        }
    }
}

function collectArticleMediaUrls(article: any): Set<string> {
    const urls = new Set<string>();
    if (!article) return urls;

    if (article.thumbnail && typeof article.thumbnail === 'string') {
        urls.add(article.thumbnail);
    }

    const translations = article.translations || {};
    for (const translation of Object.values<any>(translations)) {
        extractMediaUrlsFromContent(translation?.content, urls);
    }

    return urls;
}

async function cleanupUnusedMedia(existing: any, updated: any, articleId: string) {
    if (!existing) return;

    const previousUrls = collectArticleMediaUrls(existing);
    const updatedUrls = collectArticleMediaUrls(updated);

    if (!previousUrls.size) return;

    const baseUploadsDir = resolve('static', 'uploads');
    const allowedPrefix = `/uploads/articles/${articleId}/`;

    const toDelete: string[] = [];
    for (const url of previousUrls) {
        if (!updatedUrls.has(url) && typeof url === 'string' && url.startsWith(allowedPrefix)) {
            toDelete.push(url);
        }
    }

    if (!toDelete.length) return;

    await Promise.all(
        toDelete.map(async (url) => {
            try {
                const fsPath = resolve('static', url.replace(/^\//, ''));
                if (fsPath.startsWith(baseUploadsDir)) {
                    await rm(fsPath, { force: true });
                }
            } catch (error) {
                console.error('Failed to remove unused media', url, error);
            }
        })
    );
}

    const data = await request.json();
    
    try {
        // Get user's role
        const userData = await getUsers({ id: user.id });
        const userRecord = userData[0];
        const userRole = userRecord?.role || 'user';
        const isPrivileged = userRole === 'admin' || userRole === 'moderator';

        // Check article limit for non-privileged users
        if (data.status === 'published' && !isPrivileged) {
            // Count user's published articles today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            // Get all articles by user and filter manually for today
            const userArticles = await getArticles({ 
                author_id: user.id 
            });
            
            const publishedToday = userArticles.filter((article: any) => 
                article.status === 'published' && 
                new Date(article.created_at) >= startOfDay
            );

            if (publishedToday.length >= 2) {
                return json({ 
                    error: 'Günlük makale yayınlama limitinize ulaştınız. Günde en fazla 2 makale yayınlayabilirsiniz.' 
                }, { status: 403 });
            }

            // Set status to pending for non-privileged users
            data.status = 'pending';
        }

        // defaultLanguage yoksa mevcut çevirilerden ilkini ata
        if (!data.defaultLanguage) {
            const langs = Object.keys(data.translations || {});
            if (langs.length > 0) data.defaultLanguage = langs[0];
        }

        // Slug kontrolü ve oluşturma (dil bazlı)
        for (const [lang, translation] of Object.entries<any>(data.translations || {})) {
            if (translation.title && !translation.slug) {
                translation.slug = slugify(translation.title);
            }

            // Slug benzersizlik kontrolü - check if slug exists for this language
            if (translation.slug) {
                const baseSlug = translation.slug;
                const existingArticles = await getArticles({ 
                    slug: baseSlug, 
                    language: lang 
                });
                
                // Filter out the current article if updating
                const existing = existingArticles.find((a: any) => a.id !== (data._id || data.id));

                // Only add unique suffix if there's a duplicate
                if (existing) {
                    translation.slug = `${baseSlug}-${Date.now()}`;
                }
            }
        }

        const articleData = {
            ...data,
            author_id: user.id,
            translations: data.translations || {},
            category: data.category || null,
            subcategory: data.subcategory || null,
            tags: data.tags || [],
            thumbnail: data.thumbnail || null,
            status: data.status || 'draft',
            default_language: data.defaultLanguage || 'tr',
            views: data.stats?.views || 0,
            likes_count: data.stats?.likes || 0,
            comments_count: data.stats?.comments || 0,
            // Store the original status for reference
            originalStatus: data.status,
            // Store reviewer info if status was changed to pending
            ...(data.status === 'pending' && !isPrivileged && {
                pending_review: {
                    requestedAt: new Date(),
                    status: 'pending',
                    reviewerId: null,
                    reviewedAt: null,
                    comment: null
                }
            })
        };

        let articleId: string;

        const existingId = data._id || data.id;
        let existingArticle: any = null;
        if (existingId) {
            // Güncelleme
            articleId = existingId;
            existingArticle = await getArticleById(articleId);
            await updateArticle(articleId, articleData);
        } else {
            // Yeni makale
            const result = await createArticle({
                ...articleData,
                published_at: data.status === 'published' ? new Date() : null
            });
            articleId = result.id;
        }

        // Taslak kaydetme
        if (data.status === 'draft') {
            await upsertDraft(articleId, user.id, {
                data: articleData,
                has_unpublished_changes: true
            });
        } else {
            // Yayınlama - versiyon kaydet
            const versionCount = await countVersions(articleId);
            await createVersion({
                articleId: articleId,
                data: articleData,
                authorId: user.id,
                changeNote: `Version ${versionCount + 1}`
            });

            // Taslağı temizle
            await deleteDraft(articleId);

            await cleanupUnusedMedia(existingArticle, articleData, articleId);
            
            // Send notifications to followers if this is a new published article
            if (!existingId && articleData.originalStatus === 'published') {
              const authorData = await getUsers({ id: user.id });
              const author = authorData[0];
              
              if (author) {
                const defaultLang = articleData.default_language || 'tr';
                const title = articleData.translations?.[defaultLang]?.title || 'Yeni Makale';
                
                await notifyNewArticle({
                  articleId: articleId,
                  articleSlug: articleData.translations?.[defaultLang]?.slug,
                  authorId: user.id,
                  articleTitle: title,
                  authorName: author.nickname || author.name || 'Bir kullanıcı'
                });
              }
            }
        }

        return json({
            success: true,
            articleId: articleId,
            slug: articleData.translations?.[articleData.default_language as string]?.slug
        });

    } catch (error) {
        console.error('Article save error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}