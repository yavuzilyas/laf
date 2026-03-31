// src/routes/api/comments/[id]/report/+server.ts
import { json } from '@sveltejs/kit';
import { getComments } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;

  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { reason } = await request.json();
  const commentId = params.id;
  // const userId = user.id;

  // Check if comment exists
  const comments = await getComments({ id: commentId });
  const comment = comments[0];


  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }


  return json({
    success: true,
    message: 'Comment reported successfully'
  });
}
