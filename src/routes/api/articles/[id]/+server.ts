// src/routes/api/articles/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getArticleById, softDeleteArticle } from '$db/queries';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;

  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const articleId = params.id;


  // Find the article
  const article = await getArticleById(articleId);


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
    }

    return json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    return json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
