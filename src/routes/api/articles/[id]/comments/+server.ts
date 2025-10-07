// src/routes/api/articles/[id]/comments/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection } from '$db/mongo';

export async function GET({ params }) {
  const comments = await getCommentsCollection();
  const list = await comments
    .find({ articleId: new ObjectId(params.id) })
    .sort({ createdAt: -1 } as any)
    .project({})
    .toArray();
  const normalized = list.map((c: any) => ({
    id: c._id.toString(),
    userId: c.userId?.toString?.() || c.userId,
    content: c.content,
    createdAt: c.createdAt?.toISOString?.() || c.createdAt,
    author: c.author || null
  }));
  return json(normalized);
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const content = (body?.content || '').toString().trim();
  if (!content) return json({ error: 'Empty' }, { status: 400 });

  const comments = await getCommentsCollection();
  const doc = {
    articleId: new ObjectId(params.id),
    userId: new ObjectId(user.id),
    content,
    createdAt: new Date(),
    author: { id: user.id, nickname: user.nickname, name: user.name, surname: user.surname }
  };
  const res = await comments.insertOne(doc);
  return json({ id: res.insertedId.toString(), ...doc, createdAt: doc.createdAt.toISOString() });
}
