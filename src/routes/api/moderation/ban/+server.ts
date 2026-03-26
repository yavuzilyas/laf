// @ts-ignore - SvelteKit types

import { json } from '@sveltejs/kit';

import { getUsers, updateUser } from '$db/queries';



const resolveRole = (user?: { role?: string; type?: string }) => user?.role ?? user?.type ?? 'user';

const getRoleRank = (role?: string | null) => {

  const normalized = (role ?? 'user').toLowerCase();

  if (normalized === 'admin') return 3;

  if (normalized === 'moderator') return 2;

  return 1;

};



// @ts-ignore - SvelteKit request types

export async function POST({ request }) {

  try {

    const { userId, reason, moderatorId } = await request.json();



    if (!userId || !reason || !moderatorId) {

      return json({ error: 'Missing required fields' }, { status: 400 });

    }



    const now = new Date();



    // Get current user and target user to check ranks

    const moderatorData = await getUsers({ id: moderatorId });

    const targetData = await getUsers({ id: userId });

    const moderator = moderatorData[0];

    const targetUser = targetData[0];



    if (!moderator || !targetUser) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    if (moderatorId === userId) {

      return json({ error: 'Cannot ban yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot ban same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Cannot ban user with same or higher rank' }, { status: 403 });

    }



    const result = await updateUser(userId, {

      is_banned: true,

      banned_at: now,

      banned_by: moderatorId,

      ban_reason: reason,

      status: 'banned',

      moderation_action: {

        action: 'banned',

        reason,

        timestamp: now,

        moderator_id: moderatorId,

        moderator_name: moderator.username || 'Moderator'

      }

    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User banned successfully' });

  } catch (error) {

    console.error('Ban user error:', error);

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

    const moderatorData = await getUsers({ id: moderatorId });

    const targetData = await getUsers({ id: userId });

    const moderator = moderatorData[0];

    const targetUser = targetData[0];



    if (!moderator || !targetUser) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    if (moderatorId === userId) {

      return json({ error: 'Cannot unban yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot unban same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Cannot unban user with same or higher rank' }, { status: 403 });

    }



    const result = await updateUser(userId, {

      is_banned: false,

      banned_at: null,

      banned_by: null,

      ban_reason: null,

      status: 'active',

      moderation_action: {

        action: 'unbanned',

        reason,

        timestamp: now,

        moderator_id: moderatorId,

        moderator_name: moderator.username || 'Moderator'

      }

    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User unbanned successfully' });

  } catch (error) {

    console.error('Unban user error:', error);

    return json({ error: 'Server error' }, { status: 500 });

  }

}

