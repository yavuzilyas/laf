import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getUsers, getArticles } from '$db/queries';
import { getLinks } from '$db/queries-links';
import { query } from '$db/pg';

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
  const currentUser = (locals as any).user;

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    throw error(403, 'Yetkisiz erişim');
  }

  // Get pending articles count
  const pendingArticles = await getArticles({ status: 'pending' });
  const pendingArticlesCount = pendingArticles.length;

  const users = await getUsers({ limit: 150 });
  
  // Get all links
  const links = await getLinks();
  
  // Get all events
  const eventsResult = await query(`
    SELECT 
      id,
      title,
      description,
      date,
      end_date as "endDate",
      city,
      location,
      type,
      category,
      image_url as "imageUrl",
      link,
      attendee_count as "attendeeCount",
      is_active as "isActive",
      created_at as "createdAt"
    FROM events
    ORDER BY date DESC
  `);
  const events = eventsResult.rows;

  const tableData = users.map((user: any) => ({
    id: user.id,
    header: user.username || user.email || `Kullanıcı`,
    type: user.role ?? 'user',
    status: user.status || (user.is_banned ? 'banned' : user.is_hidden ? 'hidden' : 'active'),
    banned: user.is_banned || false,
    hidden: user.is_hidden || false,
    target: `${user.report_count || 0}`,
    limit: formatDate(user.created_at),
    reviewer: user.moderation_action?.action ?? '—',
    deletionTimestamp:
      user.status === 'silinecek' && user.moderation_action?.timestamp
        ? new Date(user.moderation_action.timestamp).toISOString()
        : null,
    name: user.name || null,
    surname: user.surname || null,
    nickname: user.username || null,
    email: user.email || null,
    phone_number: user.phone_number || null,
    location: user.location || null
  }));

  return {
    tableData,
    pendingArticlesCount,
    links,
    events,
    currentUser: {
      id: currentUser.id || 'unknown',
      role: currentUser.role || 'user',
      nickname: currentUser.username || 'Unknown'
    }
  };
};
