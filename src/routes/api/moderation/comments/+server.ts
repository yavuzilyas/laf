import { json } from '@sveltejs/kit';
import { getComments, getUsers, getArticles, updateComment } from '$db/queries';

const MAX_COMMENTS = 300;

export async function GET({ locals, url }) {
	const currentUser = (locals as any).user;

	if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const statusFilter = url.searchParams.get('status');
	const filters: Record<string, any> = {
		limit: MAX_COMMENTS,
		sort_by: 'created_at'
	};

	try {
		const comments = await getComments(filters);

		// Get unique author and article IDs
		const authorIds = Array.from(
			new Set(
				comments
					.map((comment: any) => comment.author_id)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		const articleIds = Array.from(
			new Set(
				comments
					.map((comment: any) => comment.article_id)
					.filter((id: any): id is string => Boolean(id))
			)
		);

		// Fetch authors
		const authorsMap = new Map<
			string,
			{ fullName: string | null; nickname: string | null; role: string | null }
		>();

		if (authorIds.length > 0) {
			for (const authorId of authorIds) {
				const authorData = await getUsers({ id: authorId });
				const author = authorData[0];
				if (author) {
					const fullName = `${author.name || ''} ${author.surname || ''}`.trim();
					authorsMap.set(author.id, {
						fullName: fullName || null,
						nickname: author.nickname || null,
						role: author.role || null
					});
				}
			}
		}

		// Fetch articles
		const articlesMap = new Map<
			string,
			{ title: string | null; slug: string | null }
		>();

		if (articleIds.length > 0) {
			for (const articleId of articleIds) {
				const articleData = await getArticles({ id: articleId });
				const article = articleData[0];
				if (article) {
					const translations = article.translations || {};
					const defaultLang = article.default_language;
					const primary = defaultLang && translations[defaultLang]
						? translations[defaultLang]
						: Object.keys(translations).length > 0
							? translations[Object.keys(translations)[0]]
							: null;

					articlesMap.set(article.id, {
						title: primary?.title || article.title || 'Başlıksız',
						slug: primary?.slug || article.slug || null
					});
				}
			}
		}

		// Format comments
		let formattedComments = comments.map((comment: any) => {
			const authorId = comment.author_id?.toString() ?? '';
			const articleId = comment.article_id?.toString() ?? '';
			const author = authorsMap.get(authorId);
			const article = articlesMap.get(articleId);

			// Determine status
			let status = 'active';
			if (comment.deleted_at) {
				status = 'deleted';
			} else if (comment.hidden) {
				status = 'hidden';
			}

			return {
				id: comment.id,
				content: comment.content ?? '',
				authorId: authorId || null,
				authorName: author?.fullName ?? null,
				authorNickname: author?.nickname ?? null,
				authorRole: author?.role ?? null,
				articleId: articleId || null,
				articleTitle: article?.title ?? null,
				articleSlug: article?.slug ?? null,
				parentId: comment.parent_id ?? null,
				status,
				hidden: !!comment.hidden,
				deletedAt: comment.deleted_at ?? null,
				createdAt: comment.created_at ?? null,
				updatedAt: comment.updated_at ?? null
			};
		});

		// Apply status filter
		if (statusFilter && statusFilter !== 'all') {
			formattedComments = formattedComments.filter(
				(c: any) => c.status === statusFilter
			);
		}

		return json({ comments: formattedComments });
	} catch (error) {
		console.error('Error fetching comments:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	const user = (locals as any)?.user;

	if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { action, id } = await request.json();

	if (!action || !id) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const moderatorId = user.id;
	const targetId = id;

	try {
		if (action === 'hide') {
			await updateComment(targetId, {
				hidden: true,
				hidden_by: moderatorId
			});
		} else if (action === 'unhide') {
			await updateComment(targetId, {
				hidden: false,
				hidden_by: null
			});
		} else if (action === 'delete') {
			await updateComment(targetId, {
				deleted_at: new Date()
			});
		} else {
			return json({ error: 'Invalid action' }, { status: 400 });
		}

		return json({ success: true, message: 'Action completed' });
	} catch (error) {
		console.error('Error performing comment moderation:', error);
		return json({ error: 'Failed to perform action' }, { status: 500 });
	}
}
