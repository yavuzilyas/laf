import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection } from '$db/mongo';
import { createNotification } from '$lib/server/notifications';

const APPROVE_ACTION = 'approve';
const REJECT_ACTION = 'reject';
const REQUEUE_ACTION = 'requeue';

export async function POST({ params, request, locals }) {
  const currentUser = locals.user;

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const articleId = params.id;
  if (!ObjectId.isValid(articleId)) {
    return json({ error: 'Invalid article id' }, { status: 400 });
  }

  const { action, reason } = await request.json().catch(() => ({}));
  if (![APPROVE_ACTION, REJECT_ACTION, REQUEUE_ACTION].includes(action)) {
    return json({ error: 'Invalid action' }, { status: 400 });
  }

  const articlesCollection = await getArticlesCollection();
  const targetId = new ObjectId(articleId);
  const article = await articlesCollection.findOne({ _id: targetId, deletedAt: { $exists: false } });

  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }

  const update: Record<string, unknown> = {
    updatedAt: new Date(),
    pendingReview: {
      ...(article.pendingReview ?? {}),
      reviewerId: currentUser.id ? new ObjectId(currentUser.id) : null,
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
          : article.pendingReview?.requestedAt ?? new Date(),
      reviewerId:
        action === REQUEUE_ACTION ? null : currentUser.id ? new ObjectId(currentUser.id) : null,
      reviewedAt: action === REQUEUE_ACTION ? null : new Date()
    },
    moderationAction: {
      action,
      moderatorId: currentUser.id ? new ObjectId(currentUser.id) : null,
      reason: action === REJECT_ACTION ? reason || 'İçerik yönergelere uygun değil' : undefined,
      timestamp: new Date()
    }
  };

  if (action === APPROVE_ACTION) {
    update.status = 'published';
    update.publishedAt = article.publishedAt ?? new Date();
  } else if (action === REJECT_ACTION) {
    update.status = 'rejected';
  } else if (action === REQUEUE_ACTION) {
    update.status = 'pending';
    update.publishedAt = null;
  }

  await articlesCollection.updateOne({ _id: targetId }, { $set: update });

  if (action === REJECT_ACTION && article.authorId) {
    const linkSlug =
      article.slug ??
      article.translations?.[article.defaultLanguage ?? '']?.slug ??
      article._id.toString();1

    await createNotification({
      userId: article.authorId,
      type: 'announcement',
      title: 'Makalen reddedildi',
      message: reason || 'İçerik yönergelere uygun değil',
      link: linkSlug ? `/article/${linkSlug}` : null,
      actor: currentUser.id
        ? {
            id: currentUser.id,
            nickname: currentUser.nickname ?? null,
            name: currentUser.name ?? null
          }
        : null,
      meta: {
        articleId: article._id.toString(),
        action: 'reject'
      }
    });
  }

  return json({ success: true, status: update.status });
}
