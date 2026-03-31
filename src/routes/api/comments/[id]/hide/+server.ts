// src/routes/api/comments/[id]/hide/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, updateComment } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;

  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { hidden } = await request.json(); // boolean: true/false
  const commentId = params.id;
  // const userId = user.id;

  // Yorumun var olup olmadığını ve kullanıcının sahibi olup olmadığını kontrol et
  const comments = await getComments({ id: commentId });
  const comment = comments[0];


  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Yorumu güncelle
  await updateComment(commentId, { 
    hidden
  });


  const updatedComments = await getComments({ id: commentId });
  const updatedComment = updatedComments[0];

  return json({
    success: true,
    hidden,
    likes: updatedComment?.likes || 0,
    dislikes: updatedComment?.dislikes || 0
  });
}
