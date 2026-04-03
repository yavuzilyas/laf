import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$db/pg';

// GET /api/events - List all active events (public endpoint)
export const GET: RequestHandler = async ({ url }) => {
  try {
    const city = url.searchParams.get('city');
    const type = url.searchParams.get('type');
    
    let sql = `
      SELECT 
        id,
        title,
        description,
        date,
        end_date as "endDate",
        city,
        location,
        type,
        category,
        image_url as "imageUrl",
        link,
        attendee_count as "attendeeCount",
        is_active as "isActive",
        created_at as "createdAt"
      FROM events
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (city && city !== 'Türkiye') {
      sql += ` AND (city = $${paramIndex} OR city = 'Türkiye')`;
      params.push(city);
      paramIndex++;
    }
    
    if (type && ['event', 'announcement'].includes(type)) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    sql += ` ORDER BY date DESC`;
    
    const result = await query(sql, params);

    return json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    return json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
};
