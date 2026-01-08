// @ts-ignore - SvelteKit types
import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
// @ts-ignore - MongoDB types
import { ObjectId } from 'mongodb';

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
    const { userId, reason, moderatorId } = await request.json();

    if (!userId || !reason || !moderatorId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const users = await getUsersCollection();
    const now = new Date();

    // Get current user and target user to check ranks
    const moderatorObjectId = new ObjectId(moderatorId);
    const targetObjectId = new ObjectId(userId);
    const moderator = await users.findOne({ _id: moderatorObjectId });
    const targetUser = await users.findOne({ _id: targetObjectId });

    if (!moderator || !targetUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (moderatorObjectId.equals(targetObjectId)) {
      return json({ error: 'Cannot delete yourself' }, { status: 403 });
    }

    // Check rank permissions
    const moderatorRank = getRoleRank(resolveRole(moderator));
    const targetRank = getRoleRank(resolveRole(targetUser));

    // Cannot delete same rank or higher rank users
    if (targetRank >= moderatorRank) {
      return json({ error: 'Aynı veya daha yüksek yetkiye sahip kullanıcıları silemezsiniz' }, { status: 403 });
    }

    // Verify the mnemonic token
    if (moderator.verificationToken !== verificationToken) {
      return json({ error: 'Invalid verification token' }, { status: 401 });
    }

    // Clear the verification token after use
    await users.updateOne(
      { _id: moderatorObjectId },
      { $unset: { verificationToken: 1 } }
    );

    const result = await users.updateOne(
      { _id: targetObjectId },
      {
        $set: {
          status: 'deleted',
          deletedAt: now,
          deletedBy: moderatorId,
          deleteReason: reason,
          email: `deleted-${Date.now()}@deleted.com`,
          username: `deleted-${Date.now()}`,
          name: 'Silinmiş Kullanıcı',
          avatar: null,
          bio: '',
          website: '',
          location: '',
          twitter: '',
          github: '',
          linkedin: ''
        }
      }
    );

    if (result.matchedCount === 0) {
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

    const users = await getUsersCollection();
    const now = new Date();

    // Get current user and target user to check ranks
    const moderatorObjectId = new ObjectId(moderatorId);
    const targetObjectId = new ObjectId(userId);
    const moderator = await users.findOne({ _id: moderatorObjectId });
    const targetUser = await users.findOne({ _id: targetObjectId });

    if (!moderator || !targetUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (moderatorObjectId.equals(targetObjectId)) {
      return json({ error: 'Cannot undo deletion for yourself' }, { status: 403 });
    }

    // Check rank permissions
    const moderatorRank = getRoleRank(resolveRole(moderator));
    const targetRank = getRoleRank(resolveRole(targetUser));

    // Cannot undo delete for same rank or higher rank users
    if (targetRank >= moderatorRank) {
      return json({ error: 'Cannot undo deletion for user with same or higher rank' }, { status: 403 });
    }

    const result = await users.updateOne(
      { _id: targetObjectId },
      {
        $set: {
          status: 'active',
          moderationAction: {
            action: 'deletion_cancelled',
            reason,
            timestamp: now,
            moderatorId: new ObjectId(moderatorId),
            moderatorName: moderator.nickname || 'Moderator'
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json({ success: true, message: 'User deletion cancelled successfully' });
  } catch (error) {
    console.error('Undo delete user error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
