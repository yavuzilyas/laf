import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Accept an answer (question author only)
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        const data = await request.json();
        const { answerId } = data;

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        // Check if user is the question author
        const checkQuery = `
            SELECT q.id as question_id, q.author_id, a.is_accepted
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.id = $1
        `;
        const checkResult = await query(checkQuery, [answerId]);

        if (checkResult.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        const { question_id, author_id, is_accepted } = checkResult.rows[0];

        // Check if user can accept: question author, moderator, or admin
        const canAccept = user.id === author_id || user.role === 'moderator' || user.role === 'admin';

        if (!canAccept) {
            return json({ error: 'Sadece soru sahibi, moderatör veya admin cevap kabul edebilir' }, { status: 403 });
        }

        // Toggle: if already accepted, unaccept it
        if (is_accepted) {
            await query('UPDATE answers SET is_accepted = FALSE WHERE id = $1', [answerId]);
            await query('UPDATE questions SET accepted_answer_id = NULL WHERE id = $1', [question_id]);
            return json({ success: true, accepted: false, message: 'Cevap kabulü kaldırıldı' });
        }

        // Unaccept any previously accepted answer
        await query(
            'UPDATE answers SET is_accepted = FALSE WHERE question_id = $1 AND is_accepted = TRUE',
            [question_id]
        );

        // Accept the new answer
        await query('UPDATE answers SET is_accepted = TRUE WHERE id = $1', [answerId]);
        await query(
            'UPDATE questions SET accepted_answer_id = $1 WHERE id = $2',
            [answerId, question_id]
        );

        return json({ success: true, accepted: true, message: 'Cevap kabul edildi' });

    } catch (error) {
        console.error('Error accepting answer:', error);
        return json({ error: 'İşlem sırasında hata oluştu' }, { status: 500 });
    }
}

// GET - Get accepted answer status
export async function GET({ url, locals }: RequestEvent) {
    try {
        const answerId = url.searchParams.get('answerId');
        
        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        const result = await query(
            'SELECT is_accepted FROM answers WHERE id = $1',
            [answerId]
        );

        if (result.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        return json({ accepted: result.rows[0].is_accepted });

    } catch (error) {
        console.error('Error checking accepted status:', error);
        return json({ error: 'Sorgu sırasında hata oluştu' }, { status: 500 });
    }
}
