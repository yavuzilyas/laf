// @ts-ignore - SvelteKit types
import { json } from '@sveltejs/kit';
import { getUsers, updateUser } from '$db/queries';

// @ts-ignore - SvelteKit request types
export async function POST({ request, cookies }) {
	try {
		const { isHidden } = await request.json();

		// Check if user is authenticated via session
		const userId = cookies.get('session');
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const now = new Date();

		// Get current user data
		const [userDoc] = await getUsers({ id: userId });
		if (!userDoc) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const result = await updateUser(userId, {
			is_hidden: isHidden,
			status: isHidden ? 'hidden' : 'active',
			hidden_at: isHidden ? now : null,
			hidden_reason: isHidden ? 'User preference' : null,
			moderation_action: {
				action: isHidden ? 'hidden' : 'unhidden',
				reason: 'User preference',
				timestamp: now,
				byUser: true
			}
		});

		if (!result) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ 
			success: true, 
			message: isHidden ? 'Profile hidden successfully' : 'Profile unhidden successfully',
			isHidden 
		});

	} catch (error) {
		return json({ error: 'Server error' }, { status: 500 });
	}
}

// @ts-ignore - SvelteKit request types
export async function GET({ cookies }) {
	try {
		// Check if user is authenticated via session
		const userId = cookies.get('session');
		if (!userId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Get current user data
		const [userDoc] = await getUsers({ id: userId });
		if (!userDoc) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ 
			isHidden: userDoc.is_hidden || false 
		});

	} catch (error) {
		return json({ error: 'Server error' }, { status: 500 });
	}
}
