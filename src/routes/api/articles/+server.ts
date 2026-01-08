import { json } from '@sveltejs/kit';
import { getArticlesCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function GET({ url, locals }) {
  console.log('Articles API called with params:', Object.fromEntries(url.searchParams.entries()));
  
  try {
    const articles = await getArticlesCollection();
    const user = (locals as any)?.user;

    // Query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5'); // Default to 5 for suggestions
    const search = url.searchParams.get('search') || '';
    
    console.log('Searching for:', { search, page, limit });
    const category = url.searchParams.get('category');
    const language = url.searchParams.get('language');
    const tags = url.searchParams.get('tags');
    const showAll = url.searchParams.get('showAll') === 'true';

    // Build base query
    const query: any = {
      'deletedAt': { $exists: false },
      $or: [
        // Show published articles to everyone
        { status: 'published' },
        // Show pending articles only to their authors
        ...(user ? [
          { 
            status: 'pending',
            authorId: new ObjectId(user.id)
          }
        ] : []),
        // Show drafts only in showAll mode to their authors
        ...(showAll && user ? [
          { 
            status: 'draft',
            authorId: new ObjectId(user.id)
          }
        ] : [])
      ]
    };

    // Enhanced search filter for title, excerpt, content, and tags
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchConditions = [
        { 'translations.tr.title': { $regex: searchRegex } },
        { 'translations.tr.excerpt': { $regex: searchRegex } },
        { 'translations.tr.content': { $regex: searchRegex } },
        { 'translations.en.title': { $regex: searchRegex } },
        { 'translations.en.excerpt': { $regex: searchRegex } },
        { 'translations.en.content': { $regex: searchRegex } },
        { 'tags': { $regex: searchRegex } }
      ];

      if (!query.$or) {
        query.$or = searchConditions;
      } else {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      }
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

    // Log the query for debugging
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Handle field selection
    const fields = url.searchParams.get('fields')?.split(',').reduce((acc, field) => {
      acc[field.trim()] = 1;
      return acc;
    }, {} as Record<string, number>);

    // Get articles with pagination and field selection
    let queryBuilder = articles.find(query);
    
    if (fields) {
      queryBuilder = queryBuilder.project(fields);
    }
    
    const articleDocs = await queryBuilder
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    console.log('Found articles:', articleDocs.length);

    // Format articles for frontend
    const formattedArticles = articleDocs.map(article => ({
      id: article._id.toString(),
      slug: article.slug || `article-${article._id.toString()}`,
      title: article.title || 'No Title',
      excerpt: article.excerpt,
      content: article.content,
      author: {
        id: article.authorId?.toString(),
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
      language: article.language || 'tr',
      status: article.status || 'published',
      isOwner: user && article.authorId?.toString() === user.id
    }));

    const result = {
      articles: formattedArticles,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
    console.log('Returning result:', JSON.stringify(result, null, 2));
    return json(result);

  } catch (error) {
    console.error('Articles API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
