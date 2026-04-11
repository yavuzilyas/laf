import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Follow/unfollow a question
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        const data = await request.json();
        const { questionId, action } = data;

        if (!questionId || !action) {
            return json({ error: 'Eksik parametreler' }, { status: 400 });
        }

        if (action === 'follow') {
            await query(
                `INSERT INTO question_follows (question_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [questionId, user.id]
            );
            return json({ success: true, following: true, message: 'Soru takip edildi' });
        } else if (action === 'unfollow') {
            await query(
                `DELETE FROM question_follows WHERE question_id = $1 AND user_id = $2`,
                [questionId, user.id]
            );
            return json({ success: true, following: false, message: 'Takip bırakıldı' });
        } else {
            return json({ error: 'Geçersiz aksiyon' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error following question:', error);
        return json({ error: 'İşlem sırasında hata oluştu' }, { status: 500 });
    }
}

// GET - Check if user follows a question
export async function GET({ url, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ following: false });
        }

        const questionId = url.searchParams.get('questionId');
        
        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        const result = await query(
            `SELECT id FROM question_follows WHERE question_id = $1 AND user_id = $2`,
            [questionId, user.id]
        );

        return json({ following: result.rows.length > 0 });

    } catch (error) {
        console.error('Error checking follow status:', error);
        return json({ error: 'Sorgu sırasında hata oluştu' }, { status: 500 });
    }
}
