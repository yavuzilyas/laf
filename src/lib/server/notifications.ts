import { ObjectId } from 'mongodb';
import { getNotificationsCollection, getCommentsCollection, getArticlesCollection, getUsersCollection, toObjectId } from '$db/mongo';

export type NotificationType = 'announcement' | 'comment' | 'reply' | 'like';

export interface NotificationActor {
	id: string;
	nickname?: string | null;
	name?: string | null;
}

async function isActorBlocked(userId: ObjectId | string, actorId: ObjectId | string | null | undefined): Promise<boolean> {
  if (!actorId) return false;
  const notifications = await getNotificationsCollection();
  const blockedCol = notifications.db.collection('blockedUsers');
  const doc = await blockedCol.findOne({ userId: toObjectId(userId), blockedActorIds: typeof actorId === 'string' ? actorId : actorId.toHexString() });
  return !!doc;
}

async function getUserName(userId: ObjectId | string): Promise<string | null> {
  const users = await getUsersCollection();
  const doc = await users.findOne({ _id: toObjectId(userId) }, { projection: { nickname: 1, name: 1, surname: 1 } });
  if (!doc) return null;
  if (doc.nickname) return doc.nickname;
  if (doc.name && doc.surname) return `${doc.name} ${doc.surname}`;
  if (doc.name) return doc.name;
  return null;
}

function toIdString(id: string | ObjectId | null | undefined): string | null {
  if (!id) return null;
  return typeof id === 'string' ? id : id.toHexString();
}

async function resolveArticleSlug(articleId: string | ObjectId): Promise<string | null> {
  const articles = await getArticlesCollection();
  const doc = await articles.findOne(
    { _id: toObjectId(articleId) },
    { projection: { slug: 1, translations: 1, defaultLanguage: 1 } }
  );
  return slugFromArticleDoc(doc);
}

function slugFromArticleDoc(doc: any): string | null {
  if (!doc) return null;
  if (doc.slug) return typeof doc.slug === 'string' ? doc.slug : String(doc.slug);

  const translations = doc.translations;
  if (translations && typeof translations === 'object') {
    if (doc.defaultLanguage && translations[doc.defaultLanguage]?.slug) {
      const value = translations[doc.defaultLanguage].slug;
      if (value) return typeof value === 'string' ? value : String(value);
    }

    for (const entry of Object.values(translations) as any[]) {
      if (entry?.slug) {
        return typeof entry.slug === 'string' ? entry.slug : String(entry.slug);
      }
    }
  }

  return null;
}

export async function notifyArticleComment(params: { articleId: string | ObjectId; articleSlug?: string | null; commenterId: string | ObjectId; articleAuthorId?: string | ObjectId | null; commentId: string | ObjectId; articleTitle?: string | null }) {
  const { articleId, articleSlug, commenterId, articleAuthorId, commentId, articleTitle } = params;
  if (!articleAuthorId) return;
  const targetId = toObjectId(articleAuthorId);
  if (targetId.equals(toObjectId(commenterId))) return;
  if (await isActorBlocked(targetId, commenterId)) return;
  const articleIdStr = toIdString(articleId);
  const commentIdStr = toIdString(commentId);
  if (!articleIdStr || !commentIdStr) return;
  const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
  const actorName = await getUserName(commenterId);
  const title = actorName ? 
    { key: 'notifications.messages.newComment', values: { user: actorName } } : 
    { key: 'notifications.messages.newComment', values: { user: 'Bir kullanıcı' } };
  const message = articleTitle ? 
    { key: 'notifications.messages.newCommentWithTitle', values: { user: actorName || 'Bir kullanıcı', title: articleTitle } } : 
    { key: 'notifications.messages.newCommentGeneric', values: { user: actorName || 'Bir kullanıcı' } };
  await createNotification({
    userId: targetId,
    type: 'comment',
    title,
    message,
    link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
    actor: {
      id: toObjectId(commenterId).toHexString(),
      name: actorName,
    },
    meta: {
      articleId: articleIdStr,
      articleSlug: articleSlugValue,
      commentId: commentIdStr,
    },
  });
}

export async function notifyCommentReply(params: { parentCommentId: string | ObjectId; replierId: string | ObjectId; articleId: string | ObjectId; articleSlug?: string | null; commentId: string | ObjectId }) {
  const { parentCommentId, replierId, articleId, articleSlug, commentId } = params;
  const comments = await getCommentsCollection();
  const parent = await comments.findOne({ _id: toObjectId(parentCommentId) }, { projection: { userId: 1 } });
  if (!parent?.userId) return;
  if (toObjectId(parent.userId).equals(toObjectId(replierId))) return;
  if (await isActorBlocked(parent.userId, replierId)) return;
  const articleIdStr = toIdString(articleId);
  const commentIdStr = toIdString(commentId);
  const parentIdStr = toIdString(parentCommentId);
  if (!articleIdStr || !commentIdStr || !parentIdStr) return;
  const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
  const actorName = await getUserName(replierId);
  const title = { key: 'notifications.messages.newReply' };
  await createNotification({
    userId: parent.userId,
    type: 'reply',
    title,
    message: { key: 'notifications.messages.newReplyMessage' },
    link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
    actor: {
      id: toObjectId(replierId).toHexString(),
      name: actorName,
    },
    meta: {
      articleId: articleIdStr,
      articleSlug: articleSlugValue,
      commentId: commentIdStr,
      parentCommentId: parentIdStr,
    },
  });
}

