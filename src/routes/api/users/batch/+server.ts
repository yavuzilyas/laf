import { json } from '@sveltejs/kit';
import { getUsers } from '$db/queries';

export async function POST({ request }) {
    try {
        const { ids } = await request.json();
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return json([]);
        }

        // Get users by IDs
        const users = await getUsers({ id: { $in: ids } });
        
        // Return only necessary user data for security
        const sanitizedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname
        }));

        return json(sanitizedUsers);
    } catch (error) {
        console.error('Batch user fetch error:', error);
        return json([], { status: 500 });
    }
}
