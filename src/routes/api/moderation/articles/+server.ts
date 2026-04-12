import { json } from '@sveltejs/kit';
import { getArticles, getUsers } from '$db/queries';

const MAX_ARTICLES = 300;

const ensureLocaleText = (article: any) => {
	const languages = Object.keys(article?.translations ?? {});
	const primary = article?.default_language && article.translations?.[article.default_language]
		? article.translations[article.default_language]
		: languages.length > 0
			? article.translations?.[languages[0]]
			: null;

	return primary ?? { title: article?.title ?? 'Başlıksız', slug: article?.slug };
};

export async function GET({ locals, url }) {
	const currentUser = (locals as any).user;

	if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const statusFilter = url.searchParams.get('status');
	const filters: Record<string, any> = {
		limit: MAX_ARTICLES,
		sort_by: 'created_at'
	};

	if (statusFilter && statusFilter !== 'all') {
		filters.status = statusFilter;
	}

	try {
		const articles = await getArticles(filters);

		const authorIds = Array.from(
			new Set(
				articles
					.map((article: any) => article.author_id)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		// Get unique hidden_by IDs for reviewer info (support both snake_case and camelCase)
		const hiddenByIds = Array.from(
			new Set(
				articles
					.map((article: any) => article.hidden_by || article.hiddenBy)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		// Also get reviewer IDs from pending_review (for approve/reject actions)
		const pendingReviewIds = Array.from(
			new Set(
				articles
					.map((article: any) => article.pending_review?.reviewerId || article.pendingReview?.reviewerId)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		// Get moderator IDs from metadata.moderationAction (for unhide actions)
		const moderationActionIds = Array.from(
			new Set(
				articles
					.map((article: any) => article.metadata?.moderationAction?.moderatorId)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		// Combine all reviewer IDs
		const allReviewerIds = [...new Set([...hiddenByIds, ...pendingReviewIds, ...moderationActionIds])];

		const authorsMap = new Map<
			string,
			{ fullName: string | null; username: string | null; nickname: string | null; role: string | null }
		>();

		const reviewersMap = new Map<
			string,
			{ id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null }
		>();

		if (authorIds.length > 0) {
			for (const authorId of authorIds) {
				const authorData = await getUsers({ id: authorId });
				const author = authorData[0];
				if (author) {
					const fullName = `${author.name || ''} ${author.surname || ''}`.trim();
					authorsMap.set(author.id, {
						fullName: fullName || null,
						username: author.username || null,
						nickname: author.nickname || null,
						role: author.role || null
					});
				}
			}
		}

		// Fetch reviewer info for hidden articles and pending reviews
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

		const formattedArticles = articles.map((article: any) => {
			const localeText = ensureLocaleText(article);
			const authorId = article.author_id?.toString() ?? '';
			// Support both snake_case and camelCase property names
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
				title: localeText?.title ?? 'Başlıksız',
				slug: localeText?.slug ?? article.slug ?? null,
				authorId,
				authorName: authorsMap.get(authorId)?.username ?? null,
				authorFullName: authorsMap.get(authorId)?.fullName ?? null,
				authorNickname: authorsMap.get(authorId)?.nickname ?? null,
				authorRole: authorsMap.get(authorId)?.role ?? null,
				status: article.status ?? 'draft',
				category: article.category ?? null,
				tags: Array.isArray(article.tags) ? article.tags : [],
				defaultLanguage: article.default_language ?? null,
				language: article.default_language ?? (localeText?.language ?? null),
				createdAt: article.created_at ?? null,
				updatedAt: article.updated_at ?? null,
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
