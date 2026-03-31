// src/routes/api/articles/draft/+server.ts
import { json } from '@sveltejs/kit';
import { getDrafts } from '$db/queries';

export async function GET({ locals }) {
	const user = (locals as any)?.user;
	// Return null with 200 to avoid noisy unauthorized logs during browsing
	if (!user) return json(null);

	try {
    const drafts = await getDrafts({ authorId: user.id });

    if (!drafts || drafts.length === 0) return json(null);

    // Return the most recent draft data
    const draft = drafts[0];
    return json(draft.data || null);
  } catch (e) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
