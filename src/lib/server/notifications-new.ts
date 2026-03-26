import { getNotifications, getComments, getArticles, getUsers, createNotification, getBlockedUsers } from '$db/queries';

export type NotificationType = 'announcement' | 'comment' | 'reply' | 'like';

export interface NotificationActor {
	id: string;
	nickname?: string | null;
	name?: string | null;
}

async function isActorBlocked(userId: string, actorId: string | null | undefined): Promise<boolean> {
  if (!actorId) return false;
  const blockedUsers = await getBlockedUsers(userId);
  if (blockedUsers?.blocked_actor_ids) {
    return blockedUsers.blocked_actor_ids.includes(actorId);
  }
  return false;
}

async function getUserName(userId: string): Promise<string | null> {
  const users = await getUsers({ id: userId });
  const doc = users[0];
  if (!doc) return null;
  if (doc.username) return doc.username;
  if (doc.name && doc.surname) return `${doc.name} ${doc.surname}`;
  if (doc.name) return doc.name;
  return null;
}

function toIdString(id: string | null | undefined): string | null {
  if (!id) return null;
  return id;
}

async function resolveArticleSlug(articleId: string): Promise<string | null> {
  const articles = await getArticles({ id: articleId });
  const doc = articles[0];
  return slugFromArticleDoc(doc);
}

function slugFromArticleDoc(doc: any): string | null {
  if (!doc) return null;
  // For now, just return the ID as slug
  return doc.id;
}

export async function notifyArticleComment(params: { 
  articleId: string; 
  articleSlug?: string | null; 
  commenterId: string; 
  articleAuthorId?: string | null; 
  commentId: string; 
  articleTitle?: string | null 
}) {
  const { articleId, articleSlug, commenterId, articleAuthorId, commentId, articleTitle } = params;
  if (!articleAuthorId) return;
  if (articleAuthorId === commenterId) return;
  if (await isActorBlocked(articleAuthorId, commenterId)) return;
  
  const actorName = await getUserName(commenterId);
  const title = actorName ? 
    { key: 'notifications.messages.newComment', values: { user: actorName } } : 
    { key: 'notifications.messages.newComment', values: { user: 'Bir kullanıcı' } };
    
  await createNotification({
    userId: articleAuthorId,
    type: 'comment',
    title: title,
    message: { key: 'notifications.messages.newCommentGeneric', values: { user: actorName || 'Bir kullanıcı' } },
    link: `/article/${articleSlug || articleId}#comment-${commentId}`,
    actor: {
      id: commenterId,
      name: actorName,
    },
    meta: {
      articleId: articleId,
      commentId: commentId,
    },
  });
}

export async function notifyCommentReply(params: { 
  parentCommentId: string; 
  replierId: string; 
  articleId: string; 
  articleSlug?: string | null; 
  commentId: string 
}) {
  const { parentCommentId, replierId, articleId, articleSlug, commentId } = params;
  const comments = await getComments({ id: parentCommentId });
  const parent = comments[0];
  if (!parent?.author_id) return;
  if (parent.author_id === replierId) return;
  if (await isActorBlocked(parent.author_id, replierId)) return;
  
  const actorName = await getUserName(replierId);
  
  await createNotification({
    userId: parent.author_id,
    type: 'reply',
    title: { key: 'notifications.messages.newReply' },
    message: { key: 'notifications.messages.newReplyMessage' },
    link: `/article/${articleSlug || articleId}#comment-${commentId}`,
    actor: {
      id: replierId,
      name: actorName,
    },
    meta: {
      articleId: articleId,
      commentId: commentId,
      parentCommentId: parentCommentId,
    },
  });
}

export async function notifyArticleLike(params: { 
  articleId: string; 
  articleSlug?: string | null; 
  likerId: string 
}) {
  const { articleId, articleSlug, likerId } = params;
  const articles = await getArticles({ id: articleId });
  const article = articles[0];
  if (!article?.author_id) return;
  if (article.author_id === likerId) return;
  if (await isActorBlocked(article.author_id, likerId)) return;
  
  const actorName = await getUserName(likerId);
  
  await createNotification({
    userId: article.author_id,
    type: 'like',
    title: { key: 'notifications.messages.articleLiked' },
    message: { key: 'notifications.messages.articleLikedMessage', values: { title: article.title } },
    link: `/article/${articleSlug || articleId}`,
    actor: {
      id: likerId,
      name: actorName,
    },
    meta: {
      articleId: articleId,
      kind: 'article-like',
    },
  });
}

export async function notifyCommentLike(params: { 
  commentId: string; 
  likerId: string; 
  articleId: string; 
  articleSlug?: string | null 
}) {
  const { commentId, likerId, articleId, articleSlug } = params;
  const comments = await getComments({ id: commentId });
  const comment = comments[0];
  if (!comment?.author_id) return;
  if (comment.author_id === likerId) return;
  if (await isActorBlocked(comment.author_id, likerId)) return;
  
  const actorName = await getUserName(likerId);
  
  await createNotification({
    userId: comment.author_id,
    type: 'like',
    title: { key: 'notifications.messages.commentLiked' },
    message: { key: 'notifications.messages.commentLikedMessage' },
    link: `/article/${articleSlug || articleId}#comment-${commentId}`,
    actor: {
      id: likerId,
      name: actorName,
    },
    meta: {
      articleId: articleId,
      commentId: commentId,
      kind: 'comment-like',
    },
  });
}
