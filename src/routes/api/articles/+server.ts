import { json } from '@sveltejs/kit';
import { getArticles } from '$db/queries';

export async function GET({ url, locals }) {
  
  try {
    const user = (locals as any)?.user;

    // Query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category');
    const language = url.searchParams.get('language');
    const tags = url.searchParams.get('tags');
    const showAll = url.searchParams.get('showAll') === 'true';

    // Check user permissions
    const isAdmin = user?.role === 'admin';
    const isModerator = user?.role === 'moderator';
    const canSeeAllArticles = isAdmin || isModerator || showAll;

    // Build filters
    const filters: any = {
      is_hidden: false
    };

    // Only show published articles for non-privileged users
    if (!canSeeAllArticles) {
      // Allow users to see their own articles regardless of status
      if (user?.id) {
        filters.$or = [
          { status: 'published' },
          { author_id: user.id }
        ];
      } else {
        // For non-logged in users, only show published articles
        filters.status = 'published';
      }
    }

    // Search filter
    if (search) {
      // Note: For full-text search, you might want to add PostgreSQL's full-text search
      filters.search = search;
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Language filter
    if (language) {
      filters.language = language;
    }

    // Tags filter
    if (tags) {
      filters.tags = tags.split(',').map(tag => tag.trim());
    }

    // Pagination
    const offset = (page - 1) * limit;
    filters.limit = limit;
    filters.offset = offset;

    // Get articles
    const articleDocs = await getArticles(filters);
    
    // For now, we'll simulate total count - in a real app you'd add a count function
    const total = articleDocs.length >= limit ? null : articleDocs.length;

    // Transform articles for response
    const payloadArticles = articleDocs.map(article => ({
      id: article.id,
      _id: article.id,
      slug: article.slug || `article-${article.id}`,
      title: article.title,
      excerpt: article.content?.substring(0, 200) + '...' || '',
      content: article.content,
      translations: article.translations || {},
      author: {
        id: article.author_id,
        name: article.author_name || article.author_nickname || 'Unknown',
        avatar: article.author_avatar
      },
      authorId: article.author_id,
      author_name: article.author_name,
      author_avatar: article.author_avatar,
      author_nickname: article.author_nickname,
      publishedAt: article.published_at,
      published_at: article.published_at,
      readTime: Math.ceil(article.content?.length / 1000) || 5,
      tags: article.tags || [],
      views: article.views || 0,
      comments: article.comments_count || 0,
      likes: article.likes_count || 0,
      dislikes: 0,
      featured: false,
      coverImage: article.thumbnail || null,
      language: article.default_language || language || 'tr',
      default_language: article.default_language,
      status: article.published_at ? 'published' : 'draft',
      isOwner: user && article.author_id === user.id,
      is_hidden: article.is_hidden,
      category: article.category,
      subcategory: article.subcategory
    }));

    const result = {
      articles: payloadArticles,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
    return json(result);

  } catch (error) {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
