import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
    getNotificationsAPI,
    markNotificationsReadAPI,
    markAllNotificationsReadAPI,
    deleteNotificationAPI,
    blockUserAPI,
    unblockUserAPI
} from '$lib/server/notifications-pg';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const page = Number(url.searchParams.get('page') ?? '1');
	const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

	try {
		const result = await getNotificationsAPI(user.id, page, pageSize);
		return json(result);
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const { ids } = await request.json();
		if (!Array.isArray(ids) || ids.length === 0) return json({ success: false });

		const result = await markNotificationsReadAPI(user.id, ids);
		return json(result);
	} catch (error) {
		console.error('Error marking notifications as read:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	const user = (locals as any)?.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const { action, actorId, notificationId } = await request.json();

		if (action === 'markAllRead') {
			const result = await markAllNotificationsReadAPI(user.id);
			return json(result);
		}

		if (action === 'delete' && notificationId) {
			const result = await deleteNotificationAPI(user.id, notificationId);
			return json(result);
		}

		if (action === 'blockUser' && actorId) {
			const result = await blockUserAPI(user.id, actorId);
			return json(result);
		}

		if (action === 'unblockUser' && actorId) {
			const result = await unblockUserAPI(user.id, actorId);
			return json(result);
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error in notification action:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
