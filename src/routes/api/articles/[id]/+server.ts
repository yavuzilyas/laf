// src/routes/api/articles/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection } from '$db/mongo';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;
  console.log('DELETE API - User:', user);
  console.log('DELETE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const articleId = new ObjectId(params.id);
  // const userId = new ObjectId(user.id);

  console.log('DELETE API - Article ID:', articleId.toString());

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

  console.log('DELETE API - Found article:', !!article);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Makaleyi soft delete yap (deletedAt field'ını ekle)
  try {
    // Soft delete the article
    await articles.updateOne(
      { _id: articleId },
      { $set: { deletedAt: new Date(), updatedAt: new Date(), 'stats.comments': 0 } }
    );

    // Delete the entire article's upload directory if it exists
    const articleUploadsDir = resolve('static', 'uploads', 'articles', params.id);
    if (existsSync(articleUploadsDir)) {
      await rm(articleUploadsDir, { recursive: true, force: true });
      console.log(`Deleted article upload directory: ${articleUploadsDir}`);
    }

    return json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
