import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUsers, blockUserRelation, unblockUserRelation, isUserBlockedRelation, unfollowUser } from '$db/queries';

export const POST: RequestHandler = async ({ locals, params }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { userId } = params;
	if (!userId || userId === user.id) {
		return json({ error: 'Invalid user' }, { status: 400 });
	}

	try {
		// Check if target user exists
		const targetUsers = await getUsers({ id: userId });
		if (!targetUsers.length) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Check if already blocked
		const alreadyBlocked = await isUserBlockedRelation(user.id, userId);
		if (alreadyBlocked) {
			return json({ error: 'Already blocked' }, { status: 400 });
		}

		// Add block relationship
		await blockUserRelation(user.id, userId);

		// Remove follow relationships if they exist
		try {
			await unfollowUser(user.id, userId);
			await unfollowUser(userId, user.id);
		} catch (error) {
			// Ignore errors if follow relationships don't exist
		}

		return json({ success: true, blocked: true });
	} catch (error) {
		return json({ error: 'Failed to block user' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { userId } = params;
	if (!userId || userId === user.id) {
		return json({ error: 'Invalid user' }, { status: 400 });
	}

	try {
		// Remove block relationship
		await unblockUserRelation(user.id, userId);

		return json({ success: true, blocked: false });
	} catch (error) {
		return json({ error: 'Failed to unblock user' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { userId } = params;
	if (!userId) {
		return json({ error: 'Invalid user' }, { status: 400 });
	}

	try {
		// Check if blocked
		const blocked = await isUserBlockedRelation(user.id, userId);

		return json({ 
			blocked
		});
	} catch (error) {
		return json({ error: 'Failed to check block status' }, { status: 500 });
	}
};
