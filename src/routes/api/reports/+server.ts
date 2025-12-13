import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ObjectId } from 'mongodb';
import { clientPromise } from '$db/mongo';

interface ReportData {
  type: 'profile' | 'article' | 'comment';
  targetId: string;
  reason: string;
  details?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = (locals as any)?.user;

  if (!user) {
    return json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  }

  try {
    const data: ReportData = await request.json();
    const { type, targetId, reason, details } = data;

    // Validate required fields
    if (!type || !targetId || !reason) {
      return json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    // Validate report type
    if (!['profile', 'article', 'comment'].includes(type)) {
      return json({ error: 'Geçersiz rapor türü' }, { status: 400 });
    }

    // Validate targetId
    if (!ObjectId.isValid(targetId)) {
      return json({ error: 'Geçersiz hedef ID' }, { status: 400 });
    }

    const db = (await clientPromise).db("laf_app");
    const reportsCollection = db.collection('reports');
    const userId = new ObjectId(user.id);
    const targetObjectId = new ObjectId(targetId);

    // Check if user already reported this target
    const existingReport = await reportsCollection.findOne({
      reporterId: userId,
      targetId: targetObjectId,
      type,
      status: { $in: ['pending', 'reviewing'] }
    });

    if (existingReport) {
      return json({ error: 'Bu içeriği zaten bildirdiniz' }, { status: 400 });
    }

    // Verify target exists
    let targetExists = false;
    let targetData: any = {};

    switch (type) {
      case 'profile':
        const usersCollection = db.collection('users');
        const userDoc = await usersCollection.findOne({ _id: targetObjectId });
        targetExists = !!userDoc;
        if (userDoc) {
          targetData = {
            nickname: userDoc.nickname,
            name: userDoc.name,
            surname: userDoc.surname
          };
        }
        break;

      case 'article':
        const articlesCollection = db.collection('articles');
        const articleDoc = await articlesCollection.findOne({ 
          _id: targetObjectId,
          deletedAt: { $exists: false }
        });
        targetExists = !!articleDoc;
        if (articleDoc) {
          targetData = {
            title: articleDoc.title,
            authorId: articleDoc.authorId
          };
        }
        break;

      case 'comment':
        const commentsCollection = db.collection('comments');
        const commentDoc = await commentsCollection.findOne({ 
          _id: targetObjectId,
          deletedAt: { $exists: false }
        });
        targetExists = !!commentDoc;
        if (commentDoc) {
          targetData = {
            content: typeof commentDoc.content === 'string' 
              ? commentDoc.content.substring(0, 100)
              : JSON.stringify(commentDoc.content).substring(0, 100),
            authorId: commentDoc.userId,
            articleId: commentDoc.articleId
          };
        }
        break;
    }

    if (!targetExists) {
      return json({ error: 'Bildirilen içerik bulunamadı' }, { status: 404 });
    }

    // Create report
    const report = {
      type,
      targetId: targetObjectId,
      targetData,
      reporterId: userId,
      reporterData: {
        nickname: user.nickname,
        name: user.name,
        surname: user.surname
      },
      reason,
      details: details?.trim() || '',
      status: 'pending', // pending, reviewing, resolved, rejected
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      resolution: null,
      notes: ''
    };

    const result = await reportsCollection.insertOne(report);

    // Increment report count on target
    switch (type) {
      case 'profile':
        await db.collection('users').updateOne(
          { _id: targetObjectId },
          { $inc: { reportCount: 1 } }
        );
        break;

      case 'article':
        await db.collection('articles').updateOne(
          { _id: targetObjectId },
          { $inc: { reportCount: 1 } }
        );
        break;

      case 'comment':
        await db.collection('comments').updateOne(
          { _id: targetObjectId },
          { $inc: { reportCount: 1 } }
        );
        break;
    }

    // Create notification for moderators
    const notificationsCollection = db.collection('notifications');
    const moderators = await db.collection('users').find({ 
      role: { $in: ['moderator', 'admin'] }
    }).toArray();

    for (const moderator of moderators) {
      await notificationsCollection.insertOne({
        userId: moderator._id,
        type: 'report',
        title: 'Yeni Bildirim',
        message: `${type === 'profile' ? 'Profil' : type === 'article' ? 'Makale' : 'Yorum'} bildirildi: ${reason}`,
        data: {
          reportId: result.insertedId,
          reportType: type,
          targetId: targetObjectId,
          reason
        },
        read: false,
        createdAt: new Date()
      });
    }

    return json({ 
      success: true, 
      message: 'Bildiriminiz alındı ve incelenecek',
      reportId: result.insertedId.toString()
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
    const db = (await clientPromise).db("laf_app");
    const reportsCollection = db.collection('reports');
    const userId = new ObjectId(user.id);

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const reports = await reportsCollection
      .find({ reporterId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await reportsCollection.countDocuments({ reporterId: userId });

    const serializedReports = reports.map(report => ({
      ...report,
      _id: report._id.toString(),
      targetId: report.targetId.toString(),
      reporterId: report.reporterId.toString(),
      reviewedBy: report.reviewedBy ? report.reviewedBy.toString() : null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      reviewedAt: report.reviewedAt ? report.reviewedAt.toISOString() : null
    }));

    return json({
      reports: serializedReports,
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