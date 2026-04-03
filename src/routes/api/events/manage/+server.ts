import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$db/pg';
import { notifyAllUsersAboutEvent } from '$lib/server/notifications-pg';

// GET /api/events/manage - List all events (moderators/admins only)
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = (locals as any)?.user;
    
    // Check if user is moderator or admin
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      return json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const result = await query(`
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
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM events
      ORDER BY date DESC
    `);

    return json({ success: true, events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    return json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
};

// POST /api/events/manage - Create new event
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    const result = await query(`
      INSERT INTO events (
        title, description, date, end_date, city, location,
        type, category, image_url, link, attendee_count, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
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
    `, [
      data.title,
      data.description,
      data.date,
      data.endDate || null,
      data.city,
      data.location,
      data.type,
      data.category,
      data.imageUrl || null,
      data.link || null,
      data.attendeeCount || 0,
      data.isActive ?? true,
      user.id
    ]);

    const event = result.rows[0];

    // Send notifications to all users
    try {
      await notifyAllUsersAboutEvent({
        eventId: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        creatorId: user.id,
        creatorName: user.name || user.username || 'Moderatör'
      });
    } catch (notifyError) {
      console.error('Error sending event notifications:', notifyError);
      // Don't fail the request if notifications fail
    }

    return json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    return json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
};

// PUT /api/events/manage - Update event
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    const result = await query(`
      UPDATE events SET
        title = $1,
        description = $2,
        date = $3,
        end_date = $4,
        city = $5,
        location = $6,
        type = $7,
        category = $8,
        image_url = $9,
        link = $10,
        attendee_count = $11,
        is_active = $12,
        updated_by = $13
      WHERE id = $14
      RETURNING 
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
        updated_at as "updatedAt"
    `, [
      data.title,
      data.description,
      data.date,
      data.endDate || null,
      data.city,
      data.location,
      data.type,
      data.category,
      data.imageUrl || null,
      data.link || null,
      data.attendeeCount || 0,
      data.isActive ?? true,
      user.id,
      data.id
    ]);

    if (result.rowCount === 0) {
      return json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Error updating event:', error);
    return json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
};

// DELETE /api/events/manage - Delete event
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await request.json();
    
    const result = await query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
};
