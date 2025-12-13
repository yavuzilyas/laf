import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const user = (locals as any)?.user ?? null;

    if (!user) {
        return json({ user: null }, { status: 200 });
    }

    return json({
        user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar ?? null,
            role: user.role ?? 'user'
        }
    });
};
