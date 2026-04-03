import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$db/pg';

// GET /api/events/[id]/attendees - List all attendees for an event
export const GET: RequestHandler = async ({ params }) => {
  try {
    const eventId = params.id;

    if (!eventId) {
      return json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT 
        ea.id,
        ea.user_id as "userId",
        COALESCE(u.username, ea.name) as name,
        u.email,
        u.phone_number as phone,
        ea.joined_at as "joinedAt"
      FROM event_attendees ea
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
      ORDER BY ea.joined_at DESC
    `, [eventId]);

    return json({
      success: true,
      attendees: result.rows
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return json(
      { success: false, error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
};

// POST /api/events/[id]/attendees - Add an attendee by user ID
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const eventId = params.id;
    const { userId } = await request.json();
    const currentUser = locals.user;

    if (!eventId) {
      return json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin/moderator or the event creator
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get user info if userId provided
    let attendeeName = 'Misafir';
    let attendeeEmail = null;

    if (userId) {
      const userResult = await query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rowCount && userResult.rowCount > 0) {
        attendeeName = userResult.rows[0].username;
        attendeeEmail = userResult.rows[0].email;
      }
    }

    // Check if already joined
    const existingResult = await query(
      'SELECT id FROM event_attendees WHERE event_id = $1 AND (user_id = $2 OR email = $3)',
      [eventId, userId || null, attendeeEmail]
    );

    if (existingResult.rowCount && existingResult.rowCount > 0) {
      return json(
        { success: false, error: 'User already joined this event' },
        { status: 400 }
      );
    }

    // Add attendee
    const result = await query(`
      INSERT INTO event_attendees (event_id, user_id, name, email)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id as "userId", name, email, joined_at as "joinedAt"
    `, [eventId, userId || null, attendeeName, attendeeEmail]);

    return json({
      success: true,
      attendee: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    return json(
      { success: false, error: 'Failed to add attendee' },
      { status: 500 }
    );
  }
};
