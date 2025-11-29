// src/routes/api/moderation/actions/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection, getCommentsCollection, getUsersCollection } from '$db/mongo';

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

  if (!ObjectId.isValid(user.id) || !ObjectId.isValid(id)) {
    return json({ error: 'Invalid identifier supplied' }, { status: 400 });
  }

  const moderatorId = new ObjectId(user.id);
  const targetId = new ObjectId(id);

  try {
    if (type === 'article') {
      const articles = await getArticlesCollection();
      
      if (action === 'hide') {
        await articles.updateOne(
          { _id: targetId },
          { 
            $set: { 
              hidden: true,
              moderationAction: {
                action: 'hide',
                moderatorId,
                reason: reason || 'No reason provided',
                timestamp: new Date()
              }
            } 
          }
        );
      } else if (action === 'unhide') {
        await articles.updateOne(
          { _id: targetId },
          { 
            $set: { 
              hidden: false,
              moderationAction: {
                action: 'unhide',
                moderatorId,
                timestamp: new Date()
              }
            },
            $unset: { moderationAction: '' }
          }
        );
      } else if (action === 'delete') {
        await articles.updateOne(
          { _id: targetId },
          { 
            $set: { 
              deletedAt: new Date(),
              moderationAction: {
                action: 'delete',
                moderatorId,
                reason: reason || 'No reason provided',
                timestamp: new Date()
              }
            } 
          }
        );
      } else if (action === 'clearReports') {
        await articles.updateOne(
          { _id: targetId },
          { 
            $set: { 
              reports: [],
              moderationAction: {
                action: 'clearReports',
                moderatorId,
                timestamp: new Date()
              }
            } 
          }
        );
      }

    } else if (type === 'comment') {
      const comments = await getCommentsCollection();
      
      if (action === 'hide') {
        await comments.updateOne(
          { _id: targetId },
          { 
            $set: { 
              hidden: true,
              moderationAction: {
                action: 'hide',
                moderatorId,
                reason: reason || 'No reason provided',
                timestamp: new Date()
              }
            } 
          }
        );
      } else if (action === 'unhide') {
        await comments.updateOne(
          { _id: targetId },
          { 
            $set: { 
              hidden: false,
              moderationAction: {
                action: 'unhide',
                moderatorId,
                timestamp: new Date()
              }
            },
            $unset: { moderationAction: '' }
          }
        );
      } else if (action === 'delete') {
        await comments.updateOne(
          { _id: targetId },
          { 
            $set: { 
              deletedAt: new Date(),
              moderationAction: {
                action: 'delete',
                moderatorId,
                reason: reason || 'No reason provided',
                timestamp: new Date()
              }
            } 
          }
        );
      } else if (action === 'clearReports') {
        await comments.updateOne(
          { _id: targetId },
          { 
            $set: { 
              reports: [],
              moderationAction: {
                action: 'clearReports',
                moderatorId,
                timestamp: new Date()
              }
            } 
          }
        );
      }

    } else if (type === 'user') {
      const users = await getUsersCollection();

      const [moderatorDoc, targetUser] = await Promise.all([
        users.findOne({ _id: moderatorId }),
        users.findOne({ _id: targetId })
      ]);

      if (!moderatorDoc || !targetUser) {
        return json({ error: 'User not found' }, { status: 404 });
      }

      if (moderatorId.equals(targetId)) {
        return json({ error: 'Cannot perform moderation on yourself' }, { status: 403 });
      }

      const moderatorRank = getRoleRank(resolveRole(moderatorDoc));
      const targetRank = getRoleRank(resolveRole(targetUser));

      if (targetRank >= moderatorRank) {
        return json({ error: 'Cannot perform action on user with same or higher rank' }, { status: 403 });
      }

      if (action === 'ban') {
        await users.updateOne(
          { _id: targetId },
          { 
            $set: { 
              banned: true,
              bannedAt: new Date(),
              moderationAction: {
                action: 'ban',
                moderatorId,
                reason: reason || 'No reason provided',
                timestamp: new Date()
              }
            } 
          }
        );
      } else if (action === 'unban') {
        await users.updateOne(
          { _id: targetId },
          { 
            $set: { 
              banned: false,
              moderationAction: {
                action: 'unban',
                moderatorId,
                timestamp: new Date()
              }
            },
            $unset: { bannedAt: '', moderationAction: '' }
          }
        );
      } else if (action === 'clearReports') {
        await users.updateOne(
          { _id: targetId },
          { 
            $set: { 
              reports: [],
              moderationAction: {
                action: 'clearReports',
                moderatorId,
                timestamp: new Date()
              }
            } 
          }
        );
      }
    }

    return json({ success: true, message: 'Action completed' });
  } catch (error) {
    console.error('Moderation action error:', error);
    return json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

