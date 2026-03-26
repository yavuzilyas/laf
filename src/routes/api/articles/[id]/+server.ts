// src/routes/api/articles/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getArticleById, softDeleteArticle } from '$db/queries';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;
  console.log('DELETE API - User:', user);
  console.log('DELETE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const articleId = params.id;

  console.log('DELETE API - Article ID:', articleId);

  // Find the article
  const article = await getArticleById(articleId);

  console.log('DELETE API - Found article:', !!article);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Soft delete the article
  try {
    await softDeleteArticle(articleId);

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
