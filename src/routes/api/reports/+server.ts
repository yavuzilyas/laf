import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  getReports, 
  createReport, 
  updateReport, 
  getReportsCount, 
  checkExistingReport,
  incrementReportCount,
  getUsers,
  getArticles,
  getComments
} from '$db/queries';
import { notifyNewReport } from '$lib/server/notifications-pg';

interface ReportData {
  type: 'profile' | 'article' | 'comment' | 'error';
  targetId: string;
  reason: string;
  details?: string;
  url?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = (locals as any)?.user;

  try {
    const data: ReportData = await request.json();
    const { type, targetId, reason, details, url } = data;

    // Validate required fields
    if (!type || !targetId || !reason) {
      return json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    // Validate report type
    if (!['profile', 'article', 'comment', 'error'].includes(type)) {
      return json({ error: 'Geçersiz rapor türü' }, { status: 400 });
    }

    // Error reports don't require authentication
    if (type !== 'error' && !user) {
      return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
    }

    // For error reports, use a special handling
    if (type === 'error') {
      const reportData = {
        type: 'error',
        target_id: targetId, // This will be a descriptive string like "500" or "site-error"
        reporter_id: user ? user.id : null,
        reason,
        details: details?.trim() || '',
        url: url?.trim() || null,
        target_data: {
          location: details || 'Unknown location',
          userAgent: request.headers.get('user-agent') || 'Unknown',
          timestamp: new Date().toISOString()
        },
        reporter_data: user ? {
          username: user.username,
          name: user.name,
          surname: user.surname,
          email: user.email
        } : {
          anonymous: true
        },
        status: 'pending'
      };

      const result = await createReport(reportData);

      // Create notification for admins (not moderators for error reports)
      const admins = await getUsers({ role: 'admin' });
      
      // Note: You'll need to implement notification creation separately
      // This is a placeholder for the notification logic

      return json({ 
        success: true, 
        message: 'Hata bildiriminiz alındı. Teknik ekibimiz en kısa sürede inceleyecektir.',
        reportId: result.id
      });
    }

    // Standard reports (profile, article, comment) require authentication
    const userId = user.id;

    // Check if user already reported this target
    const existingReport = await checkExistingReport(userId, targetId, type);
    if (existingReport) {
      return json({ error: 'Bu içeriği zaten bildirdiniz' }, { status: 400 });
    }

    // Verify target exists and get target data
    let targetExists = false;
    let targetData: any = {};
    let articleId = null;
    let commentId = null;
    let profileId = null;

    switch (type) {
      case 'profile':
        const users = await getUsers({ id: targetId });
        const userDoc = users[0];
        targetExists = !!userDoc;
        if (userDoc) {
          targetData = {
            username: userDoc.username,
            name: userDoc.name,
            surname: userDoc.surname
          };
          profileId = targetId;
        }
        break;

      case 'article':
        const articles = await getArticles({ id: targetId });
        const articleDoc = articles[0];
        targetExists = !!articleDoc;
        if (articleDoc) {
          targetData = {
            title: articleDoc.translations?.tr?.title || articleDoc.translations?.en?.title || 'Untitled',
            authorId: articleDoc.author_id
          };
          articleId = targetId;
        }
        break;

      case 'comment':
        const comments = await getComments({ id: targetId });
        const commentDoc = comments[0];
        targetExists = !!commentDoc;
        if (commentDoc) {
          let content = commentDoc.content;
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
              content = JSON.parse(content);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
          
          targetData = {
            content: typeof content === 'string' 
              ? content.substring(0, 100)
              : JSON.stringify(content).substring(0, 100),
            authorId: commentDoc.author_id,
            articleId: commentDoc.article_id
          };
          commentId = targetId;
        }
        break;
    }

    if (!targetExists) {
      return json({ error: 'Bildirilen içerik bulunamadı' }, { status: 404 });
    }

    // Create report
    const reportData = {
      type,
      target_id: targetId,
      article_id: articleId,
      comment_id: commentId,
      profile_id: profileId,
      reporter_id: userId,
      reason,
      details: details?.trim() || '',
      url: url?.trim() || null,
      target_data: targetData,
      reporter_data: {
        username: user.username,
        name: user.name,
        surname: user.surname
      },
      status: 'pending'
    };

    const result = await createReport(reportData);

    // Increment report count on target
    await incrementReportCount(type, targetId);

    // Create notification for moderators about new report
    try {
      await notifyNewReport({
        reportId: result.id,
        reporterId: userId,
        reportType: type,
        targetId: targetId,
        reason: reason
      });
    } catch (notificationError) {
      console.error('Failed to send notification for new report:', notificationError);
      // Don't fail the request if notification fails
    }

    return json({ 
      success: true, 
      message: 'Bildiriminiz alındı ve incelenecek',
      reportId: result.id
    });

  } catch (error) {
    console.error('Report creation error:', error);
    return json({ error: 'Bildirim gönderilemedi' }, { status: 500 });
  }
};

// Get user's reports
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = (locals as any)?.user;

  if (!user) {
    return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  }

  try {
    const userId = user.id;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const reports = await getReports({ 
      reporter_id: userId,
      limit,
      offset
    });

    const total = await getReportsCount({ reporter_id: userId });

    return json({
      reports: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    return json({ error: 'Bildirimler yüklenemedi' }, { status: 500 });
  }
};