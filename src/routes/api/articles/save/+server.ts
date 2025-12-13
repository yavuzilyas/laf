// src/routes/api/articles/save/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection, getDraftsCollection, getVersionsCollection, getUsersCollection } from '$db/mongo';
import { slugify } from '$lib/utils/slugify';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { notifyNewArticle } from '$lib/server/notifications';

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
        const articles = await getArticlesCollection();
        const drafts = await getDraftsCollection();
        const versions = await getVersionsCollection();
        const users = await getUsersCollection();

        // Get user's role
        const userData = await users.findOne({ _id: new ObjectId(user.id) });
        const userRole = userData?.role || 'user';
        const isPrivileged = userRole === 'admin' || userRole === 'moderator';

        // Check article limit for non-privileged users
        if (data.status === 'published' && !isPrivileged) {
            // Count user's published articles today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const publishedToday = await articles.countDocuments({
                'authorId': new ObjectId(user.id),
                'status': 'published',
                'createdAt': { $gte: startOfDay }
            });

            if (publishedToday >= 2) {
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
                translation.slug = slugify(translation.title) + `-${lang}`;
            }

            // Slug benzersizlik kontrolü
            if (translation.slug) {
                const existing = await articles.findOne({
                    [`translations.${lang}.slug`]: translation.slug,
                    _id: (data._id || data.id) ? { $ne: new ObjectId(data._id || data.id) } : { $exists: true }
                });

                if (existing) {
                    translation.slug = `${translation.slug}-${Date.now()}`;
                }
            }
        }

        const articleData = {
            ...data,
            authorId: new ObjectId(user.id),
            updatedAt: new Date(),
            stats: data.stats || { views: 0, likes: 0, comments: 0 },
            // Store the original status for reference
            originalStatus: data.status,
            // Store reviewer info if status was changed to pending
            ...(data.status === 'pending' && !isPrivileged && {
                pendingReview: {
                    requestedAt: new Date(),
                    status: 'pending',
                    reviewerId: null,
                    reviewedAt: null,
                    comment: null
                }
            })
        };

        let result;
        let articleId;

        const existingId = data._id || data.id;
        let existingArticle: any = null;
        if (existingId) {
            // Güncelleme
            articleId = new ObjectId(existingId);
            existingArticle = await articles.findOne({ _id: articleId });
            await articles.updateOne(
                { _id: articleId },
                { $set: articleData }
            );
        } else {
            // Yeni makale
            articleData.createdAt = new Date();
            result = await articles.insertOne(articleData);
            articleId = result.insertedId;
        }

        // Taslak kaydetme
        if (data.status === 'draft') {
            await drafts.updateOne(
                { articleId, authorId: new ObjectId(locals.user.id) },
                { 
                    $set: { 
                        data: articleData,
                        lastSaved: new Date(),
                        hasUnpublishedChanges: true
                    } 
                },
                { upsert: true }
            );
        } else {
            // Yayınlama - versiyon kaydet
            const versionCount = await versions.countDocuments({ articleId });
            await versions.insertOne({
                articleId,
                versionNumber: versionCount + 1,
                data: articleData,
                createdAt: new Date(),
                authorId: new ObjectId(user.id)
            });

            // Taslağı temizle
            await drafts.deleteOne({ articleId });

            await cleanupUnusedMedia(existingArticle, articleData, articleId.toString());
            
            // Send notifications to followers if this is a new published article
            if (!existingId && articleData.originalStatus === 'published') {
              const users = await getUsersCollection();
              const author = await users.findOne(
                { _id: new ObjectId(user.id) },
                { projection: { name: 1, nickname: 1 } }
              );
              
              if (author) {
                const defaultLang = articleData.defaultLanguage || 'tr';
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
            articleId: articleId.toString(),
            slug: articleData.translations?.[articleData.defaultLanguage as string]?.slug
        });

    } catch (error) {
        console.error('Article save error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}