// src/routes/api/articles/[id]/save/+server.ts
import { json } from '@sveltejs/kit';
import { getSavesCollection } from '$db/queries';

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json();
  const articleId = params.id;
  const userId = user.id;

  const saves = await getSavesCollection();

  if (action === 'save') {
    const existing = await saves.findOne({ userId, articleId });
    if (!existing) await saves.insertOne({ userId, articleId, createdAt: new Date() });
    return json({ saved: true });
  }

  if (action === 'unsave') {
    await saves.deleteOne({ userId, articleId });
    return json({ saved: false });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}
