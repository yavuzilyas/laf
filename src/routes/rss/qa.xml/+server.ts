import type { RequestHandler } from './$types';
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

export const GET: RequestHandler = async ({ url }) => {
    const baseUrl = 'https://laf.international';
    const lang = url.searchParams.get('lang') || 'tr';
    const limit = 50;
    
    // Get published questions with answers
    const result = await query(`
        SELECT 
            q.id,
            q.title,
            q.slug,
            q.content_html,
            q.status,
            q.is_anonymous,
            q.author_name,
            q.created_at,
            q.published_at,
            q.view_count,
            q.like_count,
            t.name as topic_name,
            t.slug as topic_slug,
            u.username as author_username,
            u.nickname as author_nickname,
            a.content_html as answer_content_html,
            a.created_at as answer_created_at,
            au.nickname as answer_author_nickname
        FROM questions q
        LEFT JOIN question_topics t ON q.topic_id = t.id
        LEFT JOIN users u ON q.author_id = u.id
        LEFT JOIN answers a ON q.answer_id = a.id
        LEFT JOIN users au ON a.author_id = au.id
        WHERE q.status = 'published'
        ORDER BY q.created_at DESC
        LIMIT $1
    `, [limit]);
    
    const feedTitle = lang === 'en' ? 'LAF Q&A' : 'LAF Soru & Cevap';
    const feedDescription = lang === 'en' 
        ? 'Latest questions and answers from LAF Q&A platform' 
        : 'LAF Soru & Cevap platformundan en son sorular ve cevaplar';
    
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${baseUrl}/${lang}/qa</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/qa.xml?lang=${lang}" rel="self" type="application/rss+xml" />
    <image>
        <url>${baseUrl}/favicon.png</url>
        <title>${escapeXml(feedTitle)}</title>
        <link>${baseUrl}/${lang}/qa</link>
    </image>
`;

    for (const row of result.rows) {
        const questionUrl = `${baseUrl}/${lang}/qa/${row.slug}`;
        const title = escapeXml(row.title || 'Sorularla Ancap');
        
        // Get author name
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
        
        const pubDate = row.published_at 
            ? new Date(row.published_at).toUTCString()
            : new Date(row.created_at).toUTCString();
        
        // Build description
        let description = stripHtml(row.content_html || '');
        if (description.length > 300) {
            description = description.substring(0, 300).trim() + '...';
        }
        description = escapeXml(description);
        
        // Build content with question and answer
        let contentEncoded = '';
        let fullContent = `<h3>Soru</h3>\n${row.content_html || ''}`;
        
        if (row.answer_content_html) {
            const answerAuthor = row.answer_author_nickname || 'Moderatör';
            fullContent += `\n\n<h3>Cevap (${escapeXml(answerAuthor)})</h3>\n${row.answer_content_html}`;
        }
        
        contentEncoded = `    <content:encoded><![CDATA[${fullContent}]]></content:encoded>\n`;
        
        // Category (topic)
        let categoryXml = '';
        if (row.topic_name) {
            categoryXml = `    <category>${escapeXml(row.topic_name)}</category>\n`;
        }
        
        rss += `    <item>
        <title>${title}</title>
        <link>${questionUrl}</link>
        <guid isPermaLink="true">${questionUrl}</guid>
        <pubDate>${pubDate}</pubDate>
        <author>${escapeXml(authorName)}</author>
        <description>${description || '...'}</description>
${contentEncoded}${categoryXml}    </item>
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
