// src/routes/api/articles/[id]/versions/+server.ts
import { json } from '@sveltejs/kit';
import { getVersions, createVersion } from '$db/queries';

export async function GET({ params, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await getVersions({ articleId: params.id });

    // Normalize id to string
    const normalized = list.map((v: any) => ({ 
      ...v, 
      id: v.id,
      articleId: v.article_id,
      createdAt: v.created_at,
      createdBy: v.created_by,
      changeNote: v.change_note
    }));
    return json(normalized);
  } catch (e) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data, changeNote } = body || {};

    const result = await createVersion({
      articleId: params.id,
      data,
      authorId: user.id,
      changeNote
    });

    return json({ 
      id: result.id,
      articleId: params.id,
      versionNumber: result.version_number,
      data: result.data,
      createdAt: result.created_at,
      authorId: user.id,
      changeNote: result.change_note
    });
  } catch (e) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
