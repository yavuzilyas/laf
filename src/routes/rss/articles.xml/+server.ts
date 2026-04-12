import type { RequestHandler } from './$types';
import { getArticles } from '$db/queries';

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

export const GET: RequestHandler = async ({ url }) => {
    const baseUrl = 'https://laf.international';
    const lang = url.searchParams.get('lang') || 'tr';
    
    // Get published articles
    const articles = await getArticles({ 
        status: 'published', 
        is_hidden: false, 
        limit: 50,
        sort_by: 'published_at'
    });
    
    const feedTitle = lang === 'en' ? 'LAF Articles' : 'LAF Makaleler';
    const feedDescription = lang === 'en' 
        ? 'Latest libertarian anarchism articles from LAF' 
        : 'LAF\'ten en son liberter anarşizm makaleleri';
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${baseUrl}/${lang}/articles</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/articles.xml?lang=${lang}" rel="self" type="application/rss+xml" />
    <image>
        <url>${baseUrl}/favicon.png</url>
        <title>${escapeXml(feedTitle)}</title>
        <link>${baseUrl}/${lang}/articles</link>
    </image>
`;

    for (const article of articles) {
        if (!article.translations) continue;
        
        // Get translation for requested language, fallback to default
        const translation = article.translations[lang] || article.translations[article.default_language] || Object.values(article.translations)[0];
        if (!translation || !translation.slug) continue;
        
        const articleUrl = `${baseUrl}/${lang}/article/${translation.slug}`;
        const title = escapeXml(translation.title || 'Untitled');
        const excerpt = escapeXml(stripHtml(translation.excerpt || ''));
        
        // Get author name
        let authorName = 'LAF';
        if (article.author_full_name) {
            authorName = `${article.author_full_name} ${article.author_surname || ''}`.trim();
        } else if (article.author_nickname) {
            authorName = article.author_nickname;
        } else if (article.author_name) {
            authorName = article.author_name;
        }
        
        const pubDate = article.published_at 
            ? new Date(article.published_at).toUTCString()
            : new Date(article.created_at).toUTCString();
        
        // Build categories/tags
        let categoriesXml = '';
        if (article.category) {
            categoriesXml += `    <category>${escapeXml(article.category)}</category>\n`;
        }
        if (article.tags && Array.isArray(article.tags)) {
            for (const tag of article.tags) {
                categoriesXml += `    <category>${escapeXml(tag)}</category>\n`;
            }
        }
        
        // Build content if available
        let contentEncoded = '';
        if (translation.content) {
            const contentHtml = typeof translation.content === 'string' 
                ? translation.content 
                : JSON.stringify(translation.content);
            contentEncoded = `    <content:encoded><![CDATA[${contentHtml}]]></content:encoded>\n`;
        }
        
        rss += `    <item>
        <title>${title}</title>
        <link>${articleUrl}</link>
        <guid isPermaLink="true">${articleUrl}</guid>
        <pubDate>${pubDate}</pubDate>
        <author>${escapeXml(authorName)}</author>
        <description>${excerpt || '...'}</description>
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
