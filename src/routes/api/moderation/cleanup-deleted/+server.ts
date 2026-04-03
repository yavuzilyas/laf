import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import { TRASH_HOLD_MS } from '$lib/server/moderation/constants';

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
    const currentUser = (locals as any).user;

    // Check authentication and authorization
    if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
      return json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const moderatorRank = getRoleRank(resolveRole(currentUser));

    // Calculate the cutoff time (48 hours ago)
    const cutoffTime = new Date(Date.now() - TRASH_HOLD_MS);

    // Find users with status 'silinecek' who were deleted more than 48 hours ago
    const findSql = `
      SELECT id, username, email, role, deleted_at, moderation_action
      FROM users
      WHERE status = 'silinecek'
        AND deleted_at IS NOT NULL
        AND deleted_at <= $1
    `;
    const findResult = await query(findSql, [cutoffTime]);
    const usersToDelete = findResult.rows;

    if (usersToDelete.length === 0) {
      return json({
        success: true,
        message: 'Silinecek hesap bulunamadı',
        deletedCount: 0
      });
    }

    // Filter out users with same or higher rank than moderator
    const deletableUsers = usersToDelete.filter(user => {
      const userRank = getRoleRank(resolveRole(user));
      return userRank < moderatorRank;
    });

    const skippedCount = usersToDelete.length - deletableUsers.length;

    if (deletableUsers.length === 0) {
      return json({
        success: true,
        message: `Yeterli yetki yok. ${skippedCount} hesap atlandı (aynı veya daha yüksek yetki).`,
        deletedCount: 0,
        skippedCount
      });
    }

    // Permanently delete the users
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    for (const user of deletableUsers) {
      try {
        // Delete user's related data first (articles, comments, likes, etc.)
        // Articles will be handled separately (soft delete or reassignment)
        await query('DELETE FROM comments WHERE author_id = $1', [user.id]);
        await query('DELETE FROM likes WHERE user_id = $1', [user.id]);
        await query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [user.id]);
        await query('DELETE FROM drafts WHERE author_id = $1', [user.id]);
        await query('DELETE FROM event_attendees WHERE user_id = $1', [user.id]);
        await query('DELETE FROM donations WHERE user_id = $1', [user.id]);
        await query('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [user.id]);
        await query('DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1', [user.id]);

        // Finally delete the user
        const deleteResult = await query('DELETE FROM users WHERE id = $1', [user.id]);

        if (deleteResult.rowCount > 0) {
          deletedIds.push(user.id);
        } else {
          failedIds.push(user.id);
        }
      } catch (error) {
        console.error(`Error deleting user ${user.id}:`, error);
        failedIds.push(user.id);
      }
    }

    return json({
      success: true,
      message: `${deletedIds.length} hesap kalıcı olarak silindi`,
      deletedCount: deletedIds.length,
      skippedCount,
      failedCount: failedIds.length,
      deletedIds,
      failedIds
    });

  } catch (error) {
    console.error('Cleanup deleted users error:', error);
    return json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
