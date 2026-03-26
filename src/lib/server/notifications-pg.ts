import { 
    createNotification, 
    getNotifications, 
    getNotificationsCount, 
    getUnreadNotificationsCount,
    markNotificationRead, 
    markMultipleNotificationsRead, 
    markAllNotificationsRead,
    deleteNotification,
    deleteNotificationsByActor,
    upsertNotification,
    getBlockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    getFollowersList
} from '$db/queries';
import { getUsers, getComments, getArticles } from '$db/queries';

export type NotificationType = 'announcement' | 'comment' | 'reply' | 'like' | 'report_status' | 'article_status';

export interface NotificationActor {
    id: string;
    nickname?: string | null;
    name?: string | null;
}

async function getUserName(userId: string): Promise<string | null> {
    const users = await getUsers({ id: userId });
    const user = users[0];
    if (!user) return null;
    if (user.username) return user.username;
    if (user.name && user.surname) return `${user.name} ${user.surname}`;
    if (user.name) return user.name;
    return null;
}

function toIdString(id: string | null | undefined): string | null {
    if (!id) return null;
    return id;
}

async function resolveArticleSlug(articleId: string): Promise<string | null> {
    const articles = await getArticles({ id: articleId });
    const article = articles[0];
    if (!article) return null;
    
    // For now, return the article ID as slug
    // In a real implementation, you might have a slug field
    return article.id;
}

export async function notifyArticleComment(params: { 
    articleId: string; 
    articleSlug?: string | null; 
    commenterId: string; 
    articleAuthorId?: string | null; 
    commentId: string; 
    articleTitle?: string | null 
}) {
    const { articleId, articleSlug, commenterId, articleAuthorId, commentId, articleTitle } = params;
    if (!articleAuthorId) return;
    if (articleAuthorId === commenterId) return;
    if (await isUserBlocked(articleAuthorId, commenterId)) return;
    
    const articleIdStr = toIdString(articleId);
    const commentIdStr = toIdString(commentId);
    if (!articleIdStr || !commentIdStr) return;
    
    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
    const actorName = await getUserName(commenterId);
    
    const title = actorName ? 
        { key: 'notifications.messages.newComment', values: { user: actorName } } : 
        { key: 'notifications.messages.newComment', values: { user: 'Bir kullanıcı' } };
    const message = articleTitle ? 
        { key: 'notifications.messages.newCommentWithTitle', values: { user: actorName || 'Bir kullanıcı', title: articleTitle } } : 
        { key: 'notifications.messages.newCommentGeneric', values: { user: actorName || 'Bir kullanıcı' } };
    
    await createNotification({
        user_id: articleAuthorId,
        type: 'comment',
        title,
        content: message,
        data: {
            link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
            actor: {
                id: commenterId,
                name: actorName,
            },
            meta: {
                articleId: articleIdStr,
                articleSlug: articleSlugValue,
                commentId: commentIdStr,
            },
        },
    });
}

export async function notifyCommentReply(params: { 
    parentCommentId: string; 
    replierId: string; 
    articleId: string; 
    articleSlug?: string | null; 
    commentId: string 
}) {
    const { parentCommentId, replierId, articleId, articleSlug, commentId } = params;
    const comments = await getComments({ id: parentCommentId });
    const parent = comments[0];
    if (!parent?.author_id) return;
    if (parent.author_id === replierId) return;
    if (await isUserBlocked(parent.author_id, replierId)) return;
    
    const articleIdStr = toIdString(articleId);
    const commentIdStr = toIdString(commentId);
    const parentIdStr = toIdString(parentCommentId);
    if (!articleIdStr || !commentIdStr || !parentIdStr) return;
    
    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
    const actorName = await getUserName(replierId);
    const title = { key: 'notifications.messages.newReply' };
    
    await createNotification({
        user_id: parent.author_id,
        type: 'reply',
        title,
        content: { key: 'notifications.messages.newReplyMessage' },
        data: {
            link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
            actor: {
                id: replierId,
                name: actorName,
            },
            meta: {
                articleId: articleIdStr,
                articleSlug: articleSlugValue,
                commentId: commentIdStr,
                parentCommentId: parentIdStr,
            },
        },
    });
}

