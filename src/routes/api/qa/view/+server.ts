import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Track question view
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const data = await request.json();
        const { questionId } = data;

        if (!questionId) {
            return json({ error: 'Question ID required' }, { status: 400 });
        }

        // Increment view count in database
        await query(
            'UPDATE questions SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
            [questionId]
        );

        return json({ success: true });
    } catch (error) {
        console.error('Error tracking view:', error);
        return json({ error: 'Failed to track view' }, { status: 500 });
    }
}
