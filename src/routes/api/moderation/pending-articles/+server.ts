import { json } from '@sveltejs/kit';
import { getArticlesCollection, getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function GET({ locals }) {
  const currentUser = locals.user;
  
  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'admin')) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const articlesCollection = await getArticlesCollection();
    
    // Find articles with 'pending' status
    const pendingArticles = await articlesCollection
      .find({ 
        status: 'pending',
        deletedAt: { $exists: false }
      })
      .sort({ createdAt: -1 })
      .toArray();

    const authorIds = Array.from(
      new Set(
        pendingArticles
          .map((article) => article.authorId)
          .filter((id): id is ObjectId => Boolean(id))
      )
    );

    let authorsMap = new Map<string, { fullName: string | null; nickname: string | null }>();

    if (authorIds.length > 0) {
      const usersCollection = await getUsersCollection();
      const authors = await usersCollection
        .find(
          { _id: { $in: authorIds } },
          { projection: { name: 1, surname: 1, nickname: 1 } }
        )
        .toArray();

      for (const author of authors) {
        const fullName = `${author.name || ''} ${author.surname || ''}`.trim();
        authorsMap.set(author._id.toString(), {
          fullName: fullName || null,
          nickname: author.nickname || null
        });
      }
    }

    // Format the response
    const formattedArticles = pendingArticles.map(article => ({
      id: article._id.toString(),
      title: article.translations?.[article.defaultLanguage]?.title || 'Başlıksız',
      authorId: article.authorId?.toString(),
      authorName: authorsMap.get(article.authorId?.toString() || '')?.fullName || null,
      authorNickname: authorsMap.get(article.authorId?.toString() || '')?.nickname || null,
      status: article.status,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: article.category,
      tags: article.tags || [],
      defaultLanguage: article.defaultLanguage,
      translations: article.translations
    }));

    return json({ articles: formattedArticles });
  } catch (error) {
    console.error('Error fetching pending articles:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