export async function notifyArticleLike(params: { 
    articleId: string; 
    articleSlug?: string | null; 
    likerId: string 
}) {
    const { articleId, articleSlug, likerId } = params;
    const articles = await getArticles({ id: articleId });
    const article = articles[0];
    if (!article?.author_id) return;
    if (article.author_id === likerId) return;
    if (await isUserBlocked(article.author_id, likerId)) return;
    
    const articleIdStr = toIdString(articleId);
    if (!articleIdStr) return;
    
    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;

    // Find existing like notification for this article
    const existing = await findExistingLikeNotification(article.author_id, articleIdStr, 'article-like');
    
    let likerIds: string[] = [];
    if (existing?.data?.meta?.likerIds && Array.isArray(existing.data.meta.likerIds)) {
        likerIds = existing.data.meta.likerIds as string[];
    }
    if (!likerIds.includes(likerId)) likerIds.push(likerId);

    // Get names for all likers
    const likerNames: string[] = [];
    for (const id of likerIds) {
        const name = await getUserName(id);
        if (name) likerNames.push(name);
    }

    const count = likerIds.length;
    let title: { key: string; values?: Record<string, string | number | null | undefined> };
    if (count === 1) {
        title = { key: 'notifications.messages.articleLiked' };
    } else if (count === 2) {
        title = { key: 'notifications.messages.articleLikedTwo' };
    } else {
        title = { key: 'notifications.messages.articleLikedMany', values: { count: count - 1 } };
    }

    const message = article?.title 
        ? { key: 'notifications.messages.articleLikedMessageWithTitle', values: { title: article.title } }
        : { key: 'notifications.messages.articleLikedMessage' };

    await upsertNotification(article.author_id, 'like', { articleId: articleIdStr, kind: 'article-like' }, {
        title,
        content: message,
        data: {
            link: `/article/${articleSlugValue}`,
            actor: { id: likerId, name: await getUserName(likerId) },
            meta: {
                kind: 'article-like',
                articleId: articleIdStr,
                articleSlug: articleSlugValue,
                likerIds,
                likerNames,
                count,
            },
        },
    });
}

export async function notifyCommentLike(params: { 
    commentId: string; 
    likerId: string; 
    articleId: string; 
    articleSlug?: string | null 
}) {
    const { commentId, likerId, articleId, articleSlug } = params;
    const comments = await getComments({ id: commentId });
    const comment = comments[0];
    if (!comment?.author_id) return;
    if (comment.author_id === likerId) return;
    if (await isUserBlocked(comment.author_id, likerId)) return;
    
    const commentIdStr = toIdString(commentId);
    const articleIdStr = toIdString(articleId);
    if (!commentIdStr || !articleIdStr) return;
    
    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;

    const existing = await findExistingLikeNotification(comment.author_id, commentIdStr, 'comment-like');
    
    let likerIds: string[] = [];
    if (existing?.data?.meta?.likerIds && Array.isArray(existing.data.meta.likerIds)) {
        likerIds = existing.data.meta.likerIds as string[];
    }
    if (!likerIds.includes(likerId)) likerIds.push(likerId);

    // Get names for all likers
    const likerNames: string[] = [];
    for (const id of likerIds) {
        const name = await getUserName(id);
        if (name) likerNames.push(name);
    }

    const count = likerIds.length;
    let title: { key: string; values?: Record<string, string | number | null | undefined> };
    if (count === 1) {
        title = { key: 'notifications.messages.commentLiked' };
    } else if (count === 2) {
        title = { key: 'notifications.messages.commentLikedTwo' };
    } else {
        title = { key: 'notifications.messages.commentLikedMany', values: { count: count - 1 } };
    }

    await upsertNotification(comment.author_id, 'like', { commentId: commentIdStr, kind: 'comment-like' }, {
        title,
        content: { key: 'notifications.messages.commentLikedMessage' },
        data: {
            link: `/article/${articleSlugValue}#comment-${commentIdStr}`,
            actor: { id: likerId, name: await getUserName(likerId) },
            meta: {
                kind: 'comment-like',
                commentId: commentIdStr,
                articleId: articleIdStr,
                articleSlug: articleSlugValue,
                likerIds,
                likerNames,
                count,
            },
        },
    });
}

export interface NotificationMeta {
    [key: string]: any;
}

export interface TranslationObject {
    key: string;
    values?: Record<string, string | number | null | undefined>;
}

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string | TranslationObject;
    message: string | TranslationObject;
    link?: string | null;
    actor?: NotificationActor | null;
    meta?: NotificationMeta | null;
}

