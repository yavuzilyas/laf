import { getUsersCollection } from '$db/mongo';

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
  const usersCollection = await getUsersCollection();
  const users = await usersCollection
    .find(
      {},
      {
        projection: {
          password: 0,
          mnemonicHashes: 0
        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return users.map((user, index) => ({
    id: user._id.toString(),
    header: user.nickname || user.email || `Kullanıcı ${index + 1}`,
    type: user.role ?? 'user',
    status: user.status || (user.banned ? 'banned' : user.hidden ? 'hidden' : 'active'),
    banned: Boolean(user.banned),
    hidden: Boolean(user.hidden),
    target: `${Array.isArray(user.reports) ? user.reports.length : user.reportsCount || 0}`,
    limit: formatDate(user.createdAt),
    reviewer: user.moderationAction?.action ?? '—',
    name: user.name || null,
    surname: user.surname || null,
    nickname: user.nickname || '',
    email: user.email || null
  }));
}
