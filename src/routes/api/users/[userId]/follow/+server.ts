import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUsers, followUser, unfollowUser, isFollowing, getFollowCounts, createNotification } from '$db/queries';

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

		// Check if already following
		const alreadyFollowing = await isFollowing(user.id, userId);
		if (alreadyFollowing) {
			return json({ error: 'Already following' }, { status: 400 });
		}

		// Add follow relationship
		await followUser(user.id, userId);

		// Create follow notification
		await createNotification({
			user_id: userId,
			type: 'follow',
			title: { key: 'notifications.messages.newFollower' },
			content: { key: 'notifications.messages.newFollower' },
			data: {
				link: `/${user.nickname}`,
				actor: {
					id: user.id,
					nickname: user.nickname,
					name: user.name
				},
				meta: {
					followerId: user.id
				}
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
		// Remove follow relationship
		await unfollowUser(user.id, userId);

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
		// Check if following
		const following = await isFollowing(user.id, userId);

		// Get follower/following counts
		const counts = await getFollowCounts(userId);

		return json({ 
			following,
			followersCount: counts.followersCount,
			followingCount: counts.followingCount
		});
	} catch (error) {
		console.error('Check follow status error:', error);
		return json({ error: 'Failed to check follow status' }, { status: 500 });
	}
};
