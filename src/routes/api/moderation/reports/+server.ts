// src/routes/api/moderation/reports/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
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

  // Get reported articles (articles with reports field)
  const reportedArticles = await articles
    .find(
      { 
        reports: { $exists: true, $ne: [] },
        deletedAt: { $exists: false }
      },
      { 
        projection: { 
          _id: 1,
          title: 1,
          slug: 1,
          authorId: 1,
          'author.nickname': 1,
          reports: 1,
          createdAt: 1,
          hidden: 1,
          status: 1
        } 
      }
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  // Get reported comments
  const reportedComments = await comments
    .find(
      { 
        reports: { $exists: true, $ne: [] },
        deletedAt: { $exists: false }
      },
      { 
        projection: { 
          _id: 1,
          articleId: 1,
          content: 1,
          'author.nickname': 1,
          userId: 1,
          reports: 1,
          createdAt: 1,
          hidden: 1
        } 
      }
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  // Get reported users
  const reportedUsers = await users
    .find(
      { 
        reports: { $exists: true, $ne: [] }
      },
      { 
        projection: { 
          _id: 1,
          nickname: 1,
          email: 1,
          reports: 1,
          createdAt: 1
        } 
      }
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return json({
    articles: reportedArticles.map(article => ({
      id: article._id.toString(),
      title: article.title || 'Untitled',
      slug: article.slug,
      authorId: article.authorId?.toString(),
      authorNickname: article.author?.nickname,
      reports: article.reports || [],
      reportCount: (article.reports || []).length,
      createdAt: article.createdAt,
      hidden: article.hidden || false,
      status: article.status
    })),
    comments: reportedComments.map(comment => ({
      id: comment._id.toString(),
      articleId: comment.articleId?.toString(),
      content: comment.content,
      authorNickname: comment.author?.nickname,
      userId: comment.userId?.toString(),
      reports: comment.reports || [],
      reportCount: (comment.reports || []).length,
      createdAt: comment.createdAt,
      hidden: comment.hidden || false
    })),
    users: reportedUsers.map(user => ({
      id: user._id.toString(),
      nickname: user.nickname,
      email: user.email,
      reports: user.reports || [],
      reportCount: (user.reports || []).length,
      createdAt: user.createdAt
    }))
  });
}

