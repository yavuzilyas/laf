// src/routes/api/moderation/actions/+server.ts
import { json } from '@sveltejs/kit';
import { getUsers, updateUser, getArticles, updateArticle, getComments, updateComment, getArticleById } from '$db/queries';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { env } from '$env/dynamic/private';

const resolveRole = (user?: { role?: string; type?: string }) => user?.role ?? user?.type ?? 'user';
const getRoleRank = (role?: string | null) => {
  if (role === 'admin') return 3;
  if (role === 'moderator') return 2;
  return 1;
};

export async function POST({ request, locals }) {
  const user = (locals as any)?.user;
  
  // Check if user is moderator or admin
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, type, id, reason } = await request.json();

  if (!action || !type || !id) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }

  const moderatorId = user.id;
  const targetId = id;

  try {
    if (type === 'article') {
      if (action === 'hide') {
        await updateArticle(targetId, {
          is_hidden: true,
          hidden_by: moderatorId,
          hidden_at: new Date(),
          hidden_reason: reason || 'No reason provided'
        });
      } else if (action === 'unhide') {
        await updateArticle(targetId, {
          is_hidden: false,
          hidden_by: null,
          hidden_at: null,
          hidden_reason: null
        });
      } else if (action === 'delete') {
        // Only admin can delete articles
        if (user.role !== 'admin') {
          return json({ error: 'Unauthorized - Admin access required for deletion' }, { status: 403 });
        }
        // Get article to find author_id before soft deleting
        const article = await getArticleById(targetId);
        
        await updateArticle(targetId, {
          deleted_at: new Date()
        });

        // Delete the article's upload directory if it exists
        if (article && article.authorId) {
          try {
            const baseUploadsDir = resolve(env.UPLOAD_DIR || 'uploads');
            const articleDir = resolve(baseUploadsDir, 'users', article.authorId, 'articles', targetId);
            
            if (existsSync(articleDir)) {
              console.log('[MODERATION DELETE] Deleting article directory:', articleDir);
              await rm(articleDir, { recursive: true, force: true });
              console.log('[MODERATION DELETE] Successfully deleted article directory:', articleDir);
            }
          } catch (error) {
            console.error('[MODERATION DELETE] Error deleting article directory:', error);
          }
        }
      } else if (action === 'clearReports') {
        // This would need a reports field in articles table
        await updateArticle(targetId, {
          // reports: [] // Uncomment when reports field is added
        });
      }

    } else if (type === 'comment') {
      if (action === 'hide') {
        await updateComment(targetId, {
          hidden: true,
          hidden_by: moderatorId,
          hidden_at: new Date(),
          hidden_reason: reason || 'No reason provided'
        });
      } else if (action === 'unhide') {
        await updateComment(targetId, {
          hidden: false,
          hidden_by: null,
          hidden_at: null,
          hidden_reason: null
        });
      } else if (action === 'delete') {
        // Only admin can delete comments
        if (user.role !== 'admin') {
          return json({ error: 'Unauthorized - Admin access required for deletion' }, { status: 403 });
        }
        await updateComment(targetId, {
          deleted_at: new Date()
        });
      } else if (action === 'clearReports') {
        // This would need a reports field in comments table
        await updateComment(targetId, {
          // reports: [] // Uncomment when reports field is added
        });
      }

    } else if (type === 'user') {
      const [moderatorDoc, targetUser] = await Promise.all([
        getUsers({ id: moderatorId }),
        getUsers({ id: targetId })
      ]);

      if (!moderatorDoc.length || !targetUser.length) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      const moderator = moderatorDoc[0];
      const target = targetUser[0];

      if (moderatorId === targetId) {
        return json({ error: 'Cannot perform moderation on yourself' }, { status: 403 });
      }

      const moderatorRank = getRoleRank(resolveRole(moderator));
      const targetRank = getRoleRank(resolveRole(target));

      if (targetRank >= moderatorRank) {
        return json({ error: 'Cannot perform action on user with same or higher rank' }, { status: 403 });
      }

      if (action === 'hide') {
        await updateUser(targetId, {
          is_hidden: true,
          hidden_by: moderatorId,
          hidden_at: new Date(),
          hidden_reason: reason || 'No reason provided'
        });
      } else if (action === 'unhide') {
        await updateUser(targetId, {
          is_hidden: false,
          hidden_by: null,
          hidden_at: null,
          hidden_reason: null
        });
      } else if (action === 'ban') {
        await updateUser(targetId, {
          is_banned: true,
          banned_at: new Date(),
          banned_by: moderatorId,
          ban_reason: reason || 'No reason provided'
        });
      } else if (action === 'unban') {
        await updateUser(targetId, {
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null
        });
      } else if (action === 'clearReports') {
        // This would need a reports field in users table
        await updateUser(targetId, {
          // reports: [] // Uncomment when reports field is added
        });
      }
    }

    return json({ success: true, message: 'Action completed' });
  } catch (error) {
    return json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

