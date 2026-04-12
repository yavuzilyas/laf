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

        const updatedQuestion = result.rows[0];

        return json({
            success: true,
            question: {
                id: updatedQuestion.id,
                title: updatedQuestion.title,
                slug: updatedQuestion.slug,
                status: updatedQuestion.status,
                createdAt: updatedQuestion.created_at,
                updatedAt: updatedQuestion.updated_at
            },
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
