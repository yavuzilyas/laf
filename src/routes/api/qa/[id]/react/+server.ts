import { json, error as svelteError } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
    const { id } = params;
    const user = (locals as any).user;

    if (!user) {
        throw svelteError(401, 'Unauthorized');
    }

    try {
        const { reaction } = await request.json();

        // Validate reaction
        if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
            throw svelteError(400, 'Invalid reaction');
        }

        // Check if question exists
        const questionCheck = await query(
            'SELECT id FROM questions WHERE id = $1',
            [id]
        );

        if (questionCheck.rows.length === 0) {
            throw svelteError(404, 'Question not found');
        }

        // Get current reaction if any
        const currentReactionResult = await query(
            'SELECT reaction_type FROM question_reactions WHERE question_id = $1 AND user_id = $2',
            [id, user.id]
        );

        const currentReaction = currentReactionResult.rows[0]?.reaction_type || null;

        // Update counts in a transaction
        if (currentReaction === reaction) {
            // Same reaction clicked - remove it
            if (reaction !== null) {
                await query(
                    'DELETE FROM question_reactions WHERE question_id = $1 AND user_id = $2',
                    [id, user.id]
                );

                // Decrement counter
                if (reaction === 'like') {
                    await query(
                        'UPDATE questions SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
                        [id]
                    );
                } else {
                    await query(
                        'UPDATE questions SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = $1',
                        [id]
                    );
                }
            }
        } else {
            // Different reaction or new reaction
            if (currentReaction !== null) {
                // Remove old reaction
                await query(
                    'DELETE FROM question_reactions WHERE question_id = $1 AND user_id = $2',
                    [id, user.id]
                );

                // Decrement old counter
                if (currentReaction === 'like') {
                    await query(
                        'UPDATE questions SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
                        [id]
                    );
                } else {
                    await query(
                        'UPDATE questions SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = $1',
                        [id]
                    );
                }
            }

            // Add new reaction if not null
            if (reaction !== null) {
                await query(
                    'INSERT INTO question_reactions (question_id, user_id, reaction_type) VALUES ($1, $2, $3)',
                    [id, user.id, reaction]
                );

                // Increment new counter
                if (reaction === 'like') {
                    await query(
                        'UPDATE questions SET like_count = like_count + 1 WHERE id = $1',
                        [id]
                    );
                } else {
                    await query(
                        'UPDATE questions SET dislike_count = dislike_count + 1 WHERE id = $1',
                        [id]
                    );
                }
            }
        }

        // Get updated stats
        const statsResult = await query(
            'SELECT like_count, dislike_count FROM questions WHERE id = $1',
            [id]
        );

        const stats = statsResult.rows[0];

        return json({
            reaction,
            stats: {
                likes: stats.like_count,
                dislikes: stats.dislike_count
            }
        });
    } catch (err: any) {
        console.error('Error handling reaction:', err);
        if (err.status) throw err;
        throw svelteError(500, 'Failed to process reaction');
    }
};

// Get user's current reaction
export const GET: RequestHandler = async ({ params, locals }) => {
    const { id } = params;
    const user = (locals as any).user;

    if (!user) {
        return json({ reaction: null });
    }

    try {
        const result = await query(
            'SELECT reaction_type FROM question_reactions WHERE question_id = $1 AND user_id = $2',
            [id, user.id]
        );

        return json({
            reaction: result.rows[0]?.reaction_type || null
        });
    } catch (err) {
        console.error('Error fetching reaction:', err);
        return json({ reaction: null });
    }
};
