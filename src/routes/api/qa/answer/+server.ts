import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestEvent } from './$types';

// POST - Answer a question (any logged-in user)
export async function POST({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        // Check if user is logged in
        if (!user) {
            return json({ error: 'Cevap vermek için giriş yapmalısınız' }, { status: 401 });
        }

        const data = await request.json();
        const { questionId, content, contentHtml, attachments, publishImmediately = true } = data;

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
        if (!questionId) {
            return json({ error: 'Soru ID gerekli' }, { status: 400 });
        }

        if (!content || !contentHtml) {
            return json({ error: 'Cevap içeriği gerekli' }, { status: 400 });
        }

        // Check if question exists
        const checkQuery = `
            SELECT id, status FROM questions WHERE id = $1
        `;
        const checkResult = await query(checkQuery, [questionId]);

        if (checkResult.rows.length === 0) {
            return json({ error: 'Soru bulunamadı' }, { status: 404 });
        }

        const question = checkResult.rows[0];
        if (question.status === 'rejected') {
            return json({ error: 'Reddedilmiş sorulara cevap verilemez' }, { status: 400 });
        }

        // Check if user has already answered this question (each user can answer once per question)
        const existingAnswerQuery = `
            SELECT id FROM answers WHERE question_id = $1 AND author_id = $2 LIMIT 1
        `;
        const existingAnswerResult = await query(existingAnswerQuery, [questionId, user.id]);
        
        if (existingAnswerResult.rows.length > 0) {
            return json({ error: 'Bu soruya zaten cevap verdiniz. Birden fazla cevap veremezsiniz.' }, { status: 400 });
        }

        // Create answer
        const insertAnswerQuery = `
            INSERT INTO answers (question_id, content, content_html, author_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, content, content_html, created_at
        `;

        const answerResult = await query(insertAnswerQuery, [
            questionId,
            JSON.stringify(content),
            finalContentHtml,
            user.id
        ]);

        const answerRow = answerResult.rows[0];

        // Update question status
        const newStatus = publishImmediately ? 'published' : 'answered';
        const updateQuery = `
            UPDATE questions 
            SET 
                status = $1,
                answer_id = $2,
                answered_by = $3,
                answered_at = NOW(),
                published_at = CASE WHEN $4 = true THEN NOW() ELSE published_at END,
                moderated_by = $5,
                moderated_at = NOW(),
                answer_count = answer_count + 1
            WHERE id = $6
            RETURNING id, title, status, published_at, answer_count
        `;

        const updateResult = await query(updateQuery, [
            newStatus,
            answerRow.id,
            user.id,
            publishImmediately,
            user.id,
            questionId
        ]);

        const updatedQuestion = updateResult.rows[0];
        
        // Fetch user info for the answer author
        const userQuery = `
            SELECT username, nickname, avatar_url 
            FROM users 
            WHERE id = $1
        `;
        const userResult = await query(userQuery, [user.id]);
        const userRow = userResult.rows[0];

        // Build full answer object with author info
        const fullAnswer = {
            id: answerRow.id,
            content: answerRow.content,
            contentHtml: answerRow.content_html,
            createdAt: answerRow.created_at,
            voteScore: 0,
            likeCount: 0,
            dislikeCount: 0,
            author: {
                username: userRow?.username || user.username,
                nickname: userRow?.nickname || user.nickname,
                avatar: userRow?.avatar_url || user.avatar
            }
        };

        return json({
            success: true,
            answer: fullAnswer,
            question: {
                id: updatedQuestion.id,
                title: updatedQuestion.title,
                status: updatedQuestion.status,
                publishedAt: updatedQuestion.published_at,
                answerCount: updatedQuestion.answer_count
            },
            message: publishImmediately 
                ? 'Cevap yayınlandı' 
                : 'Cevap kaydedildi, yayınlamak için soruyu onaylayın'
        });

    } catch (error) {
        console.error('Error answering question:', error);
        return json({ error: 'Cevap gönderilirken bir hata oluştu' }, { status: 500 });
    }
}

