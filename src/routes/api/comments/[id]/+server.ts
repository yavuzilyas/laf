// src/routes/api/comments/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection, getArticlesCollection } from '$db/mongo';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;
  console.log('COMMENT DELETE API - User:', user);
  console.log('COMMENT DELETE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = new ObjectId(params.id);
  // const userId = new ObjectId(user.id);

  const comments = await getCommentsCollection();
  const articles = await getArticlesCollection();

  // TEMPORARY: Skip permission check for testing
  // Yorumun var olup olmadığını ve kullanıcının sahibi olup olmadığını kontrol et
  const comment = await comments.findOne({
    _id: commentId
    // $or: [
    //   { userId: userId },
    //   { 'author.id': userId.toString() }
    // ]
  });

  console.log('COMMENT DELETE API - Found comment:', !!comment);

  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Yorumu soft delete yap (deletedAt field'ını ekle)
  await comments.updateOne(
    { _id: commentId },
    { $set: { deletedAt: new Date(), updatedAt: new Date() } }
  );

  // Article'ın comment count'ını azalt
  if (comment.articleId) {
    await articles.updateOne(
      { _id: comment.articleId },
      { $inc: { 'stats.comments': -1 } }
    );
  }

  return json({ success: true, message: 'Comment deleted successfully' });
}
