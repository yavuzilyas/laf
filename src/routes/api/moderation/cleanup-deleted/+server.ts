import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import { TRASH_HOLD_MS } from '$lib/server/moderation/constants';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';

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
    // Include avatar_url and preferences (for bannerImage) to delete files
    const findSql = `
      SELECT id, username, email, role, deleted_at, moderation_action, avatar_url, preferences
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
    const UPLOAD_BASE_DIR = env.UPLOAD_DIR || '/app/uploads';

    for (const user of deletableUsers) {
      try {
        // Delete user's avatar file if exists
        if (user.avatar_url && typeof user.avatar_url === 'string') {
          try {
            const normalizedAvatar = user.avatar_url.startsWith('/') ? user.avatar_url : `/${user.avatar_url}`;
            const avatarFsPath = resolve(UPLOAD_BASE_DIR, normalizedAvatar.replace(/^\//, '').replace(/^uploads\//, ''));
            const baseUploadsDir = resolve(UPLOAD_BASE_DIR);
            if (avatarFsPath.startsWith(baseUploadsDir)) {
              await rm(avatarFsPath, { force: true });
              console.log(`[CLEANUP] Deleted avatar: ${avatarFsPath}`);
            }
          } catch (fileError) {
            console.error(`[CLEANUP] Error deleting avatar for user ${user.id}:`, fileError);
          }
        }

        // Delete user's banner file if exists (stored in preferences.bannerImage)
        if (user.preferences && typeof user.preferences === 'object') {
          const preferences = user.preferences;
          if (preferences.bannerImage && typeof preferences.bannerImage === 'string') {
            try {
              const normalizedBanner = preferences.bannerImage.startsWith('/') ? preferences.bannerImage : `/${preferences.bannerImage}`;
              const bannerFsPath = resolve(UPLOAD_BASE_DIR, normalizedBanner.replace(/^\//, '').replace(/^uploads\//, ''));
              const baseUploadsDir = resolve(UPLOAD_BASE_DIR);
              if (bannerFsPath.startsWith(baseUploadsDir)) {
                await rm(bannerFsPath, { force: true });
                console.log(`[CLEANUP] Deleted banner: ${bannerFsPath}`);
              }
            } catch (fileError) {
              console.error(`[CLEANUP] Error deleting banner for user ${user.id}:`, fileError);
            }
          }
        }

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
