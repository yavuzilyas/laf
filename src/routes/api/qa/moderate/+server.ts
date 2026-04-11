import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Moderate a question (publish, reject, etc.) - moderators only
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        // Check if user is moderator or admin
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const data = await request.json();
        const { questionId, action, note } = data;

        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        if (!action || !['publish', 'reject', 'unpublish'].includes(action)) {
            return json({ error: 'Geçerli bir aksiyon gerekli (publish, reject, unpublish)' }, { status: 400 });
        }

        // Check if question exists
        const checkQuery = `SELECT id, status, answer_id FROM questions WHERE id = $1`;
        const checkResult = await query(checkQuery, [questionId]);

        if (checkResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const question = checkResult.rows[0];

        let updateQuery: string;
        let params: any[];
        let newStatus: string;

        switch (action) {
            case 'publish':
                // Can only publish if there's an answer
                if (!question.answer_id) {
                    return json({ 
                        error: 'Cevaplanmamış sorular yayınlanamaz. Önce cevap ekleyin.' 
                    }, { status: 400 });
                }
                newStatus = 'published';
                updateQuery = `
                    UPDATE questions 
                    SET status = $1, 
                        published_at = NOW(), 
                        moderated_by = $2, 
                        moderated_at = NOW(),
                        moderation_note = $3
                    WHERE id = $4
                    RETURNING id, title, status, published_at
                `;
                params = [newStatus, user.id, note || null, questionId];
                break;

            case 'reject':
                newStatus = 'rejected';
                updateQuery = `
                    UPDATE questions 
                    SET status = $1, 
                        moderated_by = $2, 
                        moderated_at = NOW(),
                        moderation_note = $3
                    WHERE id = $4
                    RETURNING id, title, status
                `;
                params = [newStatus, user.id, note || null, questionId];
                break;

            case 'unpublish':
                newStatus = 'answered'; // Go back to answered but not published
                updateQuery = `
                    UPDATE questions 
                    SET status = $1, 
                        published_at = NULL,
                        moderated_by = $2, 
                        moderated_at = NOW(),
                        moderation_note = $3
                    WHERE id = $4
                    RETURNING id, title, status
                `;
                params = [newStatus, user.id, note || null, questionId];
                break;

            default:
                return json({ error: 'Geçersiz aksiyon' }, { status: 400 });
        }

        const result = await query(updateQuery, params);
        const updatedQuestion = result.rows[0];

        return json({
            success: true,
            question: {
                id: updatedQuestion.id,
                title: updatedQuestion.title,
                status: updatedQuestion.status,
                publishedAt: updatedQuestion.published_at
            },
            message: action === 'publish' 
                ? 'Soru yayınlandı' 
                : action === 'reject'
                ? 'Soru reddedildi'
                : 'Soru yayından kaldırıldı'
        });

    } catch (error) {
        console.error('Error moderating question:', error);
        return json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
}

// DELETE - Delete a question (moderators only)
export async function DELETE({ url, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const questionId = url.searchParams.get('id');
        
        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        // Check if question exists
        const checkQuery = `SELECT id FROM questions WHERE id = $1`;
        const checkResult = await query(checkQuery, [questionId]);

        if (checkResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        // Delete question (answers will be deleted via CASCADE)
        const deleteQuery = `DELETE FROM questions WHERE id = $1`;
        await query(deleteQuery, [questionId]);

        return json({
            success: true,
            message: 'Soru silindi'
        });

    } catch (error) {
        console.error('Error deleting question:', error);
        return json({ error: 'Soru silinirken bir hata oluştu' }, { status: 500 });
    }
}
