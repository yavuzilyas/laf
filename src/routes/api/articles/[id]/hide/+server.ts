// src/routes/api/articles/[id]/hide/+server.ts
import { json } from '@sveltejs/kit';
import { getArticleById, updateArticle } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;

  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { hidden } = await request.json(); // boolean: true/false
  const articleId = params.id;


  // Find the article
  const article = await getArticleById(articleId);


  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  // Update the article
  await updateArticle(articleId, {
    is_hidden: hidden,
    hidden_by: hidden && user?.id ? user.id : null,
    hidden_at: hidden ? new Date() : null
  });


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
