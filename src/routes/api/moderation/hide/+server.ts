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

export async function POST({ request, locals }) {

  try {
    const currentUser = (locals as any)?.user;
    
    // Check authentication and authorization
    if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, reason } = await request.json();
    const moderatorId = currentUser.id;

    if (!userId || !reason) {
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

      return json({ error: 'Cannot hide yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot hide same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Cannot hide user with same or higher rank' }, { status: 403 });

    }



    const result = await updateUser(userId, {
      is_hidden: true,
      status: 'hidden',
      hidden_by: moderatorId,
      hidden_at: now,
      hidden_reason: reason,
      moderation_action: {
        action: 'hidden',
        reason,
        timestamp: now,
        moderatorId: moderatorId,
        moderatorName: moderator.username || 'Moderator'
      }
    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User hidden successfully' });

  } catch (error) {



    return json({ error: 'Server error' }, { status: 500 });

  }

}



// @ts-ignore - SvelteKit request types

export async function PUT({ request, locals }) {

  try {
    const currentUser = (locals as any)?.user;
    
    // Check authentication and authorization
    if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, reason } = await request.json();
    const moderatorId = currentUser.id;

    if (!userId || !reason) {
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

      return json({ error: 'Cannot unhide yourself' }, { status: 403 });

    }



    // Check rank permissions

    const moderatorRank = getRoleRank(resolveRole(moderator));

    const targetRank = getRoleRank(resolveRole(targetUser));



    // Cannot unhide same rank or higher rank users

    if (targetRank >= moderatorRank) {

      return json({ error: 'Cannot unhide user with same or higher rank' }, { status: 403 });

    }



    const result = await updateUser(userId, {
      is_hidden: false,
      status: 'active',
      hidden_by: null,
      hidden_at: null,
      hidden_reason: null,
      moderation_action: {
        action: 'unhidden',
        reason,
        timestamp: now,
        moderatorId: moderatorId,
        moderatorName: moderator.username || 'Moderator'
      }
    });



    if (!result) {

      return json({ error: 'User not found' }, { status: 404 });

    }



    return json({ success: true, message: 'User unhidden successfully' });

  } catch (error) {



    return json({ error: 'Server error' }, { status: 500 });

  }

}

