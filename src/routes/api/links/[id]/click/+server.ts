import { json } from '@sveltejs/kit';
import { incrementLinkClick } from '$db/queries-links';
import type { RequestHandler } from './$types';

// POST /api/links/[id]/click - Track link click (public)
export const POST: RequestHandler = async ({ params }) => {
    try {
        await incrementLinkClick(params.id);
        return json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        return json({ error: 'Failed to track click' }, { status: 500 });
    }
};
