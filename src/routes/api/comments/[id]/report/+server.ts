// src/routes/api/comments/[id]/report/+server.ts
import { json } from '@sveltejs/kit';
import { getComments } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  console.log('COMMENT REPORT API - User:', user);
  console.log('COMMENT REPORT API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { reason } = await request.json();
  const commentId = params.id;
  // const userId = user.id;

  // Check if comment exists
  const comments = await getComments({ id: commentId });
  const comment = comments[0];

  console.log('COMMENT REPORT API - Found comment:', !!comment);

  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // TODO: Save report to database
  console.log('COMMENT REPORT API - Report reason:', reason);

  return json({
    success: true,
    message: 'Comment reported successfully'
  });
}
