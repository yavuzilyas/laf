// src/routes/api/articles/[id]/featured/+server.ts
import { json } from '@sveltejs/kit';
import { toggleArticleFeatured, getArticleById } from '$db/queries';

// POST - Toggle featured status (admin only)
export async function POST({ params, locals, request }) {
    const user = (locals as any)?.user;

    // Only admin can feature/unfeature articles
    if (!user || user.role !== 'admin') {
        return json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const articleId = params.id;

    // Find the article
    const article = await getArticleById(articleId);
    if (!article) {
        return json({ error: 'Article not found' }, { status: 404 });
    }

    // Get the desired featured status from request body
    let isFeatured: boolean;
    try {
        const body = await request.json();
        isFeatured = body.isFeatured;
        if (typeof isFeatured !== 'boolean') {
            return json({ error: 'isFeatured must be a boolean' }, { status: 400 });
        }
    } catch {
        // If no body or invalid JSON, toggle the current state
        isFeatured = !article.is_featured;
    }

    // Toggle the featured status
    try {
        const result = await toggleArticleFeatured(articleId, user.id, isFeatured);
        return json({
            success: true,
            isFeatured: result?.is_featured,
            featuredAt: result?.featured_at,
            message: isFeatured ? 'Article featured successfully' : 'Article unfeatured successfully'
        });
    } catch (error) {
        console.error('Error toggling featured status:', error);
        return json({ error: 'Failed to toggle featured status' }, { status: 500 });
    }
}

// GET - Get featured status for an article
export async function GET({ params }) {
    const articleId = params.id;

    // Find the article
    const article = await getArticleById(articleId);
    if (!article) {
        return json({ error: 'Article not found' }, { status: 404 });
    }

    return json({
        isFeatured: article.is_featured || false,
        featuredAt: article.featured_at,
        featuredBy: article.featured_by
    });
}
