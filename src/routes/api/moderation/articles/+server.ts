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
						username: author.username || null,
						nickname: author.nickname || null,
						role: author.role || null
					});
				}
			}
		}

		const formattedArticles = articles.map((article: any) => {
			const localeText = ensureLocaleText(article);
			const authorId = article.author_id?.toString() ?? '';
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
				hidden: !!article.is_hidden,
				deletedAt: article.deleted_at ?? null
			};
		});

		return json({ articles: formattedArticles });
	} catch (error) {
		console.error('Error fetching moderation articles:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
