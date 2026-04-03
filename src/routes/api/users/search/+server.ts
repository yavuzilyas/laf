import { json } from '@sveltejs/kit';
import { searchUsers } from '$db/queries';

export async function GET({ url }) {
    const query = url.searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
        return json([]);
    }

    try {
        // Use optimized search function with 20 result limit
        const users = await searchUsers(query.trim(), 20);
        
        // Return only necessary user data for security
        const sanitizedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            email: user.email,
            phone_number: user.phone_number,
            location: user.location,
            avatar_url: user.avatar_url
        }));

        return json(sanitizedUsers);
    } catch (error) {
        console.error('User search error:', error);
        return json([], { status: 500 });
    }
}
