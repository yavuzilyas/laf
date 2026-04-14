import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// GET - List questions (public only see published, moderators see all)
export async function GET({ url, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const isModerator = user?.role === 'moderator' || user?.role === 'admin';

        // Query parameters
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const topic = url.searchParams.get('topic');
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const showPending = url.searchParams.get('showPending') === 'true';

        // Build base query
        let whereClause = '';
        const params: any[] = [];
        let paramIndex = 1;

        // Non-moderators can only see published questions
        if (!isModerator) {
            whereClause = 'WHERE q.status = $1';
            params.push('published');
            paramIndex++;
        } else if (status) {
            // Moderators can filter by status
            whereClause = 'WHERE q.status = $1';
            params.push(status);
            paramIndex++;
        } else if (showPending) {
            // Show pending questions for moderators
            whereClause = 'WHERE q.status IN ($1, $2)';
            params.push('pending', 'answered');
            paramIndex += 2;
        }

        // Topic filter
        if (topic) {
            whereClause = whereClause ? `${whereClause} AND q.topic_id = $${paramIndex}` : `WHERE q.topic_id = $${paramIndex}`;
            params.push(topic);
            paramIndex++;
        }

        // Search filter
        if (search) {
            whereClause = whereClause 
                ? `${whereClause} AND (q.title ILIKE $${paramIndex} OR q.content_html ILIKE $${paramIndex})`
                : `WHERE (q.title ILIKE $${paramIndex} OR q.content_html ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get sort parameter
        const sortBy = url.searchParams.get('sort') || 'newest';
        let orderBy = 'q.created_at DESC';
        
        // Unanswered filter logic - needs to be before count query
        if (sortBy === 'unanswered') {
            whereClause = whereClause ? `${whereClause} AND q.answer_count = 0` : `WHERE q.answer_count = 0`;
        }

        // Count query for pagination (now with correct whereClause for unanswered)
        const countQuery = `SELECT COUNT(*) as total FROM questions q ${whereClause}`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0]?.total || '0');

        // Main query with pagination
        const offset = (page - 1) * limit;
        
        if (sortBy === 'popular') {
            orderBy = 'q.like_count DESC, q.view_count DESC, q.created_at DESC';
        } else if (sortBy === 'unanswered') {
            orderBy = 'q.created_at DESC';
        }
        
        // First get questions
        const mainQuery = `
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
                q.view_count,
                q.answer_count,
                q.accepted_answer_id,
                q.follow_count,
                q.like_count,
                q.dislike_count,
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
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const result = await query(mainQuery, params);
        const questionIds = result.rows.map(r => r.id);

        // Fetch all answers for these questions
        let answersMap: Record<string, any[]> = {};
        let userAnswerMap: Record<string, string[]> = {}; // questionId -> [answerIds]
        
        if (questionIds.length > 0) {
            const answersQuery = `
                SELECT 
                    a.id,
                    a.question_id,
                    a.content,
                    a.content_html,
                    a.created_at,
                    a.vote_score,
                    a.like_count,
                    a.dislike_count,
                    a.author_id,
                    u.username,
                    u.nickname,
                    u.avatar_url
                FROM answers a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.question_id = ANY($1)
                ORDER BY a.created_at ASC
            `;
            const answersResult = await query(answersQuery, [questionIds]);
            
            // Group answers by question_id
            answersResult.rows.forEach(a => {
                if (!answersMap[a.question_id]) {
                    answersMap[a.question_id] = [];
                }
                answersMap[a.question_id].push(a);
                
                // Track which answers belong to current user
                if (user && a.author_id === user.id) {
                    if (!userAnswerMap[a.question_id]) {
                        userAnswerMap[a.question_id] = [];
                    }
                    userAnswerMap[a.question_id].push(a.id);
                }
            });
        }

        // Transform for response
        const questions = result.rows.map(row => ({
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
            answers: (answersMap[row.id] || []).map(a => ({
                id: a.id,
                content: a.content,
                contentHtml: a.content_html,
                createdAt: a.created_at,
                voteScore: a.vote_score || 0,
                likeCount: a.like_count || 0,
                dislikeCount: a.dislike_count || 0,
                author: {
                    username: a.username,
                    nickname: a.nickname,
                    avatar: a.avatar_url
                }
            })),
            userAnswerIds: userAnswerMap[row.id] || [], // IDs of answers by current user
            hasUserAnswered: (userAnswerMap[row.id] || []).length > 0
        }));

        return json({
            questions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            isModerator
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new question (anyone can ask)
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const data = await request.json();

        const {
            title,
            content,
            contentHtml,
            attachments,
            topicId,
            authorName,
            authorEmail,
            isAnonymous
        } = data;

        // Process attachments - append to contentHtml as <img> tags
        let finalContentHtml = contentHtml || '';
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            const attachmentHtml = attachments
                .filter((url: string) => url && url.startsWith('data:image/'))
                .map((url: string) => `<br><img src="${url}" style="max-width:100%;height:auto;" /><br>`)
                .join('');
            finalContentHtml += attachmentHtml;
        }

        // Validation
        if (!title || title.trim().length < 5) {
            return json({ error: 'Başlık en az 5 karakter olmalıdır' }, { status: 400 });
        }

        if (!content || !contentHtml) {
            return json({ error: 'Soru içeriği gerekli' }, { status: 400 });
        }

        // For non-logged users, require name and email
        if (!user && (!authorName || !authorEmail)) {
            return json({ error: 'İsim ve email gerekli' }, { status: 400 });
        }

        // Email validation
        if (!user && authorEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(authorEmail)) {
                return json({ error: 'Geçerli bir email adresi girin' }, { status: 400 });
            }
        }

        // Generate unique slug from title
        const slugResult = await query(
            'SELECT generate_question_slug($1) as slug',
            [title.trim()]
        );
        const slug = slugResult.rows[0].slug;

        // Insert question
        const insertQuery = `
            INSERT INTO questions (
                title, slug, content, content_html, topic_id, 
                author_id, author_name, author_email, is_anonymous, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, title, slug, status, created_at
        `;

        const result = await query(insertQuery, [
            title.trim(),
            slug,
            JSON.stringify(content),
            finalContentHtml,
            topicId || null,
            user?.id || null,
            isAnonymous ? null : (user?.username || authorName || null),
            isAnonymous ? null : (user?.email || authorEmail || null),
            isAnonymous || !user,
            'published' // Questions published immediately
        ]);

        const question = result.rows[0];

        return json({
            success: true,
            question: {
                id: question.id,
                title: question.title,
                slug: question.slug,
                status: question.status,
                createdAt: question.created_at
            },
            message: 'Sorunuz yayınlandı!'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating question:', error);
        return json({ error: 'Soru gönderilirken bir hata oluştu' }, { status: 500 });
    }
}
