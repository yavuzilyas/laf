// src/routes/api/articles/[id]/hide/+server.ts
import { json } from '@sveltejs/kit';
import { getArticleById, updateArticle } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  console.log('HIDE API - User:', user);
  console.log('HIDE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { hidden } = await request.json(); // boolean: true/false
  const articleId = params.id;

  console.log('HIDE API - Article ID:', articleId);
  console.log('HIDE API - Hidden:', hidden);

  // Find the article
  const article = await getArticleById(articleId);

  console.log('HIDE API - Found article:', !!article);

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Update the article
  await updateArticle(articleId, {
    is_hidden: hidden,
    hidden_by: hidden && user?.id ? user.id : null,
    hidden_at: hidden ? new Date() : null
  });

  console.log('HIDE API - Update result:', 'success');

  const updatedArticle = await getArticleById(articleId);

  return json({
    success: true,
    hidden,
    stats: {
      likes: updatedArticle?.likes_count || 0,
      dislikes: updatedArticle?.dislikes || 0,
      comments: updatedArticle?.comments_count || 0,
      views: updatedArticle?.views || 0
    }
  });
}
