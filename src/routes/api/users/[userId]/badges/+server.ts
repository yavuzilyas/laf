import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserBadges } from '$lib/server/badges';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { userId } = params;
        
        if (!userId) {
            return json({ error: 'User ID is required' }, { status: 400 });
        }
        
        const badges = await getUserBadges(userId);
        
        return json({ badges });
    } catch (error) {
        console.error('Error fetching user badges:', error);
        return json({ error: 'Failed to fetch badges' }, { status: 500 });
    }
};
