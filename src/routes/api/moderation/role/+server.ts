import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '$db/mongo';

const normalizeRole = (role?: string | null) => (role ?? 'user').toLowerCase();
const isObjectId = (value?: string) => Boolean(value && ObjectId.isValid(value));
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

  if (!isObjectId(userId) || !isObjectId(moderatorId)) {
    return json({ error: 'Geçersiz kullanıcı bilgisi' }, { status: 400 });
  }

  if (actor.id !== moderatorId) {
    return json({ error: 'Kimlik doğrulaması başarısız' }, { status: 403 });
  }

  if (!action || !(action in roleMap)) {
    return json({ error: 'Geçersiz işlem türü' }, { status: 400 });
  }

  const users = await getUsersCollection();
  const targetId = new ObjectId(userId);

  const targetUser = await users.findOne({ _id: targetId });
  if (!targetUser) {
    return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const targetRole = normalizeRole(targetUser.role);
  const { from, to, message } = roleMap[action as RoleAction];

  if (targetRole === 'admin') {
    return json({ error: 'Admin hesabı değiştirilemez' }, { status: 403 });
  }

  if (targetRole !== from) {
    return json({ error: `Bu kullanıcı ${action === 'promote' ? 'zaten moderatör' : 'zaten kullanıcı'}` }, { status: 409 });
  }

  await users.updateOne(
    { _id: targetId },
    {
      $set: {
        role: to,
        moderationAction: {
          action,
          moderatorId: new ObjectId(moderatorId),
          timestamp: new Date()
        }
      }
    }
  );

  return json({ success: true, message });
}
