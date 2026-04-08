// src/routes/api/articles/[id]/react/+server.ts
import { json } from '@sveltejs/kit';
import { getArticles, toggleArticleReaction, getArticleReactionCounts, getArticleReaction } from '$db/queries';
import { notifyArticleLike } from '$lib/server/notifications-pg';

export async function GET({ params, locals }: any) {
  const user = (locals as any)?.user;
  if (!user) return json({ reaction: null }, { status: 200 });

  const articleId = params.id;
  if (!articleId) {
    return json({ error: 'Article ID is required' }, { status: 400 });
  }

  try {
    const reaction = await getArticleReaction(user.id, articleId);
    return json({ reaction });
  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ params, request, locals }: any) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json(); // "like" | "dislike" | null
  const articleId = params.id;
  const userId = user.id;

  const articles = await getArticles({ id: articleId });
  const article = articles[0];
  if (!article) return json({ error: 'Article not found' }, { status: 404 });

  // Use the toggleArticleReaction function from queries
  const reactionResult = await toggleArticleReaction(userId, articleId, action);
  
  // Get updated reaction counts
  const counts = await getArticleReactionCounts(articleId);

  // Send notification if liked
  if (reactionResult.reaction === 'like' && reactionResult.previous !== 'like') {
    try {
      await notifyArticleLike({ articleId, likerId: userId });
    } catch (error) {
    }
  }

  return json({
    reaction: reactionResult.reaction,
    previous: reactionResult.previous,
    stats: {
      likes: counts.likes,
      dislikes: counts.dislikes,
      comments: article.comments_count || 0,
      views: article.views || 0
    }
  });
}

