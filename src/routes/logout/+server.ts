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
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"></head><body>
		<script>
		try { sessionStorage.removeItem('laf.mnemonicPhrase'); } catch (e) {}
		window.location.replace('/');
		</script>
		</body></html>`,
		{ headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
	);
	
};
