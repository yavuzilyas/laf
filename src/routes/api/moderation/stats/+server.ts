// src/routes/api/moderation/stats/+server.ts
import { json } from '@sveltejs/kit';
import { getArticlesCollection, getCommentsCollection, getUsersCollection } from '$db/mongo';

export async function GET({ locals }) {
  const user = (locals as any)?.user;
  
  // Check if user is moderator or admin
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const articles = await getArticlesCollection();
  const comments = await getCommentsCollection();
  const users = await getUsersCollection();

  const [
    totalReportedArticles,
    totalReportedComments,
    totalReportedUsers,
    hiddenArticles,
    hiddenComments
  ] = await Promise.all([
    articles.countDocuments({ 
      reports: { $exists: true, $ne: [] },
      deletedAt: { $exists: false }
    }),
    comments.countDocuments({ 
      reports: { $exists: true, $ne: [] },
      deletedAt: { $exists: false }
    }),
    users.countDocuments({ 
      reports: { $exists: true, $ne: [] }
    }),
    articles.countDocuments({ 
      hidden: true,
      deletedAt: { $exists: false }
    }),
    comments.countDocuments({ 
      hidden: true,
      deletedAt: { $exists: false }
    })
  ]);

  return json({
    reportedArticles: totalReportedArticles,
    reportedComments: totalReportedComments,
    reportedUsers: totalReportedUsers,
    hiddenArticles,
    hiddenComments,
    totalReports: totalReportedArticles + totalReportedComments + totalReportedUsers
  });
}

