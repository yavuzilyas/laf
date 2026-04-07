import { json } from '@sveltejs/kit';
import { updateLink } from '$db/queries-links';
import type { RequestHandler } from './$types';

// POST /api/links/reorder - Batch update link display orders (admin/moderator only)
export const POST: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { orders } = body;
        
        if (!Array.isArray(orders)) {
            return json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Update each link's display_order
        const updatePromises = orders.map(async (item: { id: string; display_order: number }) => {
            if (!item.id || typeof item.display_order !== 'number') {
                return null;
            }
            return updateLink(item.id, { display_order: item.display_order }, user.id);
        });

        await Promise.all(updatePromises);

        return json({ success: true });
    } catch (error) {
        console.error('Error reordering links:', error);
        return json({ error: 'Failed to reorder links' }, { status: 500 });
    }
};
