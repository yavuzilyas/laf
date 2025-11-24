import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUsersCollection, toObjectId } from '$db/mongo';

export const POST: RequestHandler = async ({ locals, params }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { userId } = params;
	if (!userId || userId === user.id) {
		return json({ error: 'Invalid user' }, { status: 400 });
	}

	try {
		const usersCol = await getUsersCollection();
		
		// Check if target user exists
		const targetUser = await usersCol.findOne({ _id: toObjectId(userId) });
		if (!targetUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Check if already blocked
		const currentUser = await usersCol.findOne({ 
			_id: toObjectId(user.id),
			'blocked.blockedUserId': toObjectId(userId)
		});

		if (currentUser) {
			return json({ error: 'Already blocked' }, { status: 400 });
		}

		// Add block relationship
		await usersCol.updateOne(
			{ _id: toObjectId(user.id) },
			{ 
				$push: { 
					blocked: {
						blockedUserId: toObjectId(userId),
						blockedAt: new Date()
					}
				}
			}
		);

		// Remove follow relationships if they exist
		await usersCol.updateOne(
			{ _id: toObjectId(user.id) },
			{ $pull: { following: { followingUserId: toObjectId(userId) } } }
		);

		await usersCol.updateOne(
			{ _id: toObjectId(userId) },
			{ $pull: { followers: { followerUserId: toObjectId(user.id) } } }
		);

		return json({ success: true, blocked: true });
	} catch (error) {
		console.error('Block error:', error);
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
		const usersCol = await getUsersCollection();
		
		// Remove block relationship
		await usersCol.updateOne(
			{ _id: toObjectId(user.id) },
			{ $pull: { blocked: { blockedUserId: toObjectId(userId) } } }
		);

		return json({ success: true, blocked: false });
	} catch (error) {
		console.error('Unblock error:', error);
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
		const usersCol = await getUsersCollection();
		
		// Check if blocked
		const currentUser = await usersCol.findOne({ 
			_id: toObjectId(user.id),
			'blocked.blockedUserId': toObjectId(userId)
		});

		return json({ 
			blocked: !!currentUser
		});
	} catch (error) {
		console.error('Check block status error:', error);
		return json({ error: 'Failed to check block status' }, { status: 500 });
	}
};
