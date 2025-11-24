// src/routes/api/moderation/actions/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection, getCommentsCollection, getUsersCollection } from '$db/mongo';

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

