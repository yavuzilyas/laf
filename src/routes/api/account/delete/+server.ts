// @ts-ignore - SvelteKit types
import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
// @ts-ignore - MongoDB types
import { ObjectId } from 'mongodb';
import { TRASH_HOLD_MS } from '$lib/server/moderation/constants';

// @ts-ignore - SvelteKit request types
export async function DELETE({ cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ errorKey: 'auth.errors.unauthorized' }, { status: 401 });
  }

  try {
    const users = await getUsersCollection();
    const userId = new ObjectId(session);
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + TRASH_HOLD_MS);

    const result = await users.updateOne(
      { _id: userId },
      {
        $set: {
          'deletion.pending': true,
          'deletion.status': 'user_requested',
          'deletion.requestedAt': now,
          'deletion.scheduledAt': scheduledAt,
          'deletion.source': 'user',
          // Anında gizle
          banned: true,
          hidden: true,
          status: 'deleted',
          'moderationAction': {
            action: 'deleted',
            reason: 'User requested deletion',
            timestamp: now,
            moderatorId: userId,
            moderatorName: 'System'
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return json({ errorKey: 'auth.errors.userNotFound' }, { status: 404 });
    }

    // Session cookie'sini temizle
    cookies.delete('session', { path: '/' });
    
    return json({ success: true, successKey: 'auth.success.accountDeleted' });
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    return json({ errorKey: 'auth.errors.serverError' }, { status: 500 });
  }
}