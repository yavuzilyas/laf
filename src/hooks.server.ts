import { start_mongo, getUsersCollection } from '$db/mongo';
import type { Handle } from '@sveltejs/kit';
import { ObjectId } from "mongodb";

start_mongo().then(() : void  => { console.log("MongoDB connected."); } ).catch( (err) : void => { console.error("MongoDB connection error:", err); } );

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get("session");

  if (session) {
    try {
      const users = await getUsersCollection();
      const user = await users.findOne({ _id: new ObjectId(session) });
      if (user) {
        if (user.banned || user.status === 'banned') {
          event.cookies.delete('session', { path: '/' });
          return new Response('Hesabınız banlandı', { status: 403 });
        }
        event.locals.user = {
          id: user._id.toString(),
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar ?? null,
          role: user.role ?? 'user' // 'user', 'moderator', 'admin'
        } as any;
      }
    } catch (err) {
      console.error("Error loading user from session:", err);
    }
  }

  return resolve(event);
};
