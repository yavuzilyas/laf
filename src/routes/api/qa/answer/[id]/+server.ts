import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// DELETE - Delete an answer by ID (moderators only)
export async function DELETE({ params, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;

        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const answerId = params.id;

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        // Get answer info before deleting
        const getAnswerQuery = `
            SELECT a.id, a.question_id, q.accepted_answer_id
            FROM answers a
            JOIN questions q ON q.id = a.question_id
            WHERE a.id = $1
        `;
        const answerResult = await query(getAnswerQuery, [answerId]);

        if (answerResult.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        const answer = answerResult.rows[0];

        // Delete answer
        const deleteQuery = `DELETE FROM answers WHERE id = $1`;
        await query(deleteQuery, [answerId]);

        // If this was the accepted answer, clear it
        if (answer.accepted_answer_id === answerId) {
            const updateQuestionQuery = `
                UPDATE questions
                SET accepted_answer_id = NULL
                WHERE id = $1
            `;
            await query(updateQuestionQuery, [answer.question_id]);
        }

        return json({
            success: true,
            message: 'Cevap silindi'
        });

    } catch (error) {
        console.error('Error deleting answer:', error);
        return json({ error: 'Cevap silinirken bir hata oluştu' }, { status: 500 });
    }
}
