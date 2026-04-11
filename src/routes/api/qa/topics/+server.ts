import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// GET - List all question topics
export async function GET({ locals }: RequestEvent) {
    try {
        const result = await query(`
            SELECT 
                id, 
                name, 
                slug, 
                description, 
                display_order,
                is_active
            FROM question_topics 
            WHERE is_active = true
            ORDER BY display_order ASC, name ASC
        `);

        const topics = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            displayOrder: row.display_order
        }));

        return json({ topics });

    } catch (error) {
        console.error('Error fetching topics:', error);
        return json({ error: 'Konular yüklenirken bir hata oluştu' }, { status: 500 });
    }
}

// POST - Create a new topic (moderators only)
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const data = await request.json();
        const { name, slug, description, displayOrder = 0 } = data;

        if (!name || !slug) {
            return json({ error: 'İsim ve slug gerekli' }, { status: 400 });
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            return json({ error: 'Slug sadece küçük harf, rakam ve tire içerebilir' }, { status: 400 });
        }

        const result = await query(`
            INSERT INTO question_topics (name, slug, description, display_order)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (slug) DO UPDATE 
            SET name = EXCLUDED.name, 
                description = EXCLUDED.description,
                display_order = EXCLUDED.display_order
            RETURNING id, name, slug, description, display_order
        `, [name.trim(), slug.trim(), description || null, displayOrder]);

        const topic = result.rows[0];

        return json({
            success: true,
            topic: {
                id: topic.id,
                name: topic.name,
                slug: topic.slug,
                description: topic.description,
                displayOrder: topic.display_order
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating topic:', error);
        return json({ error: 'Konu oluşturulurken bir hata oluştu' }, { status: 500 });
    }
}
