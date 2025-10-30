import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ObjectId } from 'mongodb';
import { getNotificationsCollection } from '$db/mongo';
import { normalizeNotification } from '$lib/server/notifications';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
	const skip = (page - 1) * pageSize;

	const notificationsCol = await getNotificationsCollection();
	const userId = new ObjectId(user.id);
	const cursor = notificationsCol
		.find({ userId })
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(pageSize);

	const total = await notificationsCol.countDocuments({ userId });
	const docs = await cursor.toArray();
	const data = docs.map(normalizeNotification);

	const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });

	// Fetch blocked actors for this user
	const blockedUsersCol = notificationsCol.db.collection('blockedUsers');
	const blockedDoc = await blockedUsersCol.findOne({ userId });
	const blockedActorIds: string[] = Array.isArray(blockedDoc?.blockedActorIds)
		? blockedDoc!.blockedActorIds.map((x: any) => String(x))
		: [];

	return json({ data, total, page, pageSize, unreadCount, blockedActorIds });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { ids } = await request.json();
	if (!Array.isArray(ids) || ids.length === 0) return json({ success: false });

	const notificationsCol = await getNotificationsCollection();
	const userId = new ObjectId(user.id);
	const objectIds = ids.filter(Boolean).map((id: string) => new ObjectId(id));
	if (!objectIds.length) return json({ success: false });

	await notificationsCol.updateMany(
		{ userId, _id: { $in: objectIds } },
		{ $set: { read: true, readAt: new Date() } }
	);

	const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });
	return json({ success: true, unreadCount });
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { action, actorId, notificationId } = await request.json();

	if (action === 'markAllRead') {
		const notificationsCol = await getNotificationsCollection();
		const userId = new ObjectId(user.id);

		await notificationsCol.updateMany(
			{ userId, read: { $ne: true } },
			{ $set: { read: true, readAt: new Date() } }
		);

		const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });
		return json({ success: true, unreadCount, action: 'markAllRead' });
	}

	if (action === 'delete' && notificationId) {
		const notificationsCol = await getNotificationsCollection();
		const userId = new ObjectId(user.id);
		const objectId = new ObjectId(notificationId);

		await notificationsCol.deleteOne({ userId, _id: objectId });

		const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });
		return json({ success: true, unreadCount, action: 'delete' });
	}

	if (action === 'blockUser' && actorId) {
		const notificationsCol = await getNotificationsCollection();
		const userId = new ObjectId(user.id);

		// Block future notifications from this user by adding to blockedUsers collection
		const blockedUsersCol = notificationsCol.db.collection('blockedUsers');
		await blockedUsersCol.updateOne(
			{ userId },
			{ $addToSet: { blockedActorIds: actorId } },
			{ upsert: true }
		);

		// Also delete existing notifications from this user
		await notificationsCol.deleteMany({
			userId,
			'actor.id': actorId
		});

		const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });
		return json({ success: true, unreadCount, action: 'blockUser' });
	}

	if (action === 'unblockUser' && actorId) {
		const notificationsCol = await getNotificationsCollection();
		const userId = new ObjectId(user.id);

		const blockedUsersCol = notificationsCol.db.collection('blockedUsers');
		await blockedUsersCol.updateOne(
			{ userId },
			{ $pull: { blockedActorIds: actorId } },
			{ upsert: true }
		);

		const unreadCount = await notificationsCol.countDocuments({ userId, read: { $ne: true } });
		return json({ success: true, unreadCount, action: 'unblockUser' });
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};
