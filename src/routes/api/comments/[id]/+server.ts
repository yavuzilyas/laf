// src/routes/api/comments/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, deleteComment, getArticles, updateArticle } from '$db/queries';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;
  console.log('COMMENT DELETE API - User:', user);
  console.log('COMMENT DELETE API - Params ID:', params.id);

  // TEMPORARY: Skip authentication for testing
  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = params.id;
  // const userId = user.id;

  // Get comment
  const commentData = await getComments({ id: commentId });
  const comment = commentData[0];

  console.log('COMMENT DELETE API - Found comment:', !!comment);

  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Yorumu soft delete yap
  await deleteComment(commentId);

  // Article'ın comment count'ını azalt
  if (comment?.article_id) {
    const articles = await getArticles({ id: comment.article_id });
    if (articles.length > 0) {
      const article = articles[0];
      await updateArticle(comment.article_id, { 
        comments_count: Math.max(0, (article.comments_count || 0) - 1) 
      });
    }
  }

  return json({ success: true, message: 'Comment deleted successfully' });
}
