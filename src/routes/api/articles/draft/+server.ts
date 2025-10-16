// src/routes/api/articles/draft/+server.ts
import { json } from '@sveltejs/kit';
import { getDraftsCollection } from '$db/mongo';

export async function GET({ locals }) {
	const user = (locals as any)?.user;
	// Return null with 200 to avoid noisy unauthorized logs during browsing
	if (!user) return json(null);

	try {
		const drafts = await getDraftsCollection();
    const draft = await drafts.findOne(
      { authorId: user.id },
      { sort: { lastSaved: -1 } as any }
    );

    if (!draft) return json(null);

    return json(draft.data || null);
  } catch (e) {
    console.error('Load draft error:', e);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
