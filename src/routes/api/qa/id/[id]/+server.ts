import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { query } from '$db/pg';

// PUT - Update an existing question (owner only)
export async function PUT({ request, params, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const { id } = params;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        // Check if question exists and user is the owner
        const questionCheck = await query(
            'SELECT id, author_id FROM questions WHERE id = $1',
            [id]
        );

        if (questionCheck.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const question = questionCheck.rows[0];
        
        // Only owner or moderator/admin can edit
        if (String(question.author_id) !== String(user.id) && 
            user.role !== 'moderator' && 
            user.role !== 'admin') {
            return json({ error: 'Bu soruyu düzenleme yetkiniz yok' }, { status: 403 });
        }

        const data = await request.json();
        const {
            title,
            content,
            contentHtml,
            attachments,
            topicId,
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

        // Update question
        const updateQuery = `
            UPDATE questions 
            SET title = $1, 
                content = $2, 
                content_html = $3, 
                topic_id = $4,
                is_anonymous = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, title, slug, status, created_at, updated_at
        `;

        const result = await query(updateQuery, [
            title.trim(),
            JSON.stringify(content),
            finalContentHtml,
            topicId || null,
            isAnonymous || false,
            id
        ]);

        const updatedQuestionRow = result.rows[0];
        
        // Fetch full question data with author and topic info
        const fullQuestionQuery = `
            SELECT 
                q.id, q.title, q.slug, q.content, q.content_html, q.status, q.is_anonymous,
                q.author_name, q.author_email, q.created_at, q.published_at, q.answered_at,
                q.vote_score, q.view_count, q.answer_count, q.accepted_answer_id, q.follow_count,
                q.like_count, q.dislike_count,
                t.id as topic_id, t.name as topic_name, t.slug as topic_slug,
                u.id as author_user_id, u.username as author_username, 
                u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM questions q
            LEFT JOIN question_topics t ON q.topic_id = t.id
            LEFT JOIN users u ON q.author_id = u.id
            WHERE q.id = $1
        `;
        const fullResult = await query(fullQuestionQuery, [id]);
        const row = fullResult.rows[0];
        
        // Build full question object
        const fullQuestion = {
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
            voteScore: row.vote_score || 0,
            viewCount: row.view_count || 0,
            answerCount: row.answer_count || 0,
            likeCount: row.like_count || 0,
            dislikeCount: row.dislike_count || 0,
            acceptedAnswerId: row.accepted_answer_id,
            followCount: row.follow_count || 0,
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
            answers: [], // Will be refetched on page refresh
            hasUserAnswered: false
        };

        return json({
            success: true,
            question: fullQuestion,
            message: 'Soru güncellendi'
        });

    } catch (err) {
        console.error('Error updating question:', err);
        return json({ error: 'Soru güncellenirken bir hata oluştu' }, { status: 500 });
    }
}

// DELETE - Delete a question (owner or moderator only)
export async function DELETE({ params, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        const { id } = params;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        // Check if question exists and user is the owner or moderator
        const questionCheck = await query(
            'SELECT id, author_id FROM questions WHERE id = $1',
            [id]
        );

        if (questionCheck.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const question = questionCheck.rows[0];
        
        // Only owner or moderator/admin can delete
        if (String(question.author_id) !== String(user.id) && 
            user.role !== 'moderator' && 
            user.role !== 'admin') {
            return json({ error: 'Bu soruyu silme yetkiniz yok' }, { status: 403 });
        }

        // Delete question (answers will be cascade deleted if foreign key is set up)
        await query('DELETE FROM questions WHERE id = $1', [id]);

        return json({
            success: true,
            message: 'Soru silindi'
        });

    } catch (err) {
        console.error('Error deleting question:', err);
        return json({ error: 'Soru silinirken bir hata oluştu' }, { status: 500 });
    }
}
