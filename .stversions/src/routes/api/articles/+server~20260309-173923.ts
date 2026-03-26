import { json } from '@sveltejs/kit';
import { getArticles } from '$db/queries';

export async function GET({ url, locals }: { url: URL; locals: any }) {
  console.log('Articles API called with params:', Object.fromEntries(url.searchParams.entries()));
  
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

    // Build filters
    const filters: any = {
      is_hidden: false
    };

    // Apply status filter based on user role
    const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin';
    
    if (isModeratorOrAdmin) {
      // Moderators and admins can see all articles regardless of status
      filters.status = ['published', 'pending', 'draft'];
    } else {
      // Regular users only see published articles
      filters.status = 'published';
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
      filters.tags = tags.split(',').map((tag: string) => tag.trim());
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
    const payloadArticles = articleDocs.map((article: any) => {
      // Get the default translation or first available translation
      const translations = article.translations || {};
      const defaultLang = article.default_language || 'tr';
      const translation = translations[defaultLang] || Object.values(translations)[0] || {};
      
      return {
        id: article.id,
        slug: translation.slug || article.slug || `article-${article.id}`,
        title: translation.title || article.title || 'No Title',
        excerpt: translation.excerpt || article.excerpt || (article.content ? article.content.substring(0, 200) + '...' : ''),
        content: translation.content || article.content,
        translations: translations,
        language: defaultLang,
        author: {
          id: article.author_id,
          name: article.author_full_name ? `${article.author_full_name} ${article.author_surname || ''}`.trim() : article.author_name || 'Unknown',
          nickname: article.author_nickname,
          username: article.author_name, // This is actually the username from users table
          avatar: article.author_avatar
        },
        publishedAt: article.published_at,
        readTime: Math.ceil((translation.content || article.content || '').length / 1000) || 5,
        tags: article.tags || [],
        views: article.views || 0,
        comments: article.comments_count || 0,
        likes: article.likes_count || 0,
        dislikes: article.dislikes || 0,
        featured: false,
        coverImage: article.thumbnail || null,
        status: article.published_at ? 'published' : 'draft',
        isOwner: user && article.author_id === user.id
      };
    });

    const result = {
      articles: payloadArticles,
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
