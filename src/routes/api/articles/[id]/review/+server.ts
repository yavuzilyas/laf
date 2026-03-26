import { json } from '@sveltejs/kit';
import { getArticleById, updateArticle, createNotification } from '$db/queries';
import { notifyArticleStatusChange } from '$lib/server/notifications-pg';

const APPROVE_ACTION = 'approve';
const REJECT_ACTION = 'reject';
const REQUEUE_ACTION = 'requeue';

export async function POST({ params, request, locals }) {
  const currentUser = (locals as any).user;

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const articleId = params.id;
  if (!articleId || typeof articleId !== 'string') {
    return json({ error: 'Invalid article id' }, { status: 400 });
  }

  const { action, reason } = await request.json().catch(() => ({}));
  if (![APPROVE_ACTION, REJECT_ACTION, REQUEUE_ACTION].includes(action)) {
    return json({ error: 'Invalid action' }, { status: 400 });
  }

  const article = await getArticleById(articleId);

  if (!article || article.deleted_at) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  const pendingReview = {
    ...(article.pending_review || {}),
    reviewerId: currentUser.id || null,
    reviewedAt: new Date(),
    status:
      action === APPROVE_ACTION
        ? 'approved'
        : action === REJECT_ACTION
          ? 'rejected'
          : 'pending',
    comment: action === REJECT_ACTION ? reason || 'İçerik yönergelere uygun değil' : null,
    requestedAt:
      action === REQUEUE_ACTION
        ? new Date()
        : article.pending_review?.requestedAt ?? new Date()
  };

  if (action === REQUEUE_ACTION) {
    pendingReview.reviewerId = null;
    pendingReview.reviewedAt = null;
  }

  const updates: Record<string, any> = {
    pending_review: pendingReview,
    metadata: {
      ...(article.metadata || {}),
      moderationAction: {
        action,
        moderatorId: currentUser.id || null,
        reason: action === REJECT_ACTION ? reason || 'İçerik yönergelere uygun değil' : undefined,
        timestamp: new Date()
      }
    }
  };

  if (action === APPROVE_ACTION) {
    updates.status = 'published';
    updates.published_at = article.published_at ?? new Date();
  } else if (action === REJECT_ACTION) {
    updates.status = 'rejected';
  } else if (action === REQUEUE_ACTION) {
    updates.status = 'pending';
    updates.published_at = null;
  }

  await updateArticle(articleId, updates);

  // Send notification to the author about status change
  if (article.author_id && article.author_id !== currentUser.id) {
    try {
      // Fetch the updated article to get the actual moderation reason
      const updatedArticle = await getArticleById(articleId);
      
      const translations = updatedArticle.translations || {};
      const defaultLang = updatedArticle.default_language || 'tr';
      const articleTitle = translations[defaultLang]?.title || translations.en?.title || 'Başlıksız Makale';
      const linkSlug = translations[defaultLang]?.slug ?? articleId;

      // Get the actual reason from the updated article data
      let actualReason = reason || 'İçerik yönergelere uygun değil';
      
      if (action === REJECT_ACTION) {
        // Try to get reason from pending_review.comment first
        if (updatedArticle.pending_review?.comment) {
          actualReason = updatedArticle.pending_review.comment;
        }
        // Fallback to metadata.moderationAction.reason
        else if (updatedArticle.metadata?.moderationAction?.reason) {
          actualReason = updatedArticle.metadata.moderationAction.reason;
        }
      }

      await notifyArticleStatusChange({
        articleId,
        authorId: article.author_id,
        newStatus: updates.status,
        notes: action === REJECT_ACTION ? actualReason : null,
        moderatorId: currentUser.id,
        articleTitle,
        articleSlug: linkSlug
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }
  }

  return json({ success: true, status: updates.status });
}