export async function notifyArticleLike(params: { articleId: string | ObjectId; articleSlug?: string | null; likerId: string | ObjectId }) {
  const { articleId, articleSlug, likerId } = params;
  const articles = await getArticlesCollection();
  const article = await articles.findOne(
    { _id: toObjectId(articleId) },
    { projection: { authorId: 1, title: 1, slug: 1, translations: 1, defaultLanguage: 1 } }
  );
  if (!article?.authorId) return;
  if (toObjectId(article.authorId).equals(toObjectId(likerId))) return;
  if (await isActorBlocked(article.authorId, likerId)) return;
  const articleIdStr = toIdString(articleId);
  if (!articleIdStr) return;
  const articleSlugValue = articleSlug ?? slugFromArticleDoc(article) ?? articleIdStr;
  const notifications = await getNotificationsCollection();
  const userId = toObjectId(article.authorId);
  const likerIdStr = toObjectId(likerId).toHexString();

  // Find existing like notification for this article
  const existing = await notifications.findOne({
    userId,
    type: 'like',
    'meta.articleId': articleIdStr,
    'meta.kind': 'article-like',
  });

  let likerIds: string[] = [];
  if (existing?.meta?.likerIds && Array.isArray(existing.meta.likerIds)) {
    likerIds = existing.meta.likerIds as string[];
  }
  if (!likerIds.includes(likerIdStr)) likerIds.push(likerIdStr);

  // Prepare title based on count
  const count = likerIds.length;
  const firstName = await getUserName(likerIds[0]);
  let secondName: string | null = null;
  if (count > 1) secondName = await getUserName(likerIds[1]);
  
  // Get names for all likers
  const likerNames: string[] = [];
  for (const likerId of likerIds) {
    const name = await getUserName(likerId);
    if (name) likerNames.push(name);
  }

  let title: { key: string; values?: Record<string, string | number | null | undefined> };
  if (count === 1) {
    title = { key: 'notifications.messages.articleLiked' };
  } else if (count === 2) {
    title = { key: 'notifications.messages.articleLikedTwo' };
  } else {
    title = { key: 'notifications.messages.articleLikedMany', values: { count: count - 1 } };
  }

  const message = article?.title 
    ? { key: 'notifications.messages.articleLikedMessageWithTitle', values: { title: article.title } }
    : { key: 'notifications.messages.articleLikedMessage' };

  await notifications.updateOne(
    { userId, type: 'like', 'meta.articleId': articleIdStr, 'meta.kind': 'article-like' },
    {
      $set: {
        title,
        message,
        link: `/article/${articleSlugValue}`,
        actor: { id: likerIdStr, name: await getUserName(likerId) },
        meta: {
          kind: 'article-like',
          articleId: articleIdStr,
          articleSlug: articleSlugValue,
          likerIds,
          likerNames,
          count,
        },
        read: false,
        createdAt: new Date(),
        readAt: null,
      },
    },
    { upsert: true }
  );
}

export async function notifyCommentLike(params: { commentId: string | ObjectId; likerId: string | ObjectId; articleId: string | ObjectId; articleSlug?: string | null }) {
  const { commentId, likerId, articleId, articleSlug } = params;
  const comments = await getCommentsCollection();
  const comment = await comments.findOne({ _id: toObjectId(commentId) }, { projection: { userId: 1 } });
  if (!comment?.userId) return;
  if (toObjectId(comment.userId).equals(toObjectId(likerId))) return;
  if (await isActorBlocked(comment.userId, likerId)) return;
  const commentIdStr = toIdString(commentId);
  const articleIdStr = toIdString(articleId);
  if (!commentIdStr || !articleIdStr) return;
  const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;

  const notifications = await getNotificationsCollection();
  const userId = toObjectId(comment.userId);
  const likerIdStr = toObjectId(likerId).toHexString();

  const existing = await notifications.findOne({
    userId,
    type: 'like',
    'meta.commentId': commentIdStr,
    'meta.kind': 'comment-like',
  });

  let likerIds: string[] = [];
  if (existing?.meta?.likerIds && Array.isArray(existing.meta.likerIds)) {
    likerIds = existing.meta.likerIds as string[];
  }
  if (!likerIds.includes(likerIdStr)) likerIds.push(likerIdStr);

  const count = likerIds.length;
  const firstName = await getUserName(likerIds[0]);
  let secondName: string | null = null;
  if (count > 1) secondName = await getUserName(likerIds[1]);
  
  // Get names for all likers
  const likerNames: string[] = [];
  for (const likerId of likerIds) {
    const name = await getUserName(likerId);
    if (name) likerNames.push(name);
  }

  let title: { key: string; values?: Record<string, string | number | null | undefined> };
  if (count === 1) {
    title = { key: 'notifications.messages.commentLiked' };
  } else if (count === 2) {
    title = { key: 'notifications.messages.commentLikedTwo' };
  } else {
    title = { key: 'notifications.messages.commentLikedMany', values: { count: count - 1 } };
  }

  await notifications.updateOne(
    { userId, type: 'like', 'meta.commentId': commentIdStr, 'meta.kind': 'comment-like' },
    {
      $set: {
        title,
        message: { key: 'notifications.messages.commentLikedMessage' },
        link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
        actor: { id: likerIdStr, name: await getUserName(likerId) },
        meta: {
          kind: 'comment-like',
          commentId: commentIdStr,
          articleId: articleIdStr,
          articleSlug: articleSlugValue,
          likerIds,
          likerNames,
          count,
        },
        read: false,
        createdAt: new Date(),
        readAt: null,
      },
    },
    { upsert: true }
  );
}

