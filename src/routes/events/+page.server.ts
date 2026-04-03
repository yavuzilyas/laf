import type { PageServerLoad } from './$types';
import { query } from '$db/pg';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const currentUser = locals.user;
    
    // Fetch all active events and announcements
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
        created_at as "createdAt"
      FROM events
      WHERE is_active = true
      ORDER BY date DESC
    `);

    // Add isPast flag and check if user joined
    const now = new Date();
    const events = await Promise.all(result.rows.map(async (event) => {
      const isPast = new Date(event.date) < now;
      let hasJoined = false;
      let attendees: any[] = [];
      
      // Check if current user joined this event
      if (currentUser?.id) {
        const joinResult = await query(
          'SELECT id FROM event_attendees WHERE event_id = $1 AND (user_id = $2 OR email = $3)',
          [event.id, currentUser.id, currentUser.email]
        );
        hasJoined = joinResult.rowCount ? joinResult.rowCount > 0 : false;
      }
      
      // Load attendees for this event
      const attendeesResult = await query(`
        SELECT ea.id, COALESCE(u.username, ea.name) as name, u.email, u.avatar_url
        FROM event_attendees ea
        LEFT JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = $1
        ORDER BY ea.joined_at DESC
      `, [event.id]);
      attendees = attendeesResult.rows;
      
      return {
        ...event,
        isPast,
        hasJoined,
        attendees
      };
    }));

    return {
      events,
      user: currentUser
    };
  } catch (error) {
    console.error('Error loading events:', error);
    return {
      events: []
    };
  }
};
