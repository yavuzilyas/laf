import { json } from '@sveltejs/kit';
import { getComments } from '$db/queries';

export async function GET({ url, locals }) {
    const user = (locals as any)?.user;
    if (!user) return json({ reactions: {} }, { status: 200 });

    const articleId = url.searchParams.get('articleId');
    if (!articleId) {
        return json({ error: 'articleId is required' }, { status: 400 });
    }

    try {
        // Get all comments for this article
        const comments = await getComments({ article_id: articleId });
        
        // Create a map of commentId -> reaction
        const reactions: Record<string, 'like' | 'dislike' | null> = {};
        comments.forEach((comment: any) => {
            // Check if user has reacted to this comment (stored in metadata.userReactions)
            const metadata = comment.metadata || {};
            const userReactions = metadata.userReactions || {};
            if (userReactions[user.id]) {
                reactions[comment.id] = userReactions[user.id];
            }
        });

        return json({ reactions });
    } catch (error) {
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
