import { json } from '@sveltejs/kit';
import { updateTranslationStatus, getTranslationStatus } from '$db/queries-translation-status';
import { getArticles, deleteNotificationsByTranslationStatusId } from '$db/queries';

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

        // If rejected, remove the translation from the article and delete the notification
        if (action === 'reject') {
            // Delete the notification for this translation
            await deleteNotificationsByTranslationStatusId(translationStatusId);

            if (status.article_translations) {
                const translations = { ...status.article_translations };
                delete translations[status.language_code];
                
                // Update article to remove rejected translation
                const { updateArticle } = await import('$db/queries');
                await updateArticle(status.article_id, { translations });
            }
        }

        // If approved, add translator as collaborator if different from author
        if (action === 'approve') {
            const translatorId = status.translator_id;
            const authorId = article.author_id;
            
            // Only add if translator is different from author
            if (String(translatorId) !== String(authorId)) {
                const currentCollaborators = article.collaborators || [];
                
                // Check if translator is already a collaborator
                const isAlreadyCollaborator = currentCollaborators.some(
                    (id: string) => String(id) === String(translatorId)
                );
                
                if (!isAlreadyCollaborator) {
                    const { updateArticle } = await import('$db/queries');
                    const updatedCollaborators = [...currentCollaborators, translatorId];
                    await updateArticle(status.article_id, { collaborators: updatedCollaborators });
                    console.log(`[TRANSLATION] Added translator ${translatorId} as collaborator to article ${status.article_id}`);
                }
            }
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
