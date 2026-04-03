// src/routes/api/articles/[id]/like/+server.ts
import { json } from '@sveltejs/kit';
import { getLikes, createLike, deleteLike, getArticles, updateArticle } from '$db/queries';
import { notifyArticleLike } from '$lib/server/notifications-pg';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json();
  const articleId = params.id;
  const userId = user.id;

  if (action === 'like') {
    const existing = await getLikes({ article_id: articleId, user_id: userId });
    if (existing.length === 0) {
      await createLike({ article_id: articleId, user_id: userId });
      const articles = await getArticles({ id: articleId });
      if (articles.length > 0) {
        const article = articles[0];
        await updateArticle(articleId, { 
          likes_count: (article.likes_count || 0) + 1 
        });
        
        // Send notification
        await notifyArticleLike({ 
          articleId, 
          likerId: userId 
        });
      }
    }
    return json({ liked: true });
  }

  if (action === 'unlike') {
    const result = await deleteLike({ article_id: articleId, user_id: userId });
    if (result) {
      const articles = await getArticles({ id: articleId });
      if (articles.length > 0) {
        const article = articles[0];
        await updateArticle(articleId, { 
          likes_count: Math.max(0, (article.likes_count || 0) - 1) 
        });
      }
    }
    return json({ liked: false });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}
