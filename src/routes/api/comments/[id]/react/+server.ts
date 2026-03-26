// src/routes/api/comments/[id]/react/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, updateComment } from '$db/queries';
import { notifyCommentLike } from '$lib/server/notifications-pg';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json(); // "like" | "dislike" | null
  const commentId = params.id;

  const comments = await getComments({ id: commentId });
  const comment = comments[0];
  if (!comment) return json({ error: 'Comment not found' }, { status: 404 });

  // Simple implementation: store reactions in comment metadata
  const metadata = comment.metadata || {};
  const userReactions = metadata.userReactions || {};
  const previous = userReactions[user.id] || null;

  // Remove reaction
  if (!action) {
    delete userReactions[user.id];
    const updateData: any = { metadata: { ...metadata, userReactions } };
    if (previous === 'like') updateData.likes = (comment.likes || 0) - 1;
    if (previous === 'dislike') updateData.dislikes = (comment.dislikes || 0) - 1;
    await updateComment(commentId, updateData);
    return json({ reaction: null, previous });
  }

  // Toggle same reaction
  if (previous === action) {
    delete userReactions[user.id];
    const updateData: any = { metadata: { ...metadata, userReactions } };
    if (action === 'like') updateData.likes = (comment.likes || 0) - 1;
    if (action === 'dislike') updateData.dislikes = (comment.dislikes || 0) - 1;
    await updateComment(commentId, updateData);
    return json({ reaction: null, previous: action });
  }

  // Change reaction
  if (previous && previous !== action) {
    userReactions[user.id] = action;
    const updateData: any = { metadata: { ...metadata, userReactions } };
    if (action === 'like') {
      updateData.likes = (comment.likes || 0) + 1;
      updateData.dislikes = (comment.dislikes || 0) - 1;
      try {
        await notifyCommentLike({ commentId, likerId: user.id, articleId: comment.article_id });
      } catch (error) {
        console.error('Failed to send comment like notification', error);
      }
    } else {
      updateData.likes = (comment.likes || 0) - 1;
      updateData.dislikes = (comment.dislikes || 0) + 1;
    }
    await updateComment(commentId, updateData);
    return json({ reaction: action, previous });
  }

  // New reaction
  userReactions[user.id] = action;
  const updateData: any = { metadata: { ...metadata, userReactions } };
  if (action === 'like') updateData.likes = (comment.likes || 0) + 1;
  if (action === 'dislike') updateData.dislikes = (comment.dislikes || 0) + 1;
  await updateComment(commentId, updateData);
  if (action === 'like') {
    try {
      await notifyCommentLike({ commentId, likerId: user.id, articleId: comment.article_id });
    } catch (error) {
      console.error('Failed to send comment like notification', error);
    }
  }
  return json({ reaction: action, previous: null });
}
