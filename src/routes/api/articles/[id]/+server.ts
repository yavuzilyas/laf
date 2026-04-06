// src/routes/api/articles/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getArticleById, softDeleteArticle } from '$db/queries';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { env } from '$env/dynamic/private';

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
    const baseUploadsDir = resolve(env.UPLOAD_DIR || 'uploads');
    const articleUploadsDir = resolve(baseUploadsDir, 'users');
    // Look for article folder in any user's directory
    const { readdir } = await import('fs/promises');
    try {
      if (!existsSync(articleUploadsDir)) {
        console.log('[DELETE] Users directory does not exist:', articleUploadsDir);
      } else {
        const users = await readdir(articleUploadsDir);
        for (const userId of users) {
          const articleDir = resolve(baseUploadsDir, 'users', userId, 'articles', params.id);
          console.log('[DELETE] Attempting to delete article directory:', articleDir);
          await rm(articleDir, { recursive: true, force: true });
          console.log('[DELETE] Successfully deleted article directory:', articleDir);
        }
      }
    } catch (error) {
      console.error('[DELETE] Error deleting article directory:', error);
    }

    return json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    return json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
