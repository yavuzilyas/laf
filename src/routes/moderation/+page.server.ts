import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUsersCollection, getArticlesCollection } from '$db/mongo';

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

export const load: PageServerLoad = async ({ locals }) => {
  const currentUser = locals.user;

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    throw error(403, 'Yetkisiz erişim');
  }

  // Get pending articles count
  const articlesCollection = await getArticlesCollection();
  const pendingArticlesCount = await articlesCollection.countDocuments({ 
    status: 'pending',
    deletedAt: { $exists: false }
  });

  // Debug: log current user structure
  console.log('Current user:', JSON.stringify(currentUser, null, 2));

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
    .limit(150)
    .toArray();

  const tableData = users.map((user, index) => ({
    id: user._id.toString(),
    header: user.nickname || user.email || `Kullanıcı ${index + 1}`,
    type: user.role ?? 'user',
    status: user.status || (user.banned ? 'banned' : user.hidden ? 'hidden' : 'active'),
    banned: user.banned || false,
    hidden: user.hidden || false,
    target: `${Array.isArray(user.reports) ? user.reports.length : user.reportsCount || 0}`,
    limit: formatDate(user.createdAt),
    reviewer: user.moderationAction?.action ?? '—',
    deletionTimestamp:
      user.status === 'silinecek' && user.moderationAction?.timestamp
        ? new Date(user.moderationAction.timestamp).toISOString()
        : null,
    name: user.name || null,
    surname: user.surname || null,
    nickname: user.nickname || '',
    email: user.email || null
  }));

  return {
    tableData,
    pendingArticlesCount,
    currentUser: {
      id: currentUser._id?.toString() || currentUser.id || 'unknown',
      role: currentUser.role || 'user',
      nickname: currentUser.nickname || 'Unknown'
    }
  };
};
