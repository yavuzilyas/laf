// src/routes/api/comments/[id]/hide/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection } from '$db/mongo';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  console.log('COMMENT HIDE API - User:', user);
  console.log('COMMENT HIDE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { hidden } = await request.json(); // boolean: true/false
  const commentId = new ObjectId(params.id);
  // const userId = new ObjectId(user.id);

  const comments = await getCommentsCollection();

  // TEMPORARY: Skip permission check for testing
  // Yorumun var olup olmadığını ve kullanıcının sahibi olup olmadığını kontrol et
  const comment = await comments.findOne({
    _id: commentId
    // $or: [
    //   { userId: userId },
    //   { 'author.id': userId.toString() }
    // ]
  });

  console.log('COMMENT HIDE API - Found comment:', !!comment);

  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Yorumu güncelle
  await comments.updateOne(
    { _id: commentId },
    { $set: { hidden, updatedAt: new Date() } }
  );

  console.log('COMMENT HIDE API - Update result:', 'success');

  const updatedComment = await comments.findOne({ _id: commentId });

  return json({
    success: true,
    hidden,
    likes: updatedComment?.likes || 0,
    dislikes: updatedComment?.dislikes || 0
  });
}
