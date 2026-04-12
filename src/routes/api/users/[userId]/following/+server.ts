import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// GET - Get list of users that the specified user is following
export async function GET({ params, locals }: RequestEvent) {
    try {
        const { userId } = params;
        const currentUser = (locals as any)?.user;
        
        // Validate userId
        if (!userId) {
            return json({ error: 'User ID is required' }, { status: 400 });
        }

        // Check if the requesting user is authenticated
        if (!currentUser) {
            return json({ error: 'Authentication required' }, { status: 401 });
        }

        // Users can only see their own following list
        if (currentUser.id !== userId) {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get the list of users being followed
        const followingQuery = `
            SELECT 
                u.id,
                u.username,
                u.nickname,
                u.name,
                u.surname,
                u.avatar_url,
                u.bio,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
        `;

        const result = await query(followingQuery, [userId]);

        const users = result.rows.map(row => ({
            id: row.id,
            username: row.username,
            nickname: row.nickname,
            name: row.name,
            surname: row.surname,
            avatar: row.avatar_url,
            bio: row.bio,
            followedAt: row.followed_at
        }));

        return json({ users });

    } catch (error) {
        console.error('Error fetching following list:', error);
        return json({ error: 'Failed to fetch following list' }, { status: 500 });
    }
}
