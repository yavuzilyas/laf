import { json } from '@sveltejs/kit';
import { updateTranslationStatus, getTranslationStatus } from '$db/queries-translation-status';
import { getArticles } from '$db/queries';

// POST /api/translations/[id]/review - Approve or reject a translation
export async function POST({ params, request, locals }) {
    const user = (locals as any)?.user;
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: translationStatusId } = params;
    const { action, reviewNotes } = await request.json();

    if (!translationStatusId || !action || !['approve', 'reject'].includes(action)) {
        return json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        // Get translation status to verify ownership
        const status = await getTranslationStatus(translationStatusId);
        if (!status) {
            return json({ error: 'Translation not found' }, { status: 404 });
        }

        // Check if user is the article author
        const articles = await getArticles({ id: status.article_id });
        const article = articles[0];
        
        if (!article) {
            return json({ error: 'Article not found' }, { status: 404 });
        }

        // Only article author or admin/moderator can approve/reject
        const isAuthor = String(article.author_id) === String(user.id);
        const isPrivileged = user.role === 'admin' || user.role === 'moderator';
        
        if (!isAuthor && !isPrivileged) {
            return json({ error: 'Unauthorized - only article author can review translations' }, { status: 403 });
        }

        // Check if translation is still pending
        if (status.status !== 'pending') {
            return json({ error: 'Translation has already been reviewed' }, { status: 400 });
        }

        // Update translation status
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const success = await updateTranslationStatus(translationStatusId, newStatus, reviewNotes);

        if (!success) {
            return json({ error: 'Failed to update translation status' }, { status: 500 });
        }

        // If rejected, remove the translation from the article
        if (action === 'reject' && status.article_translations) {
            const translations = { ...status.article_translations };
            delete translations[status.language_code];
            
            // Update article to remove rejected translation
            const { updateArticle } = await import('$db/queries');
            await updateArticle(status.article_id, { translations });
        }

        return json({
            success: true,
            status: newStatus,
            message: action === 'approve' ? 'Translation approved successfully' : 'Translation rejected and removed'
        });

    } catch (error) {
        console.error('Error reviewing translation:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
