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

    // Format the response
    const formattedArticles = pendingArticles.map((article: any) => ({
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
      translations: article.translations
    }));

    return json({ articles: formattedArticles });
  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
