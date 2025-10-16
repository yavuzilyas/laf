// src/routes/api/articles/[id]/react/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection, getLikesCollection } from '$db/mongo';

// Not: Eski "likes" koleksiyonunu kullanmaya devam ediyoruz ama içine "type" alanı ekliyoruz.
// type: 'like' | 'dislike'

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json(); // "like" | "dislike" | null
  const articleId = new ObjectId(params.id);
  const userId = new ObjectId(user.id);

  const reactions = await getLikesCollection(); // aynı koleksiyon, sadece field ekliyoruz
  const articles = await getArticlesCollection();

  // mevcut reaksiyon kontrolü
  const existing = await reactions.findOne({ articleId, userId });
  const previous = existing?.type || null;

  // 1️⃣ Reaksiyonu silme (nötr hale getirme)
  if (!action) {
    if (existing) {
      await reactions.deleteOne({ _id: existing._id });
      if (previous === 'like') {
        await articles.updateOne({ _id: articleId }, { $inc: { 'stats.likes': -1 } });
      } else if (previous === 'dislike') {
        await articles.updateOne({ _id: articleId }, { $inc: { 'stats.dislikes': -1 } });
      }
    }
    return json({ reaction: null, previous });
  }

  // 2️⃣ Aynı reaksiyon yeniden gönderildiyse (geri al)
  if (existing && existing.type === action) {
    await reactions.deleteOne({ _id: existing._id });
    if (action === 'like') {
      await articles.updateOne({ _id: articleId }, { $inc: { 'stats.likes': -1 } });
    } else {
      await articles.updateOne({ _id: articleId }, { $inc: { 'stats.dislikes': -1 } });
    }
    return json({ reaction: null, previous: action });
  }

  // 3️⃣ Farklı reaksiyonla değiştirme
  if (existing && existing.type !== action) {
    await reactions.updateOne({ _id: existing._id }, { $set: { type: action } });

    if (action === 'like') {
      await articles.updateOne(
        { _id: articleId },
        { $inc: { 'stats.likes': 1, 'stats.dislikes': -1 } }
      );
    } else {
      await articles.updateOne(
        { _id: articleId },
        { $inc: { 'stats.likes': -1, 'stats.dislikes': 1 } }
      );
    }

    return json({ reaction: action, previous });
  }

  // 4️⃣ İlk defa reaksiyon veriyorsa
  await reactions.insertOne({
    articleId,
    userId,
    type: action,
    createdAt: new Date(),
  });

  if (action === 'like') {
    await articles.updateOne({ _id: articleId }, { $inc: { 'stats.likes': 1 } });
  } else if (action === 'dislike') {
    await articles.updateOne({ _id: articleId }, { $inc: { 'stats.dislikes': 1 } });
  }

  return json({ reaction: action, previous });
}
