import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCommentsCollection } from '$db/mongo';

export async function GET({ url, locals }) {
    const user = (locals as any)?.user;
    if (!user) return json({ reactions: {} }, { status: 200 });

    const articleId = url.searchParams.get('articleId');
    if (!articleId) {
        return json({ error: 'articleId is required' }, { status: 400 });
    }

    try {
        const comments = await getCommentsCollection();
        
        // Find all comments for this article where the current user has reacted
        const userComments = await comments.find({
            'articleId': new ObjectId(articleId),
            $or: [
                { 'userReactions': { $exists: true, $ne: {} } },
                { 'userReactions.userId': new ObjectId(user.id) }
            ]
        }).toArray();

        // Create a map of commentId -> reaction
        const reactions = {};
        userComments.forEach(comment => {
            if (comment.userReactions?.[user.id]) {
                reactions[comment._id.toString()] = comment.userReactions[user.id];
            }
        });

        return json({ reactions });
    } catch (error) {
        console.error('Failed to fetch user reactions:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
