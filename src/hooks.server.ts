import { start_pg, query } from '$db/pg';
import type { Handle } from '@sveltejs/kit';

start_pg().then(() : void => { } ).catch( (err) : void => { } );

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get("session");

  if (session) {
    try {
      const users = await query('SELECT * FROM users WHERE id = $1', [session]);
      const user = users.rows[0];
      if (user) {
        if (user.is_banned) {
          event.cookies.delete('session', { path: '/' });
          return new Response('Hesabınız banlandı', { status: 403 });
        }
        event.locals.user = {
          id: user.id,
          email: user.email,
          nickname: user.username,
          avatar: user.avatar_url ?? null,
          role: user.role ?? 'user'
        } as any;
      }
    } catch (err) {
    }
  }

  return resolve(event, {
    bodySizeLimit: 4 * 1024 * 1024 // 4MB
  });
};