// PUT - Update an answer (owner or moderators)
export async function PUT({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;
        
        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        const data = await request.json();
        const { answerId, content, contentHtml } = data;

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        if (!content || !contentHtml) {
            return json({ error: 'Cevap içeriği gerekli' }, { status: 400 });
        }

        // Check if answer exists and get author info (fallback to question.answered_by if author_id is null)
        const checkQuery = `
            SELECT a.id, COALESCE(a.author_id, q.answered_by) as author_id 
            FROM answers a
            JOIN questions q ON q.answer_id = a.id
            WHERE a.id = $1
        `;
        const checkResult = await query(checkQuery, [answerId]);

        if (checkResult.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        const answer = checkResult.rows[0];
        
        // Only owner or moderator/admin can edit
        if (String(answer.author_id) !== String(user.id) && 
            user.role !== 'moderator' && 
            user.role !== 'admin') {
            return json({ error: 'Bu cevabı düzenleme yetkiniz yok' }, { status: 403 });
        }

        // Update answer
        const updateQuery = `
            UPDATE answers 
            SET content = $1, content_html = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, content, content_html, updated_at
        `;

        const result = await query(updateQuery, [
            JSON.stringify(content),
            contentHtml,
            answerId
        ]);

        const updatedAnswerRow = result.rows[0];
        
        // Fetch user info for the answer author
        const userQuery = `
            SELECT username, nickname, avatar_url 
            FROM users 
            WHERE id = $1
        `;
        const userResult = await query(userQuery, [user.id]);
        const userRow = userResult.rows[0];

        // Build full answer object with author info
        const fullAnswer = {
            id: updatedAnswerRow.id,
            content: updatedAnswerRow.content,
            contentHtml: updatedAnswerRow.content_html,
            updatedAt: updatedAnswerRow.updated_at,
            voteScore: 0,
            likeCount: 0,
            dislikeCount: 0,
            author: {
                username: userRow?.username || user.username,
                nickname: userRow?.nickname || user.nickname,
                avatar: userRow?.avatar_url || user.avatar
            }
        };

        return json({
            success: true,
            answer: fullAnswer,
            message: 'Cevap güncellendi'
        });

    } catch (error) {
        console.error('Error updating answer:', error);
        return json({ error: 'Cevap güncellenirken bir hata oluştu' }, { status: 500 });
    }
}

// DELETE - Delete an answer (owner or moderators)
export async function DELETE({ request, locals }: RequestEvent) {
    try {
        const user = (locals as any)?.user;

        if (!user) {
            return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const answerId = searchParams.get('answerId');

        if (!answerId) {
            return json({ error: 'Cevap ID gerekli' }, { status: 400 });
        }

        // Get answer info before deleting (with author fallback)
        const getAnswerQuery = `
            SELECT a.id, a.question_id, q.accepted_answer_id, COALESCE(a.author_id, q.answered_by) as author_id
            FROM answers a
            JOIN questions q ON q.id = a.question_id
            WHERE a.id = $1
        `;
        const answerResult = await query(getAnswerQuery, [answerId]);

        if (answerResult.rows.length === 0) {
            return json({ error: 'Cevap bulunamadı' }, { status: 404 });
        }

        const answer = answerResult.rows[0];

        // Only owner or moderator/admin can delete
        if (String(answer.author_id) !== String(user.id) && 
            user.role !== 'moderator' && 
            user.role !== 'admin') {
            return json({ error: 'Bu cevabı silme yetkiniz yok' }, { status: 403 });
        }

        // Delete answer
        const deleteQuery = `DELETE FROM answers WHERE id = $1`;
        await query(deleteQuery, [answerId]);

        // If this was the accepted answer, clear it
        if (answer.accepted_answer_id === answerId) {
            const updateQuestionQuery = `
                UPDATE questions
                SET accepted_answer_id = NULL
                WHERE id = $1
            `;
            await query(updateQuestionQuery, [answer.question_id]);
        }

        return json({
            success: true,
            message: 'Cevap silindi'
        });

    } catch (error) {
        console.error('Error deleting answer:', error);
        return json({ error: 'Cevap silinirken bir hata oluştu' }, { status: 500 });
    }
}
