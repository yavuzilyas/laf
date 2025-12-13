// src/routes/api/moderation/reports/+server.ts
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const { db } = locals;
  const reportsCollection = db.collection('reports');
  const usersCollection = db.collection('users');
  const articlesCollection = db.collection('articles');
  const commentsCollection = db.collection('comments');

  try {
    // Get all pending reports
    const pendingReports = await reportsCollection
      .find(
        { status: 'pending' },
        {
          projection: {
            _id: 1,
            type: 1,
            targetId: 1,
            targetData: 1,
            reporterId: 1,
            reporterData: 1,
            reason: 1,
            details: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      )
      .toArray();

    // Group reports by target type and ID
    const reportsByTarget = pendingReports.reduce((acc, report) => {
      const key = `${report.type}-${report.targetId}`;
      if (!acc[key]) {
        acc[key] = {
          type: report.type,
          targetId: report.targetId,
          reports: [],
          reporters: new Set(),
          reasons: new Set(),
          firstReportedAt: report.createdAt,
          lastReportedAt: report.createdAt
        };
      }
      
      acc[key].reports.push(report);
      acc[key].reporters.add(report.reporterId.toString());
      if (report.reason) acc[key].reasons.add(report.reason);
      
      // Update timestamps
      if (report.createdAt < acc[key].firstReportedAt) {
        acc[key].firstReportedAt = report.createdAt;
      }
      if (report.createdAt > acc[key].lastReportedAt) {
        acc[key].lastReportedAt = report.createdAt;
      }
      
      return acc;
    }, {});

    // Get unique target IDs for each type
    const userIds = [];
    const articleIds = [];
    const commentIds = [];
    
    Object.values(reportsByTarget).forEach((reportGroup: any) => {
      if (reportGroup.type === 'user') {
        userIds.push(new ObjectId(reportGroup.targetId));
      } else if (reportGroup.type === 'article') {
        articleIds.push(new ObjectId(reportGroup.targetId));
      } else if (reportGroup.type === 'comment') {
        commentIds.push(new ObjectId(reportGroup.targetId));
      }
    });

    // Fetch target data in parallel
    const [users, articles, comments] = await Promise.all([
      userIds.length > 0 
        ? usersCollection.find({ _id: { $in: userIds } }).toArray() 
        : [],
      articleIds.length > 0 
        ? articlesCollection.find({ _id: { $in: articleIds } }).toArray() 
        : [],
      commentIds.length > 0 
        ? commentsCollection.find({ _id: { $in: commentIds } }).toArray() 
        : []
    ]);

    // Create a map of targets by ID for quick lookup
    const usersMap = new Map(users.map(user => [user._id.toString(), user]));
    const articlesMap = new Map(articles.map(article => [article._id.toString(), article]));
    const commentsMap = new Map(comments.map(comment => [comment._id.toString(), comment]));

    // Process each report group and combine with target data
    const processedReports = Object.values(reportsByTarget).map((reportGroup: any) => {
      const { type, targetId, reports, reporters, reasons, firstReportedAt, lastReportedAt } = reportGroup;
      const reportCount = reports.length;
      const uniqueReporters = Array.from(reporters);
      const uniqueReasons = Array.from(reasons);

      let targetData = null;
      let reporterData = reports[0]?.reporterData || {};
      
      // Get target data based on type
      if (type === 'user') {
        const user = usersMap.get(targetId);
        if (user) {
          targetData = {
            id: user._id,
            type: 'user',
            nickname: user.nickname || 'Kullanıcı',
            email: user.email,
            status: user.status,
            banned: user.banned,
            createdAt: user.createdAt
          };
        }
      } else if (type === 'article') {
        const article = articlesMap.get(targetId);
        if (article) {
          targetData = {
            id: article._id,
            type: 'article',
            title: article.title || 'Başlıksız Makale',
            slug: article.slug,
            authorId: article.authorId,
            status: article.status,
            createdAt: article.createdAt
          };
        }
      } else if (type === 'comment') {
        const comment = commentsMap.get(targetId);
        if (comment) {
          targetData = {
            id: comment._id,
            type: 'comment',
            content: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : ''),
            articleId: comment.articleId,
            authorId: comment.authorId,
            status: comment.status,
            createdAt: comment.createdAt
          };
        }
      }

      // If we couldn't find the target, use the data from the report
      if (!targetData) {
        targetData = {
          id: targetId,
          type,
          ...(reports[0]?.targetData || {})
        };
        
        // Set default values for missing fields
        if (type === 'user') {
          targetData.nickname = targetData.nickname || 'Silinmiş Kullanıcı';
        } else if (type === 'article') {
          targetData.title = targetData.title || 'Silinmiş Makale';
        } else if (type === 'comment') {
          targetData.content = 'Silinmiş Yorum';
        }
      }

      // Format the response
      return {
        id: targetId,
        type,
        target: targetData,
        reportCount,
        reporterCount: uniqueReporters.length,
        reasons: uniqueReasons,
        firstReportedAt,
        lastReportedAt,
        status: 'pending',
        reporterData: {
          nickname: reporterData.nickname || 'Anonim',
          name: reporterData.name,
          surname: reporterData.surname
        },
        createdAt: firstReportedAt,
        updatedAt: lastReportedAt
      };
    });

    // Sort by most recently reported first
    processedReports.sort((a: any, b: any) => 
      new Date(b.lastReportedAt).getTime() - new Date(a.lastReportedAt).getTime()
    );

    // Group by type for the response
    const result = {
      users: processedReports.filter((r: any) => r.type === 'user'),
      articles: processedReports.filter((r: any) => r.type === 'article'),
      comments: processedReports.filter((r: any) => r.type === 'comment'),
      all: processedReports
    };

    return json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching reported content:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch reported content',
        details: error.message 
      },
      { status: 500 }
    );
  }
};
