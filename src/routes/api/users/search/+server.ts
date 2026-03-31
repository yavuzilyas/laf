import { json } from '@sveltejs/kit';
import { getUsers } from '$db/queries';

export async function GET({ url }) {
    const query = url.searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
        return json([]);
    }

    try {
        const users = await getUsers({ username: query.trim() });
        
        // Return only necessary user data for security
        const sanitizedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname
        }));

        return json(sanitizedUsers);
    } catch (error) {
        return json([], { status: 500 });
    }
}