export interface NotificationMeta {
	[key: string]: any;
}

export interface TranslationObject {
  key: string;
  values?: Record<string, string | number | null | undefined>;
}

export interface CreateNotificationInput {
	userId: string | ObjectId;
	type: NotificationType;
	title: string | TranslationObject;
	message: string | TranslationObject;
	link?: string | null;
	actor?: NotificationActor | null;
	meta?: NotificationMeta | null;
}

export interface NotificationRecord {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	link: string | null;
	actor: NotificationActor | null;
	meta: NotificationMeta | null;
	read: boolean;
	createdAt: string;
	readAt?: string | null;
}

export async function notifyNewArticle(params: { 
  articleId: string | ObjectId; 
  articleSlug?: string | null; 
  authorId: string | ObjectId;
  articleTitle: string;
  authorName: string;
}) {
  const { articleId, articleSlug, authorId, articleTitle, authorName } = params;
  const users = await getUsersCollection();
  const articleIdStr = toIdString(articleId);
  if (!articleIdStr) return;

  // Get all followers of the author
  const followers = await users.find(
    { 'following.followingUserId': toObjectId(authorId) },
    { projection: { _id: 1 } }
  ).toArray();

  const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
  
  // Create notifications for each follower
  const notificationPromises = followers.map(async (follower) => {
    if (follower._id.equals(toObjectId(authorId))) return; // Don't notify self
    
    await createNotification({
      userId: follower._id,
      type: 'announcement',
      title: { key: 'notifications.messages.newArticlePublished', values: { title: articleTitle } },
      message: { key: 'notifications.messages.newArticlePublishedMessage', values: { title: articleTitle } },
      link: `/article/${articleSlugValue}`,
      actor: {
        id: toObjectId(authorId).toHexString(),
        name: authorName
      },
      meta: {
        kind: 'new-article',
        articleId: articleIdStr,
        articleSlug: articleSlugValue
      }
    });
  });

  await Promise.all(notificationPromises);
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord | null> {
    const notifications = await getNotificationsCollection();
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today

    // Check for existing similar notification today
    const existing = await notifications.findOne({
        userId: toObjectId(input.userId),
        type: input.type,
        createdAt: { $gte: today },
        ...(input.meta?.articleId && { 'meta.articleId': input.meta.articleId }),
        ...(input.meta?.commentId && { 'meta.commentId': input.meta.commentId }),
        ...(input.actor?.id && { 'actor.id': input.actor.id })
    });

    // If a similar notification exists today, don't create a new one
    if (existing) {
        return null;
    }

    const doc = {
        userId: toObjectId(input.userId),
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        actor: input.actor ?? null,
        meta: input.meta ?? null,
        read: false,
        createdAt: now,
        readAt: null as Date | null
    };

    const res = await notifications.insertOne(doc);

    return {
        id: res.insertedId.toString(),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        link: doc.link,
        actor: doc.actor,
        meta: doc.meta,
        read: doc.read,
        createdAt: now.toISOString()
    };
}

export function normalizeNotification(doc: any): NotificationRecord {
	return {
		id: doc._id.toString(),
		type: doc.type,
		title: doc.title,
		message: doc.message,
		link: doc.link ?? null,
		actor: doc.actor ?? null,
		meta: doc.meta ?? null,
		read: !!doc.read,
		createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
		readAt: doc.readAt?.toISOString?.() ?? null
	};
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
	const notifications = await getNotificationsCollection();
	const result = await notifications.updateOne(
		{ _id: new ObjectId(notificationId), userId: toObjectId(userId) },
		{ $set: { read: true, readAt: new Date() } }
	);
	return result.modifiedCount > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
	const notifications = await getNotificationsCollection();
	const result = await notifications.updateMany(
		{ userId: toObjectId(userId), read: { $ne: true } },
		{ $set: { read: true, readAt: new Date() } }
	);
	return result.modifiedCount;
}
