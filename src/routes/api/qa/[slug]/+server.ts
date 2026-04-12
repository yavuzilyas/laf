import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// GET - Get single question by slug
export async function GET({ params, locals }: RequestEvent) {
    try {
        const { slug } = params;
        const user = (locals as any)?.user;
        const isModerator = user?.role === 'moderator' || user?.role === 'admin';

        // Query to get question
        const questionQuery = `
            SELECT 
                q.id,
                q.title,
                q.slug,
                q.content,
                q.content_html,
                q.status,
                q.is_anonymous,
                q.author_name,
                q.author_email,
                q.created_at,
                q.published_at,
                q.answered_at,
                q.moderation_note,
                q.vote_score,
                q.like_count,
                q.dislike_count,
                q.view_count,
                q.answer_count,
                q.accepted_answer_id,
                q.follow_count,
                t.id as topic_id,
                t.name as topic_name,
                t.slug as topic_slug,
                u.id as author_user_id,
                u.username as author_username,
                u.nickname as author_nickname,
                u.avatar_url as author_avatar
            FROM questions q
            LEFT JOIN question_topics t ON q.topic_id = t.id
            LEFT JOIN users u ON q.author_id = u.id
            WHERE q.slug = $1
        `;

        const questionResult = await query(questionQuery, [slug]);

        if (questionResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const row = questionResult.rows[0];

        // Check access permissions for non-moderators
        if (!isModerator) {
            if (row.status !== 'published') {
                return json({ error: 'Bu soru henüz yayınlanmamış' }, { status: 403 });
            }
        }

        // Transform question
        const question = {
            id: row.id,
            title: row.title,
            slug: row.slug,
            content: row.content,
            contentHtml: row.content_html,
            status: row.status,
            isAnonymous: row.is_anonymous,
            authorName: row.is_anonymous ? null : (row.author_name || row.author_username || row.author_nickname),
            authorEmail: row.is_anonymous ? null : row.author_email,
            createdAt: row.created_at,
            publishedAt: row.published_at,
            answeredAt: row.answered_at,
            moderationNote: isModerator ? row.moderation_note : null,
            voteScore: row.vote_score || 0,
            likeCount: row.like_count || 0,
            dislikeCount: row.dislike_count || 0,
            viewCount: row.view_count || 0,
            answerCount: row.answer_count || 0,
            followCount: row.follow_count || 0,
            acceptedAnswerId: row.accepted_answer_id,
            topic: row.topic_id ? {
                id: row.topic_id,
                name: row.topic_name,
                slug: row.topic_slug
            } : null,
            author: row.is_anonymous ? null : {
                id: row.author_user_id,
                username: row.author_username,
                nickname: row.author_nickname,
                avatar: row.author_avatar
            }
        };

        // Get ALL answers for this question
        const answersQuery = `
            SELECT 
                a.id,
                a.content,
                a.content_html,
                a.created_at,
                a.vote_score,
                a.is_accepted,
                u.username,
                u.nickname,
                u.avatar_url
            FROM answers a
            LEFT JOIN users u ON a.author_id = u.id
            WHERE a.question_id = $1
            ORDER BY a.is_accepted DESC, a.vote_score DESC, a.created_at ASC
        `;

        const answersResult = await query(answersQuery, [question.id]);

        const answers = answersResult.rows.map(a => ({
            id: a.id,
            content: a.content,
            contentHtml: a.content_html,
            createdAt: a.created_at,
            voteScore: a.vote_score || 0,
            isAccepted: a.is_accepted,
            author: {
                username: a.username,
                nickname: a.nickname,
                avatar: a.avatar_url
            }
        }));

        // Get user's reaction on this question if logged in
        let userReaction: 'like' | 'dislike' | null = null;
        if (user) {
            const reactionResult = await query(
                'SELECT reaction_type FROM question_reactions WHERE question_id = $1 AND user_id = $2',
                [question.id, user.id]
            );
            if (reactionResult.rows.length > 0) {
                userReaction = reactionResult.rows[0].reaction_type;
            }
        }

        return json({
            question,
            answers,
            userReaction,
            isModerator
        });

    } catch (error) {
        console.error('Error fetching question:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Track question view
export async function POST({ params, locals, cookies }: RequestEvent) {
    try {
        const { slug } = params;
        const user = (locals as any)?.user;

        // Get question ID from slug
        const questionResult = await query(
            'SELECT id FROM questions WHERE slug = $1',
            [slug]
        );

        if (questionResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const questionId = questionResult.rows[0].id;

        // Increment views only if user hasn't viewed this question recently (track via cookie)
        const viewedQuestionsKey = 'viewed_questions';
        const viewedQuestions = cookies.get(viewedQuestionsKey);
        const viewedSet = new Set(viewedQuestions ? JSON.parse(viewedQuestions) : []);

        let newViewCount: number;

        if (!viewedSet.has(questionId)) {
            // Increment view count
            await query(
                'UPDATE questions SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
                [questionId]
            );
            viewedSet.add(questionId);
            cookies.set(viewedQuestionsKey, JSON.stringify([...viewedSet]), {
                path: '/',
                maxAge: 60 * 10, // 10 minutes
                httpOnly: true,
                sameSite: 'strict'
            });
        }

        // Get updated view count
        const result = await query(
            'SELECT view_count FROM questions WHERE id = $1',
            [questionId]
        );
        newViewCount = result.rows[0].view_count;

        return json({
            success: true,
            viewCount: newViewCount
        });

    } catch (error) {
        console.error('Error tracking view:', error);
        return json({ error: 'Failed to track view' }, { status: 500 });
    }
}
