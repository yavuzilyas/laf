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
  const title = actorName ? `${actorName} makalene yorum yaptı` : `Bir kullanıcı makalene yorum yaptı`;
  const message = articleTitle ? `${articleTitle} makalene yeni bir yorum var.` : `Makalene yeni bir yorum geldi.`;
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
  const title = actorName ? `${actorName} yorumuna yanıt verdi` : `Bir kullanıcı yorumuna yanıt verdi`;
  await createNotification({
    userId: parent.userId,
    type: 'reply',
    title,
    message: `Yeni bir yanıtın var.`,
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

  let title: string;
  if (count === 1) {
    title = (firstName ?? 'Bir kullanıcı') + ' makaleni beğendi';
  } else if (count === 2) {
    title = `${firstName ?? 'Bir kullanıcı'} ve ${secondName ?? 'bir başkası'} makaleni beğendi`;
  } else {
    title = `${firstName ?? 'Bir kullanıcı'} ve diğer ${count - 1} kişi makaleni beğendi`;
  }

  const message = article?.title ? `${article.title} makalene beğeni var.` : `Makalene beğeni var.`;

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

  let title: string;
  if (count === 1) {
    title = (firstName ?? 'Bir kullanıcı') + ' yorumunu beğendi';
  } else if (count === 2) {
    title = `${firstName ?? 'Bir kullanıcı'} ve ${secondName ?? 'bir başkası'} yorumunu beğendi`;
  } else {
    title = `${firstName ?? 'Bir kullanıcı'} ve diğer ${count - 1} kişi yorumunu beğendi`;
  }

  await notifications.updateOne(
    { userId, type: 'like', 'meta.commentId': commentIdStr, 'meta.kind': 'comment-like' },
    {
      $set: {
        title,
        message: `Yorumuna beğeni var.`,
        link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
        actor: { id: likerIdStr, name: await getUserName(likerId) },
        meta: {
          kind: 'comment-like',
          commentId: commentIdStr,
          articleId: articleIdStr,
          articleSlug: articleSlugValue,
          likerIds,
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

export interface CreateNotificationInput {
	userId: string | ObjectId;
	type: NotificationType;
	title: string;
	message: string;
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

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
	const notifications = await getNotificationsCollection();
	const now = new Date();

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
