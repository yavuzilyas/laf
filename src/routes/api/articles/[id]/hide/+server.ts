// src/routes/api/articles/[id]/hide/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection } from '$db/mongo';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  console.log('HIDE API - User:', user);
  console.log('HIDE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { hidden } = await request.json(); // boolean: true/false
  const articleId = new ObjectId(params.id);
  // const userId = new ObjectId(user.id);

  console.log('HIDE API - Article ID:', articleId.toString());
  console.log('HIDE API - Hidden:', hidden);

  const articles = await getArticlesCollection();

  // TEMPORARY: Skip permission check for testing
  // Makalenin var olup olmadığını ve kullanıcının sahibi olup olmadığını kontrol et
  const article = await articles.findOne({
    _id: articleId
    // $or: [
    //   { authorId: userId },
    //   { 'author.id': userId.toString() }
    // ]
  });

  console.log('HIDE API - Found article:', !!article);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Makaleyi güncelle
  await articles.updateOne(
    { _id: articleId },
    { $set: { hidden, updatedAt: new Date() } }
  );

  console.log('HIDE API - Update result:', 'success');

  const updatedArticle = await articles.findOne({ _id: articleId });

  return json({
    success: true,
    hidden,
    stats: updatedArticle?.stats || { likes: 0, dislikes: 0, comments: 0, views: 0 }
  });
}
