import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUsersCollection, toObjectId } from '$db/mongo';
import { createNotification } from '$lib/server/notifications';

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

		// Check if already following
		const currentUser = await usersCol.findOne({ 
			_id: toObjectId(user.id),
			'following.followingUserId': toObjectId(userId)
		});

		if (currentUser) {
			return json({ error: 'Already following' }, { status: 400 });
		}

		// Add follow relationship
		await usersCol.updateOne(
			{ _id: toObjectId(user.id) },
			{ 
				$push: { 
					following: {
						followingUserId: toObjectId(userId),
						followedAt: new Date()
					}
				}
			}
		);

		// Add to target user's followers
		await usersCol.updateOne(
			{ _id: toObjectId(userId) },
			{ 
				$push: { 
					followers: {
						followerUserId: toObjectId(user.id),
						followedAt: new Date()
					}
				}
			}
		);

		// Create follow notification
		await createNotification({
			userId: userId,
			type: 'follow',
			title: { key: 'notifications.messages.newFollower' },
			message: { key: 'notifications.messages.newFollower' },
			link: `/${user.nickname}`,
			actor: {
				id: user.id,
				nickname: user.nickname,
				name: user.name
			},
			meta: {
				followerId: user.id
			}
		});

		return json({ success: true, following: true });
	} catch (error) {
		console.error('Follow error:', error);
		return json({ error: 'Failed to follow user' }, { status: 500 });
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
		
		// Remove follow relationship
		await usersCol.updateOne(
			{ _id: toObjectId(user.id) },
			{ $pull: { following: { followingUserId: toObjectId(userId) } } }
		);

		// Remove from target user's followers
		await usersCol.updateOne(
			{ _id: toObjectId(userId) },
			{ $pull: { followers: { followerUserId: toObjectId(user.id) } } }
		);

		return json({ success: true, following: false });
	} catch (error) {
		console.error('Unfollow error:', error);
		return json({ error: 'Failed to unfollow user' }, { status: 500 });
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
		
		// Check if following
		const currentUser = await usersCol.findOne({ 
			_id: toObjectId(user.id),
			'following.followingUserId': toObjectId(userId)
		});

		// Get follower/following counts
		const targetUser = await usersCol.findOne(
			{ _id: toObjectId(userId) },
			{ 
				projection: { 
					followers: { $size: { $ifNull: ['$followers', []] } },
					following: { $size: { $ifNull: ['$following', []] } }
				}
			}
		);

		return json({ 
			following: !!currentUser,
			followersCount: targetUser?.followers || 0,
			followingCount: targetUser?.following || 0
		});
	} catch (error) {
		console.error('Check follow status error:', error);
		return json({ error: 'Failed to check follow status' }, { status: 500 });
	}
};
