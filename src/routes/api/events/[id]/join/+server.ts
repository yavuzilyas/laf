import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$db/pg';

// POST /api/events/[id]/join - Join an event
export const POST: RequestHandler = async ({ params, locals }) => {
  try {
    const eventId = params.id;
    const user = locals.user;
    
    if (!eventId) {
      return json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and is active
    const eventResult = await query(
      'SELECT id, is_active FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rowCount === 0) {
      return json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];
    if (!event.is_active) {
      return json(
        { success: false, error: 'Event is not active' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const existingJoin = await query(
      'SELECT id FROM event_attendees WHERE event_id = $1 AND (user_id = $2 OR email = $3)',
      [eventId, user?.id || null, user?.email || null]
    );

    if (existingJoin.rowCount && existingJoin.rowCount > 0) {
      return json(
        { success: false, error: 'Already joined this event' },
        { status: 400 }
      );
    }

    // Add attendee
    const result = await query(
      `INSERT INTO event_attendees (event_id, user_id, name, email) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, joined_at`,
      [eventId, user?.id || null, user?.name || 'Misafir', user?.email || null]
    );

    // Get updated attendee count
    const countResult = await query(
      'SELECT attendee_count FROM events WHERE id = $1',
      [eventId]
    );

    return json({
      success: true,
      attendee: result.rows[0],
      attendeeCount: countResult.rows[0]?.attendeeCount || 0
    });
  } catch (error) {
    console.error('Error joining event:', error);
    return json(
      { success: false, error: 'Failed to join event' },
      { status: 500 }
    );
  }
};

// DELETE /api/events/[id]/join - Leave an event
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const eventId = params.id;
    const user = locals.user;
    
    if (!eventId) {
      return json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!user?.id) {
      return json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove attendee
    const result = await query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING id',
      [eventId, user.id]
    );

    if (result.rowCount === 0) {
      return json(
        { success: false, error: 'Not joined to this event' },
        { status: 400 }
      );
    }

    // Get updated attendee count
    const countResult = await query(
      'SELECT attendee_count FROM events WHERE id = $1',
      [eventId]
    );

    return json({
      success: true,
      attendeeCount: countResult.rows[0]?.attendeeCount || 0
    });
  } catch (error) {
    console.error('Error leaving event:', error);
    return json(
      { success: false, error: 'Failed to leave event' },
      { status: 500 }
    );
  }
};

// GET /api/events/[id]/join - Check if user joined
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const eventId = params.id;
    const user = locals.user;
    
    if (!eventId || !user?.id) {
      return json({ joined: false });
    }

    const result = await query(
      'SELECT id FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, user.id]
    );

    return json({
      joined: result.rowCount ? result.rowCount > 0 : false
    });
  } catch (error) {
    console.error('Error checking join status:', error);
    return json({ joined: false });
  }
};
