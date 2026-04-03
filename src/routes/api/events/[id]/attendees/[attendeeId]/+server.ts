import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$db/pg';

// DELETE /api/events/[id]/attendees/[attendeeId] - Remove an attendee
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const { id: eventId, attendeeId } = params;
    const currentUser = locals.user;

    if (!eventId || !attendeeId) {
      return json(
        { success: false, error: 'Event ID and Attendee ID are required' },
        { status: 400 }
      );
    }

    // Check if user is admin/moderator
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete attendee
    const result = await query(
      'DELETE FROM event_attendees WHERE id = $1 AND event_id = $2 RETURNING id',
      [attendeeId, eventId]
    );

    if (result.rowCount === 0) {
      return json(
        { success: false, error: 'Attendee not found' },
        { status: 404 }
      );
    }

    return json({
      success: true,
      message: 'Attendee removed successfully'
    });
  } catch (error) {
    console.error('Error removing attendee:', error);
    return json(
      { success: false, error: 'Failed to remove attendee' },
      { status: 500 }
    );
  }
};