export interface NotificationRecord {
    id: string;
    type: NotificationType;
    title: string | TranslationObject;
    message: string | TranslationObject;
    link: string | null;
    actor: NotificationActor | null;
    meta: NotificationMeta | null;
    read: boolean;
    createdAt: string;
    readAt?: string | null;
}

export async function notifyNewArticle(params: { 
    articleId: string; 
    articleSlug?: string | null; 
    authorId: string;
    articleTitle: string;
    authorName: string;
}) {
    const { articleId, articleSlug, authorId, articleTitle, authorName } = params;
    const articleIdStr = toIdString(articleId);
    if (!articleIdStr) return;

    // Get all followers of the author
    const followersList = await getFollowersList(authorId);
    const followers: string[] = followersList.map((f: any) => f.id);

    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
    
    // Create notifications for each follower
    const notificationPromises = followers.map(async (followerId) => {
        if (followerId === authorId) return; // Don't notify self
        
        await createNotification({
            user_id: followerId,
            type: 'announcement',
            title: { key: 'notifications.messages.newArticlePublished', values: { title: articleTitle } },
            content: { key: 'notifications.messages.newArticlePublishedMessage', values: { title: articleTitle } },
            data: {
                link: `/article/${articleSlugValue}`,
                actor: {
                    id: authorId,
                    name: authorName
                },
                meta: {
                    kind: 'new-article',
                    articleId: articleIdStr,
                    articleSlug: articleSlugValue
                }
            }
        });
    });

    await Promise.all(notificationPromises);
}

export async function createNotificationFunc(input: CreateNotificationInput): Promise<NotificationRecord | null> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today

    // Check for existing similar notification today
    const existing = await findExistingNotification(input.userId, input.type, input.meta || {}, today);

    // If a similar notification exists today, don't create a new one
    if (existing) {
        return null;
    }

    const doc = {
        user_id: input.userId,
        type: input.type,
        title: input.title,
        content: input.message,
        data: {
            link: input.link ?? null,
            actor: input.actor ?? null,
            meta: input.meta ?? null,
        },
        is_read: false,
    };

    const result = await createNotification(doc);

    return {
        id: result.id,
        type: result.type,
        title: result.title,
        message: result.content,
        link: result.data?.link ?? null,
        actor: result.data?.actor ?? null,
        meta: result.data?.meta ?? null,
        read: result.is_read,
        createdAt: result.created_at.toISOString()
    };
}

// Helper function to find existing like notifications
async function findExistingLikeNotification(userId: string, itemId: string, kind: string) {
    const notifications = await getNotifications(userId, { unreadOnly: false });
    return notifications.find((n: any) => 
        n.type === 'like' && 
        n.data?.meta?.kind === kind && 
        (n.data?.meta?.articleId === itemId || n.data?.meta?.commentId === itemId)
    );
}

// Helper function to find existing notification
async function findExistingNotification(userId: string, type: string, meta: any, createdAt: Date) {
    const notifications = await getNotifications(userId, { unreadOnly: false });
    return notifications.find((n: any) => 
        n.type === type && 
        n.created_at >= createdAt &&
        (!meta.articleId || n.data?.meta?.articleId === meta.articleId) &&
        (!meta.commentId || n.data?.meta?.commentId === meta.commentId) &&
        (!meta.actorId || n.data?.actor?.id === meta.actorId)
    );
}

export function normalizeNotification(doc: any): NotificationRecord {
    return {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        message: doc.content,
        link: doc.data?.link ?? null,
        actor: doc.data?.actor ?? null,
        meta: doc.data?.meta ?? null,
        read: !!doc.is_read,
        createdAt: doc.created_at?.toISOString?.() ?? new Date().toISOString(),
        readAt: doc.updated_at?.toISOString?.() ?? null
    };
}

export async function markNotificationReadFunc(userId: string, notificationId: string): Promise<boolean> {
    return await markNotificationRead(userId, notificationId);
}

export async function markAllNotificationsReadFunc(userId: string): Promise<number> {
    return await markAllNotificationsRead(userId);
}

// API helper functions
export async function getNotificationsAPI(userId: string, page: number = 1, pageSize: number = 20) {
    const notifications = await getNotifications(userId, { page, pageSize });
    const total = await getNotificationsCount(userId);
    const unreadCount = await getUnreadNotificationsCount(userId);
    
    // Get blocked actors
    const blockedDoc = await getBlockedUsers(userId);
    const blockedActorIds: string[] = Array.isArray(blockedDoc?.blocked_actor_ids)
        ? blockedDoc.blocked_actor_ids.map((x: any) => String(x))
        : [];

    const data = notifications.map(normalizeNotification);

    return { data, total, page, pageSize, unreadCount, blockedActorIds };
}

