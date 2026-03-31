import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers, updateUserAuthFields } from '$db/queries';
import pkg from 'argon2';
const { verify, hash } = pkg;

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Check if user is authenticated via session
		const session = cookies.get('session');
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { currentPassword, newPassword } = await request.json();

		// Validate input
		if (!currentPassword || !newPassword) {
			return json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 8) {
			return json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
		}

		// Get user from database
		const users = await getUsers({ id: session });
		if (users.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = users[0];
		const currentPasswordHash = user.password_hash;

		// Verify current password
		const isCurrentPasswordValid = await verify(currentPasswordHash, currentPassword);
		if (!isCurrentPasswordValid) {
			return json({ error: 'Current password is incorrect' }, { status: 400 });
		}

		// Hash new password
		const newPasswordHash = await hash(newPassword);

		// Update password in database
		await updateUserAuthFields(user.id, {
			password_hash: newPasswordHash
		});

		return json({ success: true, message: 'Password changed successfully' });

	} catch (error) {
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
