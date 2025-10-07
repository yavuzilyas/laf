// src/routes/api/articles/[id]/save/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getSavesCollection } from '$db/mongo';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json();
  const articleId = new ObjectId(params.id);
  const userId = new ObjectId(user.id);

  const saves = await getSavesCollection();

  if (action === 'save') {
    const existing = await saves.findOne({ articleId, userId });
    if (!existing) await saves.insertOne({ articleId, userId, createdAt: new Date() });
    return json({ saved: true });
  }

  if (action === 'unsave') {
    await saves.deleteOne({ articleId, userId });
    return json({ saved: false });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}
