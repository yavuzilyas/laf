import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - React to an answer (like/dislike)
export async function POST({ params, request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmanız gerekli' }, { status: 401 });
        }

        const answerId = params.id;
        const data = await request.json();
        const { reaction } = data; // 'like', 'dislike', or null

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        // Check if answer exists
        const checkAnswerQuery = `SELECT id FROM answers WHERE id = $1`;
        const answerResult = await query(checkAnswerQuery, [answerId]);

        if (answerResult.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        // Check if user already has a reaction
        const checkReactionQuery = `
            SELECT id, reaction_type FROM answer_reactions 
            WHERE answer_id = $1 AND user_id = $2
        `;
        const existingReaction = await query(checkReactionQuery, [answerId, user.id]);

        if (reaction === null) {
            // Remove reaction if exists
            if (existingReaction.rows.length > 0) {
                await query(`DELETE FROM answer_reactions WHERE id = $1`, [existingReaction.rows[0].id]);
            }
        } else if (existingReaction.rows.length > 0) {
            // Update existing reaction
            await query(
                `UPDATE answer_reactions SET reaction_type = $1 WHERE id = $2`,
                [reaction, existingReaction.rows[0].id]
            );
        } else {
            // Insert new reaction
            await query(
                `INSERT INTO answer_reactions (answer_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
                [answerId, user.id, reaction]
            );
        }

        // Get updated counts
        const countsQuery = `
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes
            FROM answer_reactions 
            WHERE answer_id = $1
        `;
        const countsResult = await query(countsQuery, [answerId]);

        return json({
            success: true,
            reaction,
            stats: {
                likes: parseInt(countsResult.rows[0].likes),
                dislikes: parseInt(countsResult.rows[0].dislikes)
            }
        });

    } catch (error) {
        console.error('Error reacting to answer:', error);
        return json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
}

// GET - Get reaction stats for an answer
export async function GET({ params, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const answerId = params.id;

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        // Get counts
        const countsQuery = `
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes
            FROM answer_reactions 
            WHERE answer_id = $1
        `;
        const countsResult = await query(countsQuery, [answerId]);

        // Get user's reaction if logged in
        let userReaction = null;
        if (user) {
            const userReactionQuery = `
                SELECT reaction_type FROM answer_reactions 
                WHERE answer_id = $1 AND user_id = $2
            `;
            const userReactionResult = await query(userReactionQuery, [answerId, user.id]);
            if (userReactionResult.rows.length > 0) {
                userReaction = userReactionResult.rows[0].reaction_type;
            }
        }

        return json({
            success: true,
            stats: {
                likes: parseInt(countsResult.rows[0].likes),
                dislikes: parseInt(countsResult.rows[0].dislikes)
            },
            userReaction
        });

    } catch (error) {
        console.error('Error getting answer reactions:', error);
        return json({ error: 'Veri alınırken bir hata oluştu' }, { status: 500 });
    }
}
