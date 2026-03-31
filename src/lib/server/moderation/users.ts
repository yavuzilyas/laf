import { getUsersCollection } from '$db/queries';

const formatDate = (value?: Date | string) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export type ModerationTableRow = {
  id: string;
  header: string;
  type: string;
  status: string;
  banned: boolean;
  hidden: boolean;
  target: string;
  limit: string;
  reviewer: string;
  name: string | null;
  surname: string | null;
  nickname: string;
  email: string | null;
};

export async function getModerationTableData(limit = 150): Promise<ModerationTableRow[]> {
  const usersCollection = getUsersCollection();
  const usersResult = await usersCollection.find({}, { limit });
  const users = await usersResult.toArray();

  return users.map((user: any, index: number) => ({
    id: user.id,
    header: user.nickname || user.email || `Kullanıcı ${index + 1}`,
    type: user.role ?? 'user',
    status: user.status || (user.is_banned ? 'banned' : user.hidden ? 'hidden' : 'active'),
    banned: Boolean(user.is_banned),
    hidden: Boolean(user.hidden),
    target: `${Array.isArray(user.reports) ? user.reports.length : user.report_count || 0}`,
    limit: formatDate(user.created_at),
    reviewer: user.moderation_action?.action ?? '—',
    name: user.name || null,
    surname: user.surname || null,
    nickname: user.nickname || user.username || '',
    email: user.email || null
  }));
}
