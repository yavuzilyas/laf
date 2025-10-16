// src/routes/api/articles/[id]/comments/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection, getArticlesCollection } from '$db/mongo';

export async function GET({ params }) {
  const comments = await getCommentsCollection();
  const list = await comments
    .find({ articleId: new ObjectId(params.id), parentId: { $exists: false } })
    .sort({ createdAt: -1 } as any)
    .toArray();
  
  // Get replies for each comment
  const normalized = await Promise.all(list.map(async (c: any) => {
    const replies = await comments
      .find({ parentId: c._id })
      .sort({ createdAt: 1 } as any)
      .toArray();
    
    return {
      id: c._id.toString(),
      userId: c.userId?.toString?.() || c.userId,
      content: c.content,
      createdAt: c.createdAt?.toISOString?.() || c.createdAt,
      author: c.author || null,
      likes: c.likes || 0,
      dislikes: c.dislikes || 0,
      replies: replies.map((r: any) => ({
        id: r._id.toString(),
        userId: r.userId?.toString?.() || r.userId,
        content: r.content,
        createdAt: r.createdAt?.toISOString?.() || r.createdAt,
        author: r.author || null,
        likes: r.likes || 0,
        dislikes: r.dislikes || 0
      }))
    };
  }));
  
  return json(normalized);
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const content = (body?.content || '').toString().trim();
  const parentId = body?.parentId;
  
  if (!content) return json({ error: 'Empty' }, { status: 400 });

  const comments = await getCommentsCollection();
  const articles = await getArticlesCollection();
  
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
  
  return json({ 
    id: res.insertedId.toString(), 
    ...doc, 
    createdAt: doc.createdAt.toISOString(),
    replies: []
  });
}
