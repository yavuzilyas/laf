import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    updateContactMessageStatus,
    respondToContactMessage,
    deleteContactMessage,
    getContactMessageById
} from '$db/queries';
import { notifyContactMessageStatus } from '$lib/server/notifications-pg';

// PATCH /api/contact-messages/[id] - Update message status (moderators/admins only)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    const user = (locals as any)?.user;
    const messageId = params.id;

    // Check if user is moderator or admin
    if (!user || !['admin', 'moderator'].includes(user.role?.toLowerCase())) {
        return json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const data = await request.json();
        const { status, response } = data;

        // Validate message exists
        const existingMessage = await getContactMessageById(messageId);
        if (!existingMessage) {
            return json({ error: 'Mesaj bulunamadı' }, { status: 404 });
        }

        // If response is provided, use respondToContactMessage
        if (response !== undefined) {
            if (!response.trim()) {
                return json({ error: 'Yanıt boş olamaz' }, { status: 400 });
            }

            const updatedMessage = await respondToContactMessage(
                messageId,
                response.trim(),
                user.id
            );

            // Send notification to user
            await notifyContactMessageStatus({
                messageId,
                userId: existingMessage.user_id,
                newStatus: 'responded',
                response: response.trim(),
                moderatorId: user.id,
                subject: existingMessage.subject
            });

            return json({
                success: true,
                message: 'Yanıt gönderildi',
                contactMessage: updatedMessage
            });
        }

        // Otherwise just update status
        if (status && ['pending', 'read', 'responded', 'archived'].includes(status)) {
            const updatedMessage = await updateContactMessageStatus(
                messageId,
                status,
                user.id
            );

            // Send notification to user for read and archived statuses
            if (status === 'read' || status === 'archived') {
                await notifyContactMessageStatus({
                    messageId,
                    userId: existingMessage.user_id,
                    newStatus: status,
                    moderatorId: user.id,
                    subject: existingMessage.subject
                });
            }

            return json({
                success: true,
                message: 'Durum güncellendi',
                contactMessage: updatedMessage
            });
        }

        return json({ error: 'Geçersiz işlem' }, { status: 400 });

    } catch (error) {
        console.error('Update contact message error:', error);
        return json({ error: 'Güncelleme başarısız' }, { status: 500 });
    }
};

// DELETE /api/contact-messages/[id] - Delete message (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
    const user = (locals as any)?.user;
    const messageId = params.id;

    // Check if user is admin
    if (!user || user.role?.toLowerCase() !== 'admin') {
        return json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        // Validate message exists
        const existingMessage = await getContactMessageById(messageId);
        if (!existingMessage) {
            return json({ error: 'Mesaj bulunamadı' }, { status: 404 });
        }

        await deleteContactMessage(messageId);

        return json({
            success: true,
            message: 'Mesaj silindi'
        });

    } catch (error) {
        console.error('Delete contact message error:', error);
        return json({ error: 'Silme başarısız' }, { status: 500 });
    }
};
