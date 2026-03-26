// src/routes/api/comments/[id]/edit/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, updateComment } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  console.log('COMMENT EDIT API - User:', user);
  console.log('COMMENT EDIT API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await request.json();
  const commentId = params.id;
  // const userId = user.id;

  // Check if comment exists
  const comments = await getComments({ id: commentId });
  const comment = comments[0];

  console.log('COMMENT EDIT API - Found comment:', !!comment);

  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Update comment with edited content and metadata
  const updateData = {
    content: typeof content === 'object' ? JSON.stringify(content) : content,
    metadata: {
      ...(comment.metadata || {}),
      edited: true,
      edited_at: new Date(),
      edited_by: user?.id || null
    }
  };

  await updateComment(commentId, updateData);

  console.log('COMMENT EDIT API - Update result:', 'success');

  const updatedComments = await getComments({ id: commentId });
  const updatedComment = updatedComments[0];

  return json({
    success: true,
    comment: updatedComment,
    message: 'Comment updated successfully'
  });
}
