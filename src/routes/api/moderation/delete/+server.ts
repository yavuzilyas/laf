import { json } from '@sveltejs/kit';
import { getUsers, updateUser } from '$db/queries';
import { TRASH_HOLD_MS } from '$lib/server/moderation/constants';



const resolveRole = (user?: { role?: string; type?: string }) => user?.role ?? user?.type ?? 'user';

const getRoleRank = (role?: string | null) => {

  const normalized = (role ?? 'user').toLowerCase();

  if (normalized === 'admin') return 3;

  if (normalized === 'moderator') return 2;

  return 1;

};



// @ts-ignore - SvelteKit request types

export async function POST({ request, cookies }) {

  try {

    const { userId, reason, moderatorId, verificationToken } = await request.json();



    if (!userId || !reason || !moderatorId) {

      return json({ error: 'Missing required fields' }, { status: 400 });

    }



    const now = new Date();



    // Get current user and target user to check ranks

    const [moderatorDoc, targetUserDoc] = await Promise.all([
      getUsers({ id: moderatorId }),
      getUsers({ id: userId })
    ]);

    const moderator = moderatorDoc[0];
    const targetUser = targetUserDoc[0];



    if (!moderator || !targetUser) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    if (moderatorId === userId) {

      return json({ error: 'Cannot delete yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot delete same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Aynı veya daha yüksek yetkiye sahip kullanıcıları silemezsiniz' }, { status: 403 });

    }



    // Verify the mnemonic token (if implemented)

    if (verificationToken && moderator.verification_token !== verificationToken) {

      return json({ error: 'Invalid verification token' }, { status: 401 });

    }



    // Clear the verification token after use

    if (verificationToken) {

      await updateUser(moderatorId, { verification_token: null });

    }



    const result = await updateUser(userId, {
      status: 'silinecek',
      deletion_timestamp: new Date(now.getTime() + TRASH_HOLD_MS),
      deleted_at: now,
      deleted_by: moderatorId,
      delete_reason: reason,
      is_banned: true,
      is_hidden: true,
      moderation_action: {
        action: 'deleted',
        reason: reason,
        timestamp: now,
        moderatorId: moderatorId,
        moderatorName: moderator.username || 'Moderator'
      }
    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User marked for deletion successfully' });

  } catch (error) {

    console.error('Delete user error:', error);

    return json({ error: 'Server error' }, { status: 500 });

  }

}



// @ts-ignore - SvelteKit request types

export async function PUT({ request }) {

  try {

    const { userId, reason, moderatorId } = await request.json();



    if (!userId || !reason || !moderatorId) {

      return json({ error: 'Missing required fields' }, { status: 400 });

    }



    const now = new Date();



    // Get current user and target user to check ranks

    const [moderatorDoc, targetUserDoc] = await Promise.all([
      getUsers({ id: moderatorId }),
      getUsers({ id: userId })
    ]);

    const moderator = moderatorDoc[0];
    const targetUser = targetUserDoc[0];



    if (!moderator || !targetUser) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    if (moderatorId === userId) {

      return json({ error: 'Cannot undo deletion for yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot undo delete for same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Cannot undo deletion for user with same or higher rank' }, { status: 403 });

    }



    const result = await updateUser(userId, {
      status: 'active',
      deletion_timestamp: null
    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User deletion cancelled successfully' });

  } catch (error) {

    console.error('Undo delete user error:', error);

    return json({ error: 'Server error' }, { status: 500 });

  }

}

