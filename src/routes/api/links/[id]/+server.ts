import { json } from '@sveltejs/kit';
import { getLinkById, updateLink, deleteLink } from '$db/queries-links';
import type { RequestHandler } from './$types';

// GET /api/links/[id] - Get single link
export const GET: RequestHandler = async ({ params }) => {
    try {
        const link = await getLinkById(params.id);
        if (!link) {
            return json({ error: 'Link not found' }, { status: 404 });
        }
        return json({ link });
    } catch (error) {
        console.error('Error fetching link:', error);
        return json({ error: 'Failed to fetch link' }, { status: 500 });
    }
};

// PUT /api/links/[id] - Update link (admin/moderator only)
export const PUT: RequestHandler = async ({ params, request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin and moderator can update links
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden - Admin or moderator access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        
        // Validate URL format if provided
        if (body.url) {
            try {
                new URL(body.url);
            } catch {
                return json({ error: 'Invalid URL format' }, { status: 400 });
            }
        }

        const link = await updateLink(params.id, body, user.id);
        if (!link) {
            return json({ error: 'Link not found' }, { status: 404 });
        }
        return json({ link });
    } catch (error) {
        console.error('Error updating link:', error);
        return json({ error: 'Failed to update link' }, { status: 500 });
    }
};

// DELETE /api/links/[id] - Delete link (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can delete links
    if (user.role !== 'admin') {
        return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    try {
        const success = await deleteLink(params.id);
        if (!success) {
            return json({ error: 'Link not found' }, { status: 404 });
        }
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting link:', error);
        return json({ error: 'Failed to delete link' }, { status: 500 });
    }
};
