import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.set('session', '', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: false,
		maxAge: 0
	});
	throw redirect(303, '/');
	
};