export async function markNotificationsReadAPI(userId: string, ids: string[]) {
    const result = await markMultipleNotificationsRead(userId, ids);
    const unreadCount = await getUnreadNotificationsCount(userId);
    return { success: true, unreadCount: unreadCount };
}

export async function markAllNotificationsReadAPI(userId: string) {
    const result = await markAllNotificationsRead(userId);
    const unreadCount = await getUnreadNotificationsCount(userId);
    return { success: true, unreadCount, action: 'markAllRead' };
}

export async function deleteNotificationAPI(userId: string, notificationId: string) {
    const result = await deleteNotification(userId, notificationId);
    const unreadCount = await getUnreadNotificationsCount(userId);
    return { success: result, unreadCount, action: 'delete' };
}

export async function notifyReportStatusChange(params: { 
    reportId: string; 
    reporterId: string; 
    newStatus: string; 
    notes?: string | null;
    moderatorId: string;
}) {
    const { reportId, reporterId, newStatus, notes, moderatorId } = params;
    
    const moderatorName = await getUserName(moderatorId);
    
    let title;
    let message;
    
    if (newStatus === 'resolved') {
        title = { key: 'notifications.messages.reportResolved', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.reportResolvedMessage' };
    } else if (newStatus === 'rejected') {
        // For rejected status, show only raw moderator message
        if (notes) {
            title = 'Raporunuz reddedildi';
            message = `Sebep: ${notes}`;
        } else {
            title = { key: 'notifications.messages.reportRejected', values: { moderator: moderatorName || 'Moderatör' } };
            message = { key: 'notifications.messages.reportRejectedMessage' };
        }
    } else if (newStatus === 'reviewing') {
        title = { key: 'notifications.messages.reportReviewing', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.reportReviewingMessage' };
    } else {
        title = { key: 'notifications.messages.reportStatusChanged', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.reportStatusChangedMessage' };
    }
    
    await createNotification({
        user_id: reporterId,
        type: 'report_status',
        title,
        content: message,
        data: {
            link: null, // No link for status feedback
            actor: {
                id: moderatorId,
                name: moderatorName,
            },
            meta: {
                reportId,
                newStatus,
                notes,
            },
        },
    });
}

export async function notifyArticleStatusChange(params: { 
    articleId: string; 
    authorId: string; 
    newStatus: string; 
    notes?: string | null;
    moderatorId: string;
    articleTitle?: string | null;
    articleSlug?: string | null;
}) {
    const { articleId, authorId, newStatus, notes, moderatorId, articleTitle, articleSlug } = params;
    
    const moderatorName = await getUserName(moderatorId);
    const articleIdStr = toIdString(articleId);
    if (!articleIdStr) return;
    
    let title;
    let message;
    
    if (newStatus === 'published') {
        title = { key: 'notifications.messages.articlePublished', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.articlePublishedMessage', values: { title: articleTitle || 'Makale' } };
    } else if (newStatus === 'rejected') {
        // For rejected status, show only raw moderator message
        if (notes) {
            title = `"${articleTitle || 'Makale'}" makaleniz reddedildi`;
            message = `Sebep: ${notes}`;
        } else {
            title = { key: 'notifications.messages.articleRejected', values: { moderator: moderatorName || 'Moderatör' } };
            message = { key: 'notifications.messages.articleRejectedMessage', values: { title: articleTitle || 'Makale' } };
        }
    } else if (newStatus === 'pending') {
        title = { key: 'notifications.messages.articlePending', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.articlePendingMessage', values: { title: articleTitle || 'Makale' } };
    } else {
        title = { key: 'notifications.messages.articleStatusChanged', values: { moderator: moderatorName || 'Moderatör' } };
        message = { key: 'notifications.messages.articleStatusChangedMessage' };
    }
    
    await createNotification({
        user_id: authorId,
        type: 'article_status',
        title,
        content: message,
        data: {
            link: null, // No link for status feedback
            actor: {
                id: moderatorId,
                name: moderatorName,
            },
            meta: {
                articleId: articleIdStr,
                newStatus,
                notes,
                articleTitle,
            },
        },
    });
}

export async function blockUserAPI(userId: string, actorId: string) {
    await blockUser(userId, actorId);
    await deleteNotificationsByActor(userId, actorId);
    const unreadCount = await getUnreadNotificationsCount(userId);
    return { success: true, unreadCount, action: 'blockUser' };
}

export async function unblockUserAPI(userId: string, actorId: string) {
    await unblockUser(userId, actorId);
    const unreadCount = await getUnreadNotificationsCount(userId);
    return { success: true, unreadCount, action: 'unblockUser' };
}

export async function notifyNewReport(params: { 
    reportId: string; 
    reporterId: string; 
    reportType: string; 
    targetId: string;
    reason: string;
}) {
    const { reportId, reporterId, reportType, targetId, reason } = params;
    
    // Get all moderators and admins
    const moderators = await getUsers({ role: 'moderator' });
    const admins = await getUsers({ role: 'admin' });
    const allModerators = [...moderators, ...admins];
    
    const reporterName = await getUserName(reporterId);
    
    // Create notifications for all moderators
    const notificationPromises = allModerators.map(async (moderator: any) => {
        if (moderator.id === reporterId) return; // Don't notify self
        
        await createNotification({
            user_id: moderator.id,
            type: 'announcement',
            title: { key: 'notifications.messages.newReport', values: { type: reportType } },
            content: { key: 'notifications.messages.newReportMessage', values: { 
                reporter: reporterName || 'Bir kullanıcı', 
                type: reportType, 
                reason: reason.substring(0, 100) 
            }},
            data: {
                link: '/moderation', // Link to moderation page instead of specific report
                actor: {
                    id: reporterId,
                    name: reporterName,
                },
                meta: {
                    kind: 'new-report',
                    reportId,
                    reportType,
                    targetId,
                    reason
                }
            }
        });
    });

    await Promise.all(notificationPromises);
}

export async function notifyModeratorsNewArticle(params: { 
    articleId: string; 
    articleSlug?: string | null; 
    authorId: string;
    articleTitle: string;
    authorName: string;
}) {
    const { articleId, articleSlug, authorId, articleTitle, authorName } = params;
    const articleIdStr = toIdString(articleId);
    if (!articleIdStr) return;

    // Get all moderators and admins
    const moderators = await getUsers({ role: 'moderator' });
    const admins = await getUsers({ role: 'admin' });
    const allModerators = [...moderators, ...admins];

    const articleSlugValue = articleSlug ?? (await resolveArticleSlug(articleId)) ?? articleIdStr;
    
    // Create notifications for all moderators (except author if they're a moderator/admin)
    const notificationPromises = allModerators.map(async (moderator: any) => {
        if (moderator.id === authorId) return; // Don't notify self
        
        await createNotification({
            user_id: moderator.id,
            type: 'announcement',
            title: { key: 'notifications.messages.newArticleForReview', values: { title: articleTitle } },
            content: { key: 'notifications.messages.newArticleForReviewMessage', values: { 
                author: authorName, 
                title: articleTitle 
            }},
            data: {
                link: '/moderation', // Link to moderation page instead of specific article
                actor: {
                    id: authorId,
                    name: authorName
                },
                meta: {
                    kind: 'new-article-for-review',
                    articleId: articleIdStr,
                    articleSlug: articleSlugValue
                }
            }
        });
    });

    await Promise.all(notificationPromises);
}

export async function notifyAdminsNewDonation(params: { 
    donationId: string; 
    amount: number; 
    donorId?: string | null;
    donorName?: string | null;
    message?: string | null;
}) {
    const { donationId, amount, donorId, donorName, message } = params;
    
    // Get all admins
    const admins = await getUsers({ role: 'admin' });
    
    const donorDisplayName = donorName || await getUserName(donorId || '') || 'Anonim bağışçı';
    
    // Create notifications for all admins
    const notificationPromises = admins.map(async (admin: any) => {
        if (admin.id === donorId) return; // Don't notify self
        
        await createNotification({
            user_id: admin.id,
            type: 'announcement',
            title: { key: 'notifications.messages.newDonation', values: { amount: amount.toString() } },
            content: { key: 'notifications.messages.newDonationMessage', values: { 
                donor: donorDisplayName, 
                amount: amount.toString() 
            }},
            data: {
                link: '/moderation', // Link to moderation page instead of specific donation
                actor: donorId ? {
                    id: donorId,
                    name: donorDisplayName
                } : null,
                meta: {
                    kind: 'new-donation',
                    donationId,
                    amount,
                    message: message?.substring(0, 200) || null
                }
            }
        });
    });

    await Promise.all(notificationPromises);
}
