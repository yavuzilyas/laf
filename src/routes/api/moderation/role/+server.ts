import { json } from '@sveltejs/kit';
import { query } from '$db/pg';
import type { RequestHandler } from './$types';

const normalizeRole = (role?: string | null) => (role ?? 'user').toLowerCase();
const isUUID = (value?: string) => {
    if (!value) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
};

const roleMap = {
    promote: { from: 'user', to: 'moderator', message: 'Kullanıcı moderatör yapıldı' },
    demote: { from: 'moderator', to: 'user', message: 'Kullanıcı moderatörlükten çıkarıldı' }
} as const;

type RoleAction = keyof typeof roleMap;

export async function POST({ request, locals }) {
    const actor = (locals as any)?.user;

    if (!actor || actor.role !== 'admin') {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, action, moderatorId } = await request.json();

    if (!isUUID(userId) || !isUUID(moderatorId)) {
        return json({ error: 'Geçersiz kullanıcı bilgisi' }, { status: 400 });
    }

    if (actor.id !== moderatorId) {
        return json({ error: 'Kimlik doğrulaması başarısız' }, { status: 403 });
    }

    if (!action || !(action in roleMap)) {
        return json({ error: 'Geçersiz işlem türü' }, { status: 400 });
    }

    const targetUser = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (targetUser.rows.length === 0) {
        return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const targetRole = normalizeRole(targetUser.rows[0].role);
    const { from, to, message } = roleMap[action as RoleAction];

    if (targetRole === 'admin') {
        return json({ error: 'Admin hesabı değiştirilemez' }, { status: 403 });
    }

    if (targetRole !== from) {
        return json({ error: `Bu kullanıcı ${action === 'promote' ? 'zaten moderatör' : 'zaten kullanıcı'}` }, { status: 409 });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [to, userId]);

    return json({ success: true, message });
}
