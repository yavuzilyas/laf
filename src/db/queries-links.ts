import db from '$db/pg';
import type { Link, LinkInput } from '$lib/types/link';

export async function getLinks(filters?: { type?: string; isActive?: boolean }): Promise<Link[]> {
    let query = 'SELECT * FROM links WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(filters.type);
    }

    if (filters?.isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(filters.isActive);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
}

export async function getLinkById(id: string): Promise<Link | null> {
    const result = await db.query('SELECT * FROM links WHERE id = $1', [id]);
    return result.rows[0] || null;
}

export async function getLinkByDisplayOrder(displayOrder: number, excludeId?: string): Promise<Link | null> {
    let query = 'SELECT * FROM links WHERE display_order = $1';
    const params: any[] = [displayOrder];
    
    if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
    }
    
    query += ' LIMIT 1';
    
    const result = await db.query(query, params);
    return result.rows[0] || null;
}

export async function createLink(link: LinkInput, userId: string): Promise<Link> {
    const result = await db.query(
        `INSERT INTO links (title, url, description, icon_url, type, platform, display_order, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
            link.title,
            link.url,
            link.description,
            link.icon_url,
            link.type || 'social',
            link.platform,
            link.display_order || 0,
            link.is_active !== undefined ? link.is_active : true,
            userId
        ]
    );
    return result.rows[0];
}

export async function updateLink(id: string, link: Partial<LinkInput>, userId: string): Promise<Link | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (link.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(link.title);
    }
    if (link.url !== undefined) {
        updates.push(`url = $${paramIndex++}`);
        params.push(link.url);
    }
    if (link.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(link.description);
    }
    if (link.icon_url !== undefined) {
        updates.push(`icon_url = $${paramIndex++}`);
        params.push(link.icon_url);
    }
    if (link.type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        params.push(link.type);
    }
    if (link.platform !== undefined) {
        updates.push(`platform = $${paramIndex++}`);
        params.push(link.platform);
    }
    if (link.display_order !== undefined) {
        updates.push(`display_order = $${paramIndex++}`);
        params.push(link.display_order);
    }
    if (link.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(link.is_active);
    }

    updates.push(`updated_by = $${paramIndex++}`);
    params.push(userId);

    params.push(id);

    const query = `UPDATE links SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, params);
    return result.rows[0] || null;
}

export async function deleteLink(id: string): Promise<boolean> {
    const result = await db.query('DELETE FROM links WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
}

export async function incrementLinkClick(id: string): Promise<void> {
    await db.query('UPDATE links SET click_count = click_count + 1 WHERE id = $1', [id]);
}
