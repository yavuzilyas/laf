import { json } from '@sveltejs/kit';
import { getArticles, getUsers } from '$db/queries';

export async function GET({ locals }) {
  const currentUser = (locals as any).user;
  
  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Find articles with 'pending' status
    const pendingArticles = await getArticles({
      status: 'pending',
      sort_by: 'created_at'
    });

    const authorIds = Array.from(
      new Set(
        pendingArticles
          .map((article: any) => article.author_id)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    let authorsMap = new Map<string, { fullName: string | null; nickname: string | null }>();

    if (authorIds.length > 0) {
      for (const authorId of authorIds) {
        const authorData = await getUsers({ id: authorId });
        const author = authorData[0];
        if (author) {
          const fullName = `${author.name || ''} ${author.surname || ''}`.trim();
          authorsMap.set(author.id, {
            fullName: fullName || null,
            nickname: author.nickname || null
          });
        }
      }
    }

    // Get unique hidden_by IDs for reviewer info
    const hiddenByIds = Array.from(
      new Set(
        pendingArticles
          .map((article: any) => article.hidden_by || article.hiddenBy)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    // Also get reviewer IDs from pending_review (for approve/reject actions)
    const pendingReviewIds = Array.from(
      new Set(
        pendingArticles
          .map((article: any) => article.pending_review?.reviewerId || article.pendingReview?.reviewerId)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    // Get moderator IDs from metadata.moderationAction (for unhide actions)
    const moderationActionIds = Array.from(
      new Set(
        pendingArticles
          .map((article: any) => article.metadata?.moderationAction?.moderatorId)
          .filter((id: any): id is string => Boolean(id))
      )
    );

    // Combine all reviewer IDs
    const allReviewerIds = [...new Set([...hiddenByIds, ...pendingReviewIds, ...moderationActionIds])];

    // Fetch reviewer info for hidden articles and pending reviews
    const reviewersMap = new Map<
      string,
      { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null }
    >();

    if (allReviewerIds.length > 0) {
      for (const reviewerId of allReviewerIds) {
        const reviewerData = await getUsers({ id: reviewerId });
        const reviewer = reviewerData[0];
        if (reviewer) {
          reviewersMap.set(reviewer.id, {
            id: reviewer.id,
            username: reviewer.username || null,
            nickname: reviewer.nickname || null,
            name: reviewer.name || null,
            surname: reviewer.surname || null,
            role: reviewer.role || null
          });
        }
      }
    }

    // Format the response
    const formattedArticles = pendingArticles.map((article: any) => {
      const hiddenById = (article.hidden_by || article.hiddenBy)?.toString() ?? '';
      const pendingReviewerId = (article.pending_review?.reviewerId || article.pendingReview?.reviewerId)?.toString() ?? '';
      // Check for unhide action in metadata
      const moderationAction = article.metadata?.moderationAction;
      const isUnhidden = moderationAction?.action === 'unhidden';
      const unhideModeratorId = isUnhidden ? moderationAction?.moderatorId?.toString() : '';
      
      // Determine reviewer ID: prioritize hidden_by, then unhide moderator, then pending_review
      let reviewerId = hiddenById || pendingReviewerId;
      let actionType = hiddenById ? 'İşlem yapan' : (pendingReviewerId ? 'İnceleyen' : null);
      let reviewDate = article.hidden_at || article.hiddenAt || article.pending_review?.reviewedAt || article.pendingReview?.reviewedAt || null;
      
      // If article is not hidden and was unhidden, show unhide moderator
      if (!hiddenById && isUnhidden && unhideModeratorId) {
        reviewerId = unhideModeratorId;
        actionType = 'Görünür yapan';
        reviewDate = moderationAction?.timestamp || null;
      }
      
      const reviewer = reviewerId ? reviewersMap.get(reviewerId) : null;
      return {
        id: article.id,
        title: article.translations?.[article.default_language]?.title || 'Başlıksız',
        authorId: article.author_id?.toString(),
        authorName: authorsMap.get(article.author_id?.toString() || '')?.fullName || null,
        authorNickname: authorsMap.get(article.author_id?.toString() || '')?.nickname || null,
        status: article.status,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        category: article.category,
        tags: article.tags || [],
        defaultLanguage: article.default_language,
        translations: article.translations,
        hidden: !!(article.is_hidden || article.isHidden),
        deletedAt: article.deleted_at ?? null,
        reviewedBy: reviewer ? {
          id: reviewer.id,
          username: reviewer.username,
          nickname: reviewer.nickname,
          name: reviewer.name,
          surname: reviewer.surname,
          role: reviewer.role
        } : null,
        reviewedAt: reviewDate,
        lastActionType: actionType
      };
    });

    return json({ articles: formattedArticles });
  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
