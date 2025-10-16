// src/routes/api/articles/[id]/versions/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getVersionsCollection } from '$db/mongo';

export async function GET({ params, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const versions = await getVersionsCollection();
    const list = await versions
      .find({ articleId: new ObjectId(params.id) })
      .sort({ createdAt: -1 } as any)
      .project({ })
      .toArray();

    // Normalize _id to string
    const normalized = list.map((v: any) => ({ ...v, _id: v._id.toString() }));
    return json(normalized);
  } catch (e) {
    console.error('Load versions error:', e);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, changeNote } = body || {};
    const versions = await getVersionsCollection();

    const doc = {
      articleId: new ObjectId(params.id),
      versionNumber: (await versions.countDocuments({ articleId: new ObjectId(params.id) })) + 1,
      data,
      createdAt: new Date(),
      authorId: new ObjectId(user.id),
      changeNote
    };

    const result = await versions.insertOne(doc);
    return json({ ...doc, _id: result.insertedId.toString() });
  } catch (e) {
    console.error('Create version error:', e);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
