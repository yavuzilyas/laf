import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { query } from '$db/pg';

export const load: PageServerLoad = async ({ locals, url }) => {
    const user = (locals as any)?.user;
    const isModerator = user?.role === 'moderator' || user?.role === 'admin';

    try {
        // Get topics
        const topicsResult = await query(`
            SELECT id, name, slug, description, display_order
            FROM question_topics
            WHERE is_active = true
            ORDER BY display_order ASC, name ASC
        `);

        const topics = topicsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            displayOrder: row.display_order
        }));

        // Get questions (published for all users, all statuses for moderators/admins)
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = isModerator ? 100 : 10; // More items for moderators
        const offset = (page - 1) * limit;
        const selectedTopic = url.searchParams.get('topic');

        // Get sort parameter
        const sortBy = url.searchParams.get('sort') || 'newest';
        let orderBy = isModerator ? 'q.created_at DESC' : 'q.published_at DESC';
        if (sortBy === 'popular') {
            orderBy = 'q.like_count DESC, q.view_count DESC';
        } else if (sortBy === 'unanswered') {
            orderBy = 'q.created_at DESC'; // En yeni cevapsız sorular
        }
        // Build filter conditions
        let filterConditions: string[] = [];
        
        // For moderators, show all questions; for others only published
        if (!isModerator) {
            filterConditions.push("q.status = 'published'");
        }
        
        // Unanswered filter - only show questions with no answers
        if (sortBy === 'unanswered') {
            filterConditions.push('q.answer_count = 0');
        }
        
        const statusFilter = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

        let questionsQuery = `
            SELECT 
                q.id,
                q.slug,
                q.title,
                q.content,
                q.content_html,
                q.status,
                q.is_anonymous,
                q.author_name,
                q.created_at,
                q.published_at,
                q.vote_score,
                q.view_count,
                q.answer_count,
                q.accepted_answer_id,
                q.follow_count,
                q.like_count,
                q.dislike_count,
                t.id as topic_id,
                t.name as topic_name,
                t.slug as topic_slug,
                u.username as author_username,
                u.nickname as author_nickname,
                u.avatar_url as author_avatar,
                u.id as author_user_id,
                a.id as answer_id,
                a.content as answer_content,
                a.content_html as answer_content_html,
                a.created_at as answer_created_at,
                a.vote_score as answer_vote_score,
                COALESCE(a.author_id, q.answered_by) as answer_author_id,
                au.username as answer_author_username,
                au.nickname as answer_author_nickname,
                au.avatar_url as answer_author_avatar
            FROM questions q
            LEFT JOIN question_topics t ON q.topic_id = t.id
            LEFT JOIN users u ON q.author_id = u.id
            LEFT JOIN answers a ON q.answer_id = a.id
            LEFT JOIN users au ON au.id = COALESCE(a.author_id, q.answered_by)
            ${statusFilter}
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (selectedTopic) {
            questionsQuery += statusFilter ? ` AND t.slug = $${paramIndex}` : ` WHERE t.slug = $${paramIndex}`;
            params.push(selectedTopic);
            paramIndex++;
        }

        questionsQuery += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const questionsResult = await query(questionsQuery, params);

        const questions = questionsResult.rows.map(row => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            content: row.content,
            contentHtml: row.content_html,
            status: row.status,
            isAnonymous: row.is_anonymous,
            authorName: row.is_anonymous ? null : (row.author_name || row.author_nickname || row.author_username),
            createdAt: row.created_at,
            publishedAt: row.published_at,
            voteScore: row.vote_score || 0,
            viewCount: row.view_count || 0,
            answerCount: row.answer_count || 0,
            followCount: row.follow_count || 0,
            likeCount: row.like_count || 0,
            dislikeCount: row.dislike_count || 0,
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
            },
            answer: row.answer_id ? {
                id: row.answer_id,
                content: row.answer_content,
                contentHtml: row.answer_content_html,
                createdAt: row.answer_created_at,
                voteScore: row.answer_vote_score || 0,
                author: {
                    id: row.answer_author_id,
                    username: row.answer_author_username,
                    nickname: row.answer_author_nickname,
                    avatar: row.answer_author_avatar
                }
            } : null
        }));

        // Count for pagination
        let countQuery = isModerator
            ? `SELECT COUNT(*) as total FROM questions q LEFT JOIN question_topics t ON q.topic_id = t.id ${selectedTopic ? 'WHERE t.slug = $1' : ''}`
            : `SELECT COUNT(*) as total FROM questions q LEFT JOIN question_topics t ON q.topic_id = t.id WHERE q.status = 'published' ${selectedTopic ? 'AND t.slug = $1' : ''}`;
        
        // Add unanswered filter to count query if needed
        if (sortBy === 'unanswered') {
            countQuery += (selectedTopic || !isModerator) ? ' AND q.answer_count = 0' : ' WHERE q.answer_count = 0';
        }

        const countParams = selectedTopic ? [selectedTopic] : [];
        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0]?.total || '0');

        return {
            topics,
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            isModerator,
            user: user ? {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                role: user.role
            } : null
        };

    } catch (err) {
        console.error('Error loading Q&A page:', err);
        throw error(500, 'Sayfa yüklenirken bir hata oluştu');
    }
};
