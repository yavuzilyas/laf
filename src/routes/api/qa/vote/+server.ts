import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Vote on question or answer
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        const data = await request.json();
        const { targetType, targetId, voteType } = data;

        if (!targetType || !targetId || !voteType) {
            return json({ error: 'Eksik parametreler' }, { status: 400 });
        }

        if (!['question', 'answer'].includes(targetType)) {
            return json({ error: 'Geçersiz hedef tipi' }, { status: 400 });
        }

        if (![1, -1].includes(voteType)) {
            return json({ error: 'Oy tipi 1 (upvote) veya -1 (downvote) olmalı' }, { status: 400 });
        }

        const tableName = targetType === 'question' ? 'question_votes' : 'answer_votes';
        const idColumn = targetType === 'question' ? 'question_id' : 'answer_id';

        // Check if user already voted
        const checkQuery = `SELECT id, vote_type FROM ${tableName} WHERE ${idColumn} = $1 AND user_id = $2`;
        const checkResult = await query(checkQuery, [targetId, user.id]);

        if (checkResult.rows.length > 0) {
            const existingVote = checkResult.rows[0];
            
            if (existingVote.vote_type === voteType) {
                // Remove vote (toggle off)
                await query(`DELETE FROM ${tableName} WHERE id = $1`, [existingVote.id]);
                return json({ success: true, action: 'removed', message: 'Oy kaldırıldı' });
            } else {
                // Change vote
                await query(
                    `UPDATE ${tableName} SET vote_type = $1 WHERE id = $2`,
                    [voteType, existingVote.id]
                );
                return json({ success: true, action: 'changed', voteType, message: voteType === 1 ? 'Upvote yapıldı' : 'Downvote yapıldı' });
            }
        } else {
            // New vote
            await query(
                `INSERT INTO ${tableName} (${idColumn}, user_id, vote_type) VALUES ($1, $2, $3)`,
                [targetId, user.id, voteType]
            );
            return json({ success: true, action: 'added', voteType, message: voteType === 1 ? 'Upvote yapıldı' : 'Downvote yapıldı' });
        }

    } catch (error) {
        console.error('Error voting:', error);
        return json({ error: 'Oy verilirken hata oluştu' }, { status: 500 });
    }
}

// GET - Get vote status for current user
export async function GET({ url, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ votes: {} });
        }

        const targetType = url.searchParams.get('type');
        const targetId = url.searchParams.get('id');

        if (targetType && targetId) {
            // Single vote check
            const tableName = targetType === 'question' ? 'question_votes' : 'answer_votes';
            const idColumn = targetType === 'question' ? 'question_id' : 'answer_id';
            
            const result = await query(
                `SELECT vote_type FROM ${tableName} WHERE ${idColumn} = $1 AND user_id = $2`,
                [targetId, user.id]
            );
            
            return json({ 
                voteType: result.rows[0]?.vote_type || 0 
            });
        } else {
            // Get all user votes
            const [questionVotes, answerVotes] = await Promise.all([
                query('SELECT question_id, vote_type FROM question_votes WHERE user_id = $1', [user.id]),
                query('SELECT answer_id, vote_type FROM answer_votes WHERE user_id = $1', [user.id])
            ]);

            const votes: Record<string, number> = {};
            questionVotes.rows.forEach((row: any) => {
                votes[`q_${row.question_id}`] = row.vote_type;
            });
            answerVotes.rows.forEach((row: any) => {
                votes[`a_${row.answer_id}`] = row.vote_type;
            });

            return json({ votes });
        }

    } catch (error) {
        console.error('Error getting votes:', error);
        return json({ error: 'Oylar alınırken hata oluştu' }, { status: 500 });
    }
}
