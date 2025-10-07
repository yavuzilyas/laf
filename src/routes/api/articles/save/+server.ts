// src/routes/api/articles/save/+server.ts
import { json } from '@sveltejs/kit';
import { getArticlesCollection, getDraftsCollection, getVersionsCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';
import { slugify } from '$lib/utils/slugify';

export async function POST({ request, locals }) {
    const user = (locals as any)?.user;
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    try {
        const articles = await getArticlesCollection();
        const drafts = await getDraftsCollection();
        const versions = await getVersionsCollection();

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
            stats: data.stats || { views: 0, likes: 0, comments: 0 }
        };

        let result;
        let articleId;

        const existingId = data._id || data.id;
        if (existingId) {
            // Güncelleme
            articleId = new ObjectId(existingId);
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