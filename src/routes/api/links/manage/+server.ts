import { json } from '@sveltejs/kit';
import { getLinks, createLink, updateLink, deleteLink } from '$db/queries-links';
import { writeFile, mkdir, rm } from 'fs/promises';
import { extname, resolve } from 'path';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const UPLOAD_BASE_DIR = env.UPLOAD_DIR || 'static/uploads';

// Helper function to delete old icon file
async function deleteOldIcon(iconUrl: string | null | undefined) {
  if (!iconUrl) return;
  try {
    const normalizedUrl = iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`;
    const fsPath = resolve(UPLOAD_BASE_DIR, normalizedUrl.replace(/^\//, '').replace(/^uploads\//, ''));
    // Security check: ensure path is within upload directory
    if (fsPath.startsWith(resolve(UPLOAD_BASE_DIR))) {
      await rm(fsPath, { force: true });
      console.log('[LINKS] Deleted old icon:', fsPath);
    }
  } catch (error) {
    console.error('[LINKS] Error deleting old icon:', error);
  }
}

// GET /api/links/manage - List all links (admin/moderator only)
export const GET: RequestHandler = async ({ locals, url }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const type = url.searchParams.get('type') || undefined;
        const isActive = url.searchParams.has('isActive') 
            ? url.searchParams.get('isActive') === 'true' 
            : undefined;
        
        const links = await getLinks({ type, isActive });
        return json({ links });
    } catch (error) {
        console.error('Error fetching links:', error);
        return json({ error: 'Failed to fetch links' }, { status: 500 });
    }
};

// POST /api/links/manage - Create link with icon upload (admin/moderator only)
export const POST: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        
        const title = formData.get('title') as string;
        const url = formData.get('url') as string;
        const description = formData.get('description') as string;
        const type = (formData.get('type') as string) || 'social';
        const platform = formData.get('platform') as string;
        const display_order = parseInt(formData.get('display_order') as string) || 0;
        const is_active = formData.get('is_active') === 'true';
        
        if (!title || !url) {
            return json({ error: 'Title and URL are required' }, { status: 400 });
        }

        try {
            new URL(url);
        } catch {
            return json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Handle icon upload
        let icon_url: string | undefined;
        const iconFile = formData.get('icon') as File | null;
        
        if (iconFile && iconFile.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
            if (!allowedTypes.includes(iconFile.type)) {
                return json({ error: 'Invalid icon format. Use JPEG, PNG, GIF, SVG, or WebP' }, { status: 400 });
            }
            
            if (iconFile.size > 2 * 1024 * 1024) {
                return json({ error: 'Icon too large. Max 2MB' }, { status: 400 });
            }

            const ext = extname(iconFile.name) || '.png';
            const fileName = `link-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            const dir = resolve(UPLOAD_BASE_DIR, 'links');
            await mkdir(dir, { recursive: true });
            
            const filePath = resolve(dir, fileName);
            const arrayBuffer = await iconFile.arrayBuffer();
            await writeFile(filePath, Buffer.from(arrayBuffer));
            
            icon_url = `/uploads/links/${fileName}`;
        }

        const link = await createLink({
            title,
            url,
            description,
            icon_url,
            type: type as any,
            platform,
            display_order,
            is_active
        }, user.id);

        return json({ link }, { status: 201 });
    } catch (error) {
        console.error('Error creating link:', error);
        return json({ error: 'Failed to create link' }, { status: 500 });
    }
};

// PUT /api/links/manage - Update link with icon upload (admin/moderator only)
export const PUT: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        
        const id = formData.get('id') as string;
        if (!id) {
            return json({ error: 'Link ID is required' }, { status: 400 });
        }
        
        // Get existing link to check for old icon
        const existingLinks = await getLinks();
        const existingLink = existingLinks.find(l => l.id === id);
        const previousIconUrl = formData.get('previousIconUrl') as string | null;

        const updateData: any = {};
        
        if (formData.has('title')) updateData.title = formData.get('title') as string;
        if (formData.has('url')) updateData.url = formData.get('url') as string;
        if (formData.has('description')) updateData.description = formData.get('description') as string;
        if (formData.has('type')) updateData.type = formData.get('type') as string;
        if (formData.has('platform')) updateData.platform = formData.get('platform') as string;
        if (formData.has('display_order')) updateData.display_order = parseInt(formData.get('display_order') as string);
        if (formData.has('is_active')) updateData.is_active = formData.get('is_active') === 'true';

        if (updateData.url) {
            try {
                new URL(updateData.url);
            } catch {
                return json({ error: 'Invalid URL format' }, { status: 400 });
            }
        }

        // Handle icon upload
        const iconFile = formData.get('icon') as File | null;
        
        if (iconFile && iconFile.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
            if (!allowedTypes.includes(iconFile.type)) {
                return json({ error: 'Invalid icon format. Use JPEG, PNG, GIF, SVG, or WebP' }, { status: 400 });
            }
            
            if (iconFile.size > 2 * 1024 * 1024) {
                return json({ error: 'Icon too large. Max 2MB' }, { status: 400 });
            }

            const ext = extname(iconFile.name) || '.png';
            const fileName = `link-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            const dir = resolve(UPLOAD_BASE_DIR, 'links');
            await mkdir(dir, { recursive: true });
            
            const filePath = resolve(dir, fileName);
            const arrayBuffer = await iconFile.arrayBuffer();
            await writeFile(filePath, Buffer.from(arrayBuffer));
            
            updateData.icon_url = `/uploads/links/${fileName}`;
            
            // Delete old icon after successful upload
            const oldIconToDelete = previousIconUrl || existingLink?.icon_url;
            if (oldIconToDelete) {
                await deleteOldIcon(oldIconToDelete);
            }
        }

        const link = await updateLink(id, updateData, user.id);
        if (!link) {
            return json({ error: 'Link not found' }, { status: 404 });
        }

        return json({ link });
    } catch (error) {
        console.error('Error updating link:', error);
        return json({ error: 'Failed to update link' }, { status: 500 });
    }
};

// DELETE /api/links/manage - Delete link (admin only)
export const DELETE: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;
    
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can delete links
    if (user.role !== 'admin') {
        return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    try {
        const { id } = await request.json();
        if (!id) {
            return json({ error: 'Link ID is required' }, { status: 400 });
        }

        // Get existing link to delete icon
        const existingLinks = await getLinks();
        const existingLink = existingLinks.find(l => l.id === id);

        const success = await deleteLink(id);
        if (!success) {
            return json({ error: 'Link not found' }, { status: 404 });
        }
        
        // Delete icon file if exists
        if (existingLink?.icon_url) {
            await deleteOldIcon(existingLink.icon_url);
        }
        
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting link:', error);
        return json({ error: 'Failed to delete link' }, { status: 500 });
    }
};
