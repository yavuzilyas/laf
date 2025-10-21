import { json } from '@sveltejs/kit';
import { getArticlesCollection } from '$db/mongo';

export async function GET({ url }) {
  try {
    const articles = await getArticlesCollection();

    // Query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category');
    const language = url.searchParams.get('language');
    const tags = url.searchParams.get('tags');

    // Build query
    const query: any = {
      published: true,
      'deletedAt': { $exists: false }
    };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Language filter
    if (language) {
      query.language = language;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await articles.countDocuments(query);

    // Get articles with pagination
    const articleDocs = await articles
      .find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format articles for frontend
    const formattedArticles = articleDocs.map(article => ({
      id: article._id.toString(),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      author: {
        name: article.author?.name || 'Anonim',
        avatar: article.author?.avatar
      },
      publishedAt: article.publishedAt,
      readTime: article.readTime || 5,
      category: article.category,
      subcategory: article.subcategory,
      tags: article.tags || [],
      views: article.stats?.views || 0,
      comments: article.stats?.comments || 0,
      likes: article.stats?.likes || 0,
      dislikes: article.stats?.dislikes || 0,
      featured: article.featured || false,
      coverImage: article.thumbnail,
      language: article.language || 'tr'
    }));

    return json({
      articles: formattedArticles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalArticles: total,
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('Articles API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
