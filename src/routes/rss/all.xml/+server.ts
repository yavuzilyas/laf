import type { RequestHandler } from './$types';
import { getArticles } from '$db/queries';
import { query } from '$db/pg';

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

interface FeedItem {
    type: 'article' | 'qa';
    title: string;
    url: string;
    slug: string;
    pubDate: Date;
    author: string;
    description: string;
    content?: string;
    categories: string[];
}

export const GET: RequestHandler = async ({ url }) => {
    const baseUrl = 'https://laf.international';
    const lang = url.searchParams.get('lang') || 'tr';
    const limit = 50;
    
    const items: FeedItem[] = [];
    
    // Get articles
    const articles = await getArticles({ 
        status: 'published', 
        is_hidden: false, 
        limit: 30,
        sort_by: 'published_at'
    });
    
    for (const article of articles) {
        if (!article.translations) continue;
        
        const translation = article.translations[lang] || article.translations[article.default_language] || Object.values(article.translations)[0];
        if (!translation || !translation.slug) continue;
        
        let authorName = 'LAF';
        if (article.author_full_name) {
            authorName = `${article.author_full_name} ${article.author_surname || ''}`.trim();
        } else if (article.author_nickname) {
            authorName = article.author_nickname;
        } else if (article.author_name) {
            authorName = article.author_name;
        }
        
        const categories = [];
        if (article.category) categories.push(article.category);
        if (article.tags && Array.isArray(article.tags)) {
            categories.push(...article.tags);
        }
        
        let content = '';
        if (translation.content) {
            content = typeof translation.content === 'string' 
                ? translation.content 
                : JSON.stringify(translation.content);
        }
        
        items.push({
            type: 'article',
            title: translation.title || 'Untitled',
            url: `${baseUrl}/${lang}/article/${translation.slug}`,
            slug: translation.slug,
            pubDate: new Date(article.published_at || article.created_at),
            author: authorName,
            description: stripHtml(translation.excerpt || ''),
            content,
            categories
        });
    }
    
    // Get QA questions
    const qaResult = await query(`
        SELECT 
            q.id,
            q.title,
            q.slug,
            q.content_html,
            q.is_anonymous,
            q.author_name,
            q.created_at,
            q.published_at,
            t.name as topic_name,
            u.username as author_username,
            u.nickname as author_nickname,
            a.content_html as answer_content_html,
            au.nickname as answer_author_nickname
        FROM questions q
        LEFT JOIN question_topics t ON q.topic_id = t.id
        LEFT JOIN users u ON q.author_id = u.id
        LEFT JOIN answers a ON q.answer_id = a.id
        LEFT JOIN users au ON a.author_id = au.id
        WHERE q.status = 'published'
        ORDER BY q.created_at DESC
        LIMIT 30
    `);
    
    for (const row of qaResult.rows) {
        let authorName = 'Anonim';
        if (!row.is_anonymous) {
            if (row.author_nickname) {
                authorName = row.author_nickname;
            } else if (row.author_username) {
                authorName = row.author_username;
            } else if (row.author_name) {
                authorName = row.author_name;
            }
        }
        
        let description = stripHtml(row.content_html || '');
        if (description.length > 300) {
            description = description.substring(0, 300).trim() + '...';
        }
        
        let content = `<h3>Soru</h3>\n${row.content_html || ''}`;
        if (row.answer_content_html) {
            const answerAuthor = row.answer_author_nickname || 'Moderatör';
            content += `\n\n<h3>Cevap (${answerAuthor})</h3>\n${row.answer_content_html}`;
        }
        
        const categories = ['Soru & Cevap'];
        if (row.topic_name) categories.push(row.topic_name);
        
        items.push({
            type: 'qa',
            title: row.title || 'Sorularla Ancap',
            url: `${baseUrl}/${lang}/qa/${row.slug}`,
            slug: row.slug,
            pubDate: new Date(row.published_at || row.created_at),
            author: authorName,
            description,
            content,
            categories
        });
    }
    
    // Sort by date (newest first) and limit
    items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    const limitedItems = items.slice(0, limit);
    
    const feedTitle = lang === 'en' ? 'LAF - All Content' : 'LAF - Tüm İçerikler';
    const feedDescription = lang === 'en' 
        ? 'Latest articles and Q&A from LAF' 
        : 'LAF\'ten en son makaleler ve soru-cevaplar';
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${baseUrl}/${lang}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/all.xml?lang=${lang}" rel="self" type="application/rss+xml" />
    <image>
        <url>${baseUrl}/favicon.png</url>
        <title>${escapeXml(feedTitle)}</title>
        <link>${baseUrl}/${lang}</link>
    </image>
`;

    for (const item of limitedItems) {
        const title = escapeXml(item.title);
        const description = escapeXml(item.description.length > 300 
            ? item.description.substring(0, 300).trim() + '...' 
            : item.description || '...'
        );
        
        let categoriesXml = '';
        for (const cat of item.categories) {
            categoriesXml += `    <category>${escapeXml(cat)}</category>\n`;
        }
        
        let contentEncoded = '';
        if (item.content) {
            contentEncoded = `    <content:encoded><![CDATA[${item.content}]]></content:encoded>\n`;
        }
        
        rss += `    <item>
        <title>${title}</title>
        <link>${item.url}</link>
        <guid isPermaLink="true">${item.url}</guid>
        <pubDate>${item.pubDate.toUTCString()}</pubDate>
        <author>${escapeXml(item.author)}</author>
        <description>${description}</description>
${contentEncoded}${categoriesXml}    </item>
`;
    }

    rss += `</channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800'
        }
    });
};
