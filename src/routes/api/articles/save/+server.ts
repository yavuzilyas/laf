import type { RequestHandler } from "@sveltejs/kit";
import { getArticlesCollection } from "$db/mongo";
import { error, json } from "@sveltejs/kit";

// Helper function to create URL-friendly slug
function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const articleData = await request.json();
        const articles = await getArticlesCollection();

        // Validate required fields
        if (!articleData.title?.trim()) {
            throw error(400, 'Title is required');
        }

        if (articleData.status === 'published' && !articleData.content?.trim()) {
            throw error(400, 'Content is required for published articles');
        }

        // Create slug from title
        const baseSlug = createSlug(articleData.title);
        let slug = baseSlug;
        let counter = 1;

        // Ensure slug is unique
        while (await articles.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // Prepare article document
        const articleDoc = {
            title: articleData.title.trim(),
            excerpt: articleData.excerpt?.trim() || '',
            content: articleData.content?.trim() || '',
            slug,
            category: articleData.category || '',
            tags: Array.isArray(articleData.tags) ? articleData.tags : [],
            language: articleData.language || 'tr',
            status: articleData.status || 'draft',
            author: {
                nickname: locals.user.nickname,
                name: locals.user.name || null,
                surname: locals.user.surname || null
            },
            stats: {
                views: 0,
                likes: 0,
                comments: 0
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // If publishing, add published date
        if (articleData.status === 'published') {
            articleDoc.publishedAt = new Date();
        }

        // Insert article
        const result = await articles.insertOne(articleDoc);

        return json({
            success: true,
            articleId: result.insertedId.toString(),
            slug: slug,
            message: articleData.status === 'published' ? 'Article published successfully' : 'Draft saved successfully'
        });

    } catch (err: any) {
        console.error('Article save error:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, 'Failed to save article');
    }
};
