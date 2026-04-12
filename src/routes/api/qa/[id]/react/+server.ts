import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - React to a question (like/dislike)
export async function POST({ params, request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmanız gerekli' }, { status: 401 });
        }

        const questionId = params.id;
        const data = await request.json();
        const { reaction } = data; // 'like', 'dislike', or null

        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        // Check if question exists
        const checkQuestionQuery = `SELECT id FROM questions WHERE id = $1`;
        const questionResult = await query(checkQuestionQuery, [questionId]);

        if (questionResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        // Check if user already has a reaction
        const checkReactionQuery = `
            SELECT id, reaction_type FROM question_reactions 
            WHERE question_id = $1 AND user_id = $2
        `;
        const existingReaction = await query(checkReactionQuery, [questionId, user.id]);

        if (reaction === null) {
            // Remove reaction if exists
            if (existingReaction.rows.length > 0) {
                await query(`DELETE FROM question_reactions WHERE id = $1`, [existingReaction.rows[0].id]);
            }
        } else if (existingReaction.rows.length > 0) {
            // Update existing reaction
            await query(
                `UPDATE question_reactions SET reaction_type = $1 WHERE id = $2`,
                [reaction, existingReaction.rows[0].id]
            );
        } else {
            // Insert new reaction
            await query(
                `INSERT INTO question_reactions (question_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
                [questionId, user.id, reaction]
            );
        }

        // Get updated counts
        const countsQuery = `
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes
            FROM question_reactions 
            WHERE question_id = $1
        `;
        const countsResult = await query(countsQuery, [questionId]);

        return json({
            success: true,
            reaction,
            stats: {
                likes: parseInt(countsResult.rows[0].likes),
                dislikes: parseInt(countsResult.rows[0].dislikes)
            }
        });

    } catch (error) {
        console.error('Error reacting to question:', error);
        return json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
}

// GET - Get reaction stats for a question
export async function GET({ params, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const questionId = params.id;

        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        // Get counts
        const countsQuery = `
            SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes
            FROM question_reactions 
            WHERE question_id = $1
        `;
        const countsResult = await query(countsQuery, [questionId]);

        // Get user's reaction if logged in
        let userReaction = null;
        if (user) {
            const userReactionQuery = `
                SELECT reaction_type FROM question_reactions 
                WHERE question_id = $1 AND user_id = $2
            `;
            const userReactionResult = await query(userReactionQuery, [questionId, user.id]);
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
            reaction: userReaction
        });

    } catch (error) {
        console.error('Error getting question reactions:', error);
        return json({ error: 'Veri alınırken bir hata oluştu' }, { status: 500 });
    }
}
