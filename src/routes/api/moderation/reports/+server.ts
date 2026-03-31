// src/routes/api/moderation/reports/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  getReports, 
  updateReport, 
  getUsers,
  getArticles,
  getComments
} from '$db/queries';
import { notifyReportStatusChange } from '$lib/server/notifications-pg';

export const GET: RequestHandler = async ({ locals }) => {
  const user = (locals as any)?.user;
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all reports with limit for performance
    const reports = await getReports({ limit: 500 });

    // Group reports by target type and ID
    const reportsByTarget = reports.reduce((acc: any, report: any) => {
      const key = `${report.type}-${report.target_id}`;
      const createdAt = report.created_at ? new Date(report.created_at) : new Date();
      const updatedAt = report.updated_at ? new Date(report.updated_at) : createdAt;

      if (!acc[key]) {
        acc[key] = {
          type: report.type,
          targetId: report.target_id,
          reports: [],
          reportIds: [],
          reporters: new Map(),
          reasons: [],
          firstReportedAt: createdAt,
          lastReportedAt: updatedAt,
          lastStatus: report.status ?? 'pending',
          lastReviewedBy: report.reviewed_by ?? null,
          lastReviewedAt: report.reviewed_at ?? null
        };
      }

      acc[key].reports.push(report);
      acc[key].reportIds.push(report.id);

      if (report.reporter_id) {
        const reporterId = report.reporter_id;
        if (!acc[key].reporters.has(reporterId)) {
          acc[key].reporters.set(reporterId, {
            id: reporterId,
            username: report.reporter_data?.username || report.reporter_username,
            name: report.reporter_name,
            surname: report.reporter_surname,
            nickname: report.reporter_nickname || report.reporter_data?.nickname
          });
        }
      }

      if (typeof report.reason === 'string' && report.reason.trim().length > 0) {
        acc[key].reasons.push(report.reason.trim());
      }

      if (createdAt < acc[key].firstReportedAt) {
        acc[key].firstReportedAt = createdAt;
      }
      if (updatedAt > acc[key].lastReportedAt) {
        acc[key].lastReportedAt = updatedAt;
        acc[key].lastStatus = report.status ?? acc[key].lastStatus;
        acc[key].lastReviewedBy = report.reviewed_by ?? acc[key].lastReviewedBy;
        acc[key].lastReviewedAt = report.reviewed_at ?? acc[key].lastReviewedAt;
      }

      return acc;
    }, {});

    // Get unique target IDs for each type
    const userIds = [];
    const articleIds = [];
    const commentIds = [];
    
    Object.values(reportsByTarget).forEach((reportGroup: any) => {
      if (reportGroup.type === 'profile') {
        userIds.push(reportGroup.targetId);
      } else if (reportGroup.type === 'article') {
        articleIds.push(reportGroup.targetId);
      } else if (reportGroup.type === 'comment') {
        // Only add valid UUID-like IDs, filter out URLs or invalid strings
        const targetId = reportGroup.targetId;
        if (targetId && typeof targetId === 'string' && 
            !targetId.startsWith('http') && 
            !targetId.startsWith('/') &&
            targetId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          commentIds.push(targetId);
        }
      }
    });

    // Fetch target data in parallel
    const [users, articles, comments] = await Promise.all([
      userIds.length > 0 ? getUsers({ id: { $in: userIds } }) : [],
      articleIds.length > 0 ? getArticles({ id: { $in: articleIds } }) : [],
      commentIds.length > 0 ? getComments({ id: { $in: commentIds } }) : []
    ]);

    const commentArticleIds = Array.from(
      new Set(
        comments
          .map((comment: any) => comment.article_id)
          .filter(Boolean)
      )
    );

    const commentArticles = commentArticleIds.length
      ? await getArticles({ id: { $in: commentArticleIds } })
      : [];
    const commentArticlesMap = new Map(commentArticles.map((a: any) => [a.id, a]));

    // Create a map of targets by ID for quick lookup
    const usersMap = new Map(users.map(user => [user.id, user]));
    const articlesMap = new Map(articles.map(article => [article.id, article]));
    const commentsMap = new Map(comments.map(comment => [comment.id, comment]));

    // Get reviewer info
    const reviewedByIds = Array.from(
      new Set(
        Object.values(reportsByTarget)
          .map((g: any) => g.lastReviewedBy)
          .filter(Boolean)
      )
    );
    const reviewedByUsers = reviewedByIds.length
      ? await getUsers({ id: { $in: reviewedByIds } })
      : [];
    const reviewedByMap = new Map(reviewedByUsers.map((u: any) => [u.id, u]));

    const processedReports = Object.values(reportsByTarget).map((reportGroup: any) => {
      const { type, targetId, reports, reportIds, reporters, reasons, firstReportedAt, lastReportedAt, lastStatus, lastReviewedBy, lastReviewedAt } = reportGroup;
      const reportCount = reports.length;
      const reporterList = Array.from((reporters as Map<string, any>).values());
      const reasonList = Array.from(new Set(reasons));

      let targetData: any = null;
      
      // Get target data based on type
      if (type === 'profile') {
        const user = usersMap.get(targetId);
        if (user) {
          targetData = {
            id: user.id,
            type: 'profile',
            username: user.username || 'Kullanıcı',
            nickname: user.nickname,
            name: user.name,
            surname: user.surname,
            email: user.email,
            status: user.status,
            is_banned: user.is_banned,
            created_at: user.created_at
          };
        }
      } else if (type === 'article') {
        const article = articlesMap.get(targetId);
        if (article) {
          const translations = article.translations || {};
          const title = translations.tr?.title || translations.en?.title || 'Başlıksız Makale';
          
          targetData = {
            id: article.id,
            type: 'article',
            title: title,
            slug: article.slug,
            author_id: article.author_id,
            status: article.status,
            created_at: article.created_at
          };
        }
      } else if (type === 'comment') {
        const comment = commentsMap.get(targetId);
        if (comment) {
          const articleRef = comment.article_id;
          const article = articleRef ? commentArticlesMap.get(articleRef) : null;
          
          let content = comment.content;
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
              content = JSON.parse(content);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
          
          const contentPreview = typeof content === 'string' 
            ? content.substring(0, 100) + (content.length > 100 ? '...' : '')
            : JSON.stringify(content).substring(0, 100) + '...';

          targetData = {
            id: comment.id,
            type: 'comment',
            content: contentPreview,
            article_id: comment.article_id,
            article_slug: article?.slug,
            author_id: comment.author_id,
            status: comment.status,
            created_at: comment.created_at,
            url: reports[0]?.url || null
          };
        } else {
          // Comment not found (possibly due to invalid ID), use report data
          targetData = {
            id: targetId,
            type: 'comment',
            content: 'Silinmiş veya erişilemeyen yorum',
            url: reports[0]?.url || null
          };
        }
      }

      // If we couldn't find target, use data from report
      if (!targetData) {
        targetData = {
          id: targetId,
          type,
          ...(reports[0]?.target_data || {})
        };
        
        // Set default values for missing fields
        if (type === 'profile') {
          targetData.username = targetData.username || targetData.nickname || 'Silinmiş Kullanıcı';
        } else if (type === 'article') {
          targetData.title = targetData.title || 'Silinmiş Makale';
        } else if (type === 'comment') {
          targetData.content = 'Silinmiş Yorum';
        }
      }

      const reviewedByUser = lastReviewedBy ? reviewedByMap.get(lastReviewedBy) : null;

      // Format response
      return {
        id: targetId,
        type,
        target: targetData,
        reportIds,
        reportCount,
        reporters: reporterList,
        reporterCount: reporterList.length,
        reasons: reasonList,
        firstReportedAt,
        lastReportedAt,
        status: lastStatus ?? 'pending',
        reviewedBy: reviewedByUser
          ? {
              id: reviewedByUser.id,
              username: reviewedByUser.username,
              name: reviewedByUser.name,
              surname: reviewedByUser.surname,
              nickname: reviewedByUser.nickname,
              role: reviewedByUser.role
            }
          : null,
        reviewedAt: lastReviewedAt,
        createdAt: firstReportedAt,
        updatedAt: lastReportedAt
      };
    });

    // Sort by most recently reported first
    processedReports.sort((a: any, b: any) => 
      new Date(b.lastReportedAt).getTime() - new Date(a.lastReportedAt).getTime()
    );

    // Group by type for response
    const result = {
      users: processedReports.filter((r: any) => r.type === 'profile'),
      articles: processedReports.filter((r: any) => r.type === 'article'),
      comments: processedReports.filter((r: any) => r.type === 'comment'),
      errors: processedReports.filter((r: any) => r.type === 'error'),
      all: processedReports
    };

    return json({
      success: true,
      data: result
    });
  } catch (error) {
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

// Update report status (approve/dismiss)
export const PUT: RequestHandler = async ({ request, locals }) => {
  const user = (locals as any)?.user;

  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { reportId, status, resolution, notes } = await request.json();

    if (!reportId || !status) {
      return json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    // Get the report to find the reporter ID
    const reports = await getReports({ id: reportId });
    const report = reports[0];
    
    if (!report) {
      return json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    const updates: any = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date()
    };

    if (resolution !== undefined) {
      updates.resolution = resolution;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const updatedReport = await updateReport(reportId, updates);

    if (!updatedReport) {
      return json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    // Send notification to the reporter
    if (report.reporter_id && report.reporter_id !== user.id) {
      try {
        await notifyReportStatusChange({
          reportId,
          reporterId: report.reporter_id,
          newStatus: status,
          notes: notes || null,
          moderatorId: user.id
        });
      } catch (notificationError) {
        // Don't fail the request if notification fails
      }
    }

    return json({
      success: true,
      message: 'Rapor güncellendi',
      report: updatedReport
    });

  } catch (error) {
    return json({ error: 'Rapor güncellenemedi' }, { status: 500 });
  }
};
