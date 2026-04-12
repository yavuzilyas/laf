import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    getContactMessages,
    getContactMessagesCount,
    createContactMessage,
    updateContactMessageStatus,
    respondToContactMessage,
    deleteContactMessage,
    getContactMessageById,
    getUsers
} from '$db/queries';

// GET /api/contact-messages - Fetch contact messages (moderators/admins only)
export const GET: RequestHandler = async ({ url, locals }) => {
    const user = (locals as any)?.user;

    // Check if user is moderator or admin
    if (!user || !['admin', 'moderator'].includes(user.role?.toLowerCase())) {
        return json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const status = url.searchParams.get('status') as any;
        const subject = url.searchParams.get('subject') || undefined;

        const filters: any = { limit, offset };
        if (status && ['pending', 'read', 'responded', 'archived'].includes(status)) {
            filters.status = status;
        }
        if (subject) {
            filters.subject = subject;
        }

        const [messages, total] = await Promise.all([
            getContactMessages(filters),
            getContactMessagesCount(filters)
        ]);

        // Get unique reviewer and responder IDs
        const reviewerIds = Array.from(
            new Set(
                messages
                    .map((m: any) => m.reviewed_by)
                    .filter((id: any): id is string => Boolean(id))
            )
        );

        const responderIds = Array.from(
            new Set(
                messages
                    .map((m: any) => m.responded_by)
                    .filter((id: any): id is string => Boolean(id))
            )
        );

        // Fetch reviewer and responder info
        const usersMap = new Map<
            string,
            { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null }
        >();

        const allUserIds = [...new Set([...reviewerIds, ...responderIds])];
        if (allUserIds.length > 0) {
            for (const userId of allUserIds) {
                const userData = await getUsers({ id: userId });
                const userInfo = userData[0];
                if (userInfo) {
                    usersMap.set(userInfo.id, {
                        id: userInfo.id,
                        username: userInfo.username || null,
                        nickname: userInfo.nickname || null,
                        name: userInfo.name || null,
                        surname: userInfo.surname || null,
                        role: userInfo.role || null
                    });
                }
            }
        }

        // Transform messages with reviewedBy and respondedBy objects
        const formattedMessages = messages.map((message: any) => {
            const reviewer = message.reviewed_by ? usersMap.get(message.reviewed_by) : null;
            const responder = message.responded_by ? usersMap.get(message.responded_by) : null;

            return {
                ...message,
                updatedAt: message.updated_at ?? null,
                reviewedBy: reviewer ? {
                    id: reviewer.id,
                    username: reviewer.username,
                    nickname: reviewer.nickname,
                    name: reviewer.name,
                    surname: reviewer.surname,
                    role: reviewer.role
                } : null,
                respondedBy: responder ? {
                    id: responder.id,
                    username: responder.username,
                    nickname: responder.nickname,
                    name: responder.name,
                    surname: responder.surname,
                    role: responder.role
                } : null
            };
        });

        return json({
            messages: formattedMessages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        return json({ error: 'Mesajlar yüklenemedi' }, { status: 500 });
    }
};

// POST /api/contact-messages - Create new contact message (authenticated users)
export const POST: RequestHandler = async ({ request, locals }) => {
    const user = (locals as any)?.user;

    // Check authentication
    if (!user) {
        return json({ error: 'Bu işlem için giriş yapmalısınız' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { name, subject, message, honeypot } = data;

        // Honeypot check - if filled, it's likely a bot
        if (honeypot && honeypot.trim() !== '') {
            // Silently reject but return success to not alert bots
            return json({
                success: true,
                message: 'Mesajınız alındı'
            });
        }

        // Validate required fields
        if (!name?.trim() || !subject?.trim() || !message?.trim()) {
            return json({ error: 'Lütfen tüm alanları doldurun' }, { status: 400 });
        }

        // Validate field lengths
        if (name.trim().length > 100) {
            return json({ error: 'İsim çok uzun (max 100 karakter)' }, { status: 400 });
        }

        if (message.trim().length > 2000) {
            return json({ error: 'Mesaj çok uzun (max 2000 karakter)' }, { status: 400 });
        }

        // Validate subject is one of allowed values
        const allowedSubjects = ['general', 'feedback', 'collaboration', 'report', 'other'];
        if (!allowedSubjects.includes(subject)) {
            return json({ error: 'Geçersiz konu' }, { status: 400 });
        }

        // Create the contact message
        const contactMessage = await createContactMessage({
            userId: user.id,
            name: name.trim(),
            subject,
            message: message.trim(),
            honeypot
        });

        return json({
            success: true,
            message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
            contactMessage
        });

    } catch (error) {
        return json({ error: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' }, { status: 500 });
    }
};
