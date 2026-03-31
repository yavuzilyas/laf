// src/routes/api/moderation/stats/+server.ts
import { json } from '@sveltejs/kit';
import { query } from '$db/pg';

export async function GET({ locals }) {
  const user = (locals as any)?.user;
  
  // Check if user is moderator or admin
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    totalReportedArticlesResult,
    totalReportedCommentsResult,
    totalReportedUsersResult,
    hiddenArticlesResult,
    hiddenCommentsResult
  ] = await Promise.all([
    query(`
      SELECT COUNT(*) as count FROM articles 
      WHERE report_count > 0 AND deleted_at IS NULL
    `),
    query(`
      SELECT COUNT(*) as count FROM comments 
      WHERE report_count > 0 AND deleted_at IS NULL
    `),
    query(`
      SELECT COUNT(*) as count FROM users 
      WHERE report_count > 0
    `),
    query(`
      SELECT COUNT(*) as count FROM articles 
      WHERE is_hidden = TRUE AND deleted_at IS NULL
    `),
    query(`
      SELECT COUNT(*) as count FROM comments 
      WHERE is_hidden = TRUE AND deleted_at IS NULL
    `)
  ]);

  const totalReportedArticles = parseInt(totalReportedArticlesResult.rows[0]?.count || '0');
  const totalReportedComments = parseInt(totalReportedCommentsResult.rows[0]?.count || '0');
  const totalReportedUsers = parseInt(totalReportedUsersResult.rows[0]?.count || '0');
  const hiddenArticles = parseInt(hiddenArticlesResult.rows[0]?.count || '0');
  const hiddenComments = parseInt(hiddenCommentsResult.rows[0]?.count || '0');

  return json({
    reportedArticles: totalReportedArticles,
    reportedComments: totalReportedComments,
    reportedUsers: totalReportedUsers,
    hiddenArticles,
    hiddenComments,
    totalReports: totalReportedArticles + totalReportedComments + totalReportedUsers
  });
}

