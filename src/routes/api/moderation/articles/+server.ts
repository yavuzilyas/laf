import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';

const MAX_ARTICLES = 300;

const ensureLocaleText = (article: any) => {
	const languages = Object.keys(article?.translations ?? {});
	const primary = article?.defaultLanguage && article.translations?.[article.defaultLanguage]
		? article.translations[article.defaultLanguage]
		: languages.length > 0
			? article.translations?.[languages[0]]
			: null;

	return primary ?? { title: article?.title ?? 'Başlıksız', slug: article?.slug };
};

export async function GET({ locals, url }) {
	const currentUser = locals.user;

	if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const statusFilter = url.searchParams.get('status');
	const match: Record<string, unknown> = {
		deletedAt: { $exists: false }
	};

	if (statusFilter && statusFilter !== 'all') {
		match.status = statusFilter;
	}

	try {
		const articlesCollection = await getArticlesCollection();
		const articles = await articlesCollection
			.find(match)
			.sort({ createdAt: -1 })
			.limit(MAX_ARTICLES)
			.toArray();

		const authorIds = Array.from(
			new Set(
				articles
					.map((article) => article.authorId)
					.filter((id): id is ObjectId => Boolean(id))
			)
		);

		const authorsMap = new Map<
			string,
			{ fullName: string | null; nickname: string | null; role: string | null }
		>();

		if (authorIds.length > 0) {
			const usersCollection = await getUsersCollection();
			const authors = await usersCollection
				.find(
					{ _id: { $in: authorIds } },
					{ projection: { name: 1, surname: 1, nickname: 1, role: 1 } }
				)
				.toArray();

			for (const author of authors) {
				const fullName = `${author.name || ''} ${author.surname || ''}`.trim();
				authorsMap.set(author._id.toString(), {
					fullName: fullName || null,
					nickname: author.nickname || null,
					role: author.role || null
				});
			}
		}

		const formattedArticles = articles.map((article) => {
			const localeText = ensureLocaleText(article);
			const authorId = article.authorId?.toString() ?? '';
			return {
				id: article._id.toString(),
				title: localeText?.title ?? 'Başlıksız',
				slug: localeText?.slug ?? article.slug ?? null,
				authorId,
				authorName: authorsMap.get(authorId)?.fullName ?? null,
				authorNickname: authorsMap.get(authorId)?.nickname ?? null,
				authorRole: authorsMap.get(authorId)?.role ?? null,
				status: article.status ?? 'draft',
				category: article.category ?? null,
				tags: Array.isArray(article.tags) ? article.tags : [],
				defaultLanguage: article.defaultLanguage ?? null,
				language: article.defaultLanguage ?? (localeText?.language ?? null),
				createdAt: article.createdAt ?? null,
				updatedAt: article.updatedAt ?? null,
				hidden: !!article.hidden,
				deletedAt: article.deletedAt ?? null
			};
		});

		return json({ articles: formattedArticles });
	} catch (error) {
		console.error('Error fetching moderation articles:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
