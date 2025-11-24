// src/routes/api/articles/[id]/comments/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection, getArticlesCollection, getUsersCollection } from '$db/mongo';
import { notifyArticleComment, notifyCommentReply } from '$lib/server/notifications';

export async function GET({ params, locals }) {
  const comments = await getCommentsCollection();
  const users = await getUsersCollection();
  const user = (locals as any)?.user;
  const viewerObjectId = user ? new ObjectId(user.id) : null;

  let viewerBlockedIds = new Set<string>();
  let blockedViewerIds = new Set<string>();

  if (viewerObjectId) {
    const viewerDoc = await users.findOne(
      { _id: viewerObjectId },
      { projection: { blocked: 1 } }
    );

    if (Array.isArray(viewerDoc?.blocked)) {
      viewerBlockedIds = new Set(
        viewerDoc.blocked
          .map((entry: any) => entry?.blockedUserId)
          .filter(Boolean)
          .map((id: any) => id.toString())
      );
    }

    const blockedByDocs = await users
      .find({ 'blocked.blockedUserId': viewerObjectId }, { projection: { _id: 1 } })
      .toArray();
    blockedViewerIds = new Set(blockedByDocs.map((doc) => doc._id.toString()));
  }

  const shouldHideUser = (authorId: string | null | undefined) => {
    if (!authorId || !user) return false;
    if (authorId === user.id) return false;
    return viewerBlockedIds.has(authorId) || blockedViewerIds.has(authorId);
  };

  async function loadReplies(parentId: string): Promise<any[]> {
    const replies = await comments
      .find({
        parentId: new ObjectId(parentId),
        deletedAt: { $exists: false },
        $or: [
          { hidden: { $ne: true } },  // Diğer kullanıcıların gizli yorumları
          { userId: user ? new ObjectId(user.id) : null }  // Kullanıcının kendi yorumları
        ]
      })
      .sort({ createdAt: 1 } as any)
      .toArray();

    const nested = await Promise.all(
      replies
        .filter((r: any) => !shouldHideUser(r.userId?.toString?.() || r.userId))
        .map(async (r: any) => ({
        id: r._id.toString(),
        userId: r.userId?.toString?.() || r.userId,
        content: r.content,
        createdAt: r.createdAt?.toISOString?.() || r.createdAt,
        author: r.author || null,
        likes: r.likes || 0,
        dislikes: r.dislikes || 0,
        replies: await loadReplies(r._id.toString())
      }))
    );

    return nested;
  }

  const list = await comments
    .find({
      articleId: new ObjectId(params.id),
      parentId: { $exists: false },
      deletedAt: { $exists: false },
      $or: [
        { hidden: { $ne: true } },  // Diğer kullanıcıların gizli yorumları
        { userId: user ? new ObjectId(user.id) : null }  // Kullanıcının kendi yorumları
      ]
    })
    .sort({ createdAt: -1 } as any)
    .toArray();

  const normalized = await Promise.all(
    list
      .filter((c: any) => !shouldHideUser(c.userId?.toString?.() || c.userId))
      .map(async (c: any) => ({
      id: c._id.toString(),
      userId: c.userId?.toString?.() || c.userId,
      content: c.content,
      createdAt: c.createdAt?.toISOString?.() || c.createdAt,
      author: c.author || null,
      likes: c.likes || 0,
      dislikes: c.dislikes || 0,
      replies: await loadReplies(c._id.toString())
    }))
  );

  return json(normalized);
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const content = body?.content;
  const parentId = body?.parentId;
  
  if (content === undefined || content === null) return json({ error: 'Empty' }, { status: 400 });

  const comments = await getCommentsCollection();
  const articles = await getArticlesCollection();
  const article = await articles.findOne({ _id: new ObjectId(params.id) }, { projection: { authorId: 1, title: 1, slug: 1 } });
  
  const doc: any = {
    articleId: new ObjectId(params.id),
    userId: new ObjectId(user.id),
    content,
    createdAt: new Date(),
    author: { id: user.id, nickname: user.nickname, name: user.name, surname: user.surname },
    likes: 0,
    dislikes: 0
  };
  
  if (parentId) {
    doc.parentId = new ObjectId(parentId);
  }
  
  const res = await comments.insertOne(doc);

  // Update article comment count
  await articles.updateOne(
    { _id: new ObjectId(params.id) },
    { $inc: { 'stats.comments': 1 } }
  );

  const commentId = res.insertedId;

  // Bildirimler
  try {
    await notifyArticleComment({
      articleId: params.id,
      articleSlug: article?.slug ? String(article.slug) : undefined,
      commenterId: user.id,
      articleAuthorId: article?.authorId ?? null,
      commentId,
      articleTitle: article?.title ?? null
    });

    if (parentId) {
      await notifyCommentReply({
        parentCommentId: parentId,
        replierId: user.id,
        articleId: params.id,
        articleSlug: article?.slug ? String(article.slug) : undefined,
        commentId
      });
    }
  } catch (error) {
    console.error('Failed to dispatch comment notifications', error);
  }
  
  return json({ 
    id: commentId.toString(), 
    ...doc, 
    createdAt: doc.createdAt.toISOString(),
    replies: []
  });
}
