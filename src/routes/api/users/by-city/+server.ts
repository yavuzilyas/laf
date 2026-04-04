import { json } from '@sveltejs/kit';
import { query } from '$db/pg';

export async function GET({ url, locals }) {
    const city = url.searchParams.get('city');
    const currentUserId = locals.user?.id || locals.user?._id;
    
    if (!city || city.trim().length < 2) {
        return json([]);
    }

    try {
        let sql;
        let params;

        if (currentUserId) {
            // Join with follows table to get the connection status for the logged-in user
            sql = `
                SELECT u.id, u.username, u.name, u.surname, u.email, u.location, u.avatar_url,
                       (f.follower_id IS NOT NULL) as is_following
                FROM users u
                LEFT JOIN follows f ON f.following_id = u.id AND f.follower_id = $2
                WHERE u.location ILIKE $1
                AND (u.status IS NULL OR u.status != 'banned')
                ORDER BY u.username ASC
                LIMIT 100
            `;
            const pattern = `%${city.trim()}%`;
            params = [pattern, currentUserId];
        } else {
            // Unauthenticated version
            sql = `
                SELECT id, username, name, surname, email, location, avatar_url,
                       false as is_following
                FROM users
                WHERE location ILIKE $1
                AND (status IS NULL OR status != 'banned')
                ORDER BY username ASC
                LIMIT 100
            `;
            const pattern = `%${city.trim()}%`;
            params = [pattern];
        }
        
        const result = await query(sql, params);
        
        // Return sanitized user data
        const users = result.rows.map(user => ({
            id: user.id || user._id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            location: user.location,
            avatar: user.avatar_url,
            isFollowing: !!user.is_following
        }));

        return json(users);
    } catch (error) {
        console.error('Fetch users by city error:', error);
        return json([], { status: 500 });
    }
}
