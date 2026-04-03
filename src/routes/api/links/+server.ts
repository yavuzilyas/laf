import { json } from '@sveltejs/kit';
import { getLinks, getLinkById, createLink, updateLink, deleteLink } from '$db/queries-links';
import type { RequestHandler } from './$types';

// GET /api/links - List all links (public)
export const GET: RequestHandler = async ({ url }) => {
    const type = url.searchParams.get('type') || undefined;
    const isActive = url.searchParams.has('isActive') 
        ? url.searchParams.get('isActive') === 'true' 
        : true;

    try {
        const links = await getLinks({ type, isActive });
        return json({ links });
    } catch (error) {
        console.error('Error fetching links:', error);
        return json({ error: 'Failed to fetch links' }, { status: 500 });
    }
};

// POST /api/links - Create new link (admin/moderator only)
export const POST: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin and moderator can create links
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden - Admin or moderator access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.title || !body.url) {
            return json({ error: 'Title and URL are required' }, { status: 400 });
        }

        // Validate URL format
        try {
            new URL(body.url);
        } catch {
            return json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const link = await createLink(body, user.id);
        return json({ link }, { status: 201 });
    } catch (error) {
        console.error('Error creating link:', error);
        return json({ error: 'Failed to create link' }, { status: 500 });
    }
};
