// src/routes/blog/[lang]/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { getArticlesCollection } from '$db/mongo';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const articles = await getArticlesCollection();
    
    const article = await articles.findOne({ 
        [`translations.${params.lang}.slug`]: params.slug,
        status: 'published'
    });

    if (!article) {
        throw error(404, 'Article not found');
    }

    // Görüntülenme sayısını artır
    await articles.updateOne(
        { _id: article._id },
        { $inc: { 'stats.views': 1 } }
    );

    // Diğer dillerdeki versiyonları da döndür
    const availableTranslations = Object.keys(article.translations || {}).reduce((acc, lang) => {
        if (article.translations[lang]?.slug) {
            acc[lang] = {
                slug: article.translations[lang].slug,
                title: article.translations[lang].title
            };
        }
        return acc;
    }, {});

    return {
        article: {
            ...article,
            _id: article._id.toString(),
            availableTranslations
        }
    };
};