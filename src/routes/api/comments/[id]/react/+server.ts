// src/routes/api/comments/[id]/react/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection } from '$db/mongo';
import { notifyCommentLike } from '$lib/server/notifications';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json(); // "like" | "dislike" | null
  const commentId = new ObjectId(params.id);
  const comments = await getCommentsCollection();

  const comment = await comments.findOne({ _id: commentId });
  if (!comment) return json({ error: 'Comment not found' }, { status: 404 });

  // Simple implementation: store reactions in comment document
  // For production, consider separate reactions collection
  const userReactions = comment.userReactions || {};
  const previous = userReactions[user.id] || null;

  // Remove reaction
  if (!action) {
    delete userReactions[user.id];
    const update: any = { userReactions };
    if (previous === 'like') update.likes = (comment.likes || 0) - 1;
    if (previous === 'dislike') update.dislikes = (comment.dislikes || 0) - 1;
    await comments.updateOne({ _id: commentId }, { $set: update });
    return json({ reaction: null, previous });
  }

  // Toggle same reaction
  if (previous === action) {
    delete userReactions[user.id];
    const update: any = { userReactions };
    if (action === 'like') update.likes = (comment.likes || 0) - 1;
    if (action === 'dislike') update.dislikes = (comment.dislikes || 0) - 1;
    await comments.updateOne({ _id: commentId }, { $set: update });
    return json({ reaction: null, previous: action });
  }

  // Change reaction
  if (previous && previous !== action) {
    userReactions[user.id] = action;
    const update: any = { userReactions };
    if (action === 'like') {
      update.likes = (comment.likes || 0) + 1;
      update.dislikes = (comment.dislikes || 0) - 1;
      try {
        await notifyCommentLike({ commentId: params.id, likerId: user.id, articleId: comment.articleId?.toString?.() || comment.articleId });
      } catch (error) {
        console.error('Failed to send comment like notification', error);
      }
    } else {
      update.likes = (comment.likes || 0) - 1;
      update.dislikes = (comment.dislikes || 0) + 1;
    }
    await comments.updateOne({ _id: commentId }, { $set: update });
    return json({ reaction: action, previous });
  }

  // New reaction
  userReactions[user.id] = action;
  const update: any = { userReactions };
  if (action === 'like') update.likes = (comment.likes || 0) + 1;
  if (action === 'dislike') update.dislikes = (comment.dislikes || 0) + 1;
  await comments.updateOne({ _id: commentId }, { $set: update });
  if (action === 'like') {
    try {
      await notifyCommentLike({ commentId: params.id, likerId: user.id, articleId: comment.articleId?.toString?.() || comment.articleId });
    } catch (error) {
      console.error('Failed to send comment like notification', error);
    }
  }
  return json({ reaction: action, previous: null });
}
