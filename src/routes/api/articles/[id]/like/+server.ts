// src/routes/api/articles/[id]/like/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getLikesCollection, getArticlesCollection } from '$db/mongo';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json();
  const articleId = new ObjectId(params.id);
  const userId = new ObjectId(user.id);

  const likes = await getLikesCollection();
  const articles = await getArticlesCollection();

  if (action === 'like') {
    const existing = await likes.findOne({ articleId, userId });
    if (!existing) {
      await likes.insertOne({ articleId, userId, createdAt: new Date() });
      await articles.updateOne({ _id: articleId }, { $inc: { 'stats.likes': 1 } });
    }
    return json({ liked: true });
  }

  if (action === 'unlike') {
    const res = await likes.deleteOne({ articleId, userId });
    if (res.deletedCount) {
      await articles.updateOne({ _id: articleId }, { $inc: { 'stats.likes': -1 } });
    }
    return json({ liked: false });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}
