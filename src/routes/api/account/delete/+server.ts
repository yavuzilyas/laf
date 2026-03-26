// @ts-ignore - SvelteKit types
import { json } from '@sveltejs/kit';
import { updateUser } from '$db/queries';
import { TRASH_HOLD_MS } from '$lib/server/moderation/constants';

// @ts-ignore - SvelteKit request types
export async function DELETE({ cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ errorKey: 'auth.errors.unauthorized' }, { status: 401 });
  }

  try {
    const userId = session;
    const now = new Date();

    const result = await updateUser(userId, {
      deletion_timestamp: new Date(now.getTime() + TRASH_HOLD_MS),
      deleted_at: now,
      deleted_by: userId,
      delete_reason: 'User requested deletion',
      status: 'silinecek',
      is_banned: true,
      is_hidden: true,
      moderation_action: {
        action: 'deleted',
        reason: 'User requested deletion',
        timestamp: now,
        moderatorId: userId,
        moderatorName: 'System'
      }
    });

    if (!result) {
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