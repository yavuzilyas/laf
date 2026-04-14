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

// Edra JSON content to HTML converter
function edraJsonToHtml(content: unknown): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    
    try {
        const doc = typeof content === 'string' ? JSON.parse(content) : content;
        if (!doc || !Array.isArray(doc.content)) return '';
        return renderEdraNodes(doc.content);
    } catch {
        return String(content);
    }
}

function renderEdraNodes(nodes: any[]): string {
    if (!Array.isArray(nodes)) return '';
    return nodes.map(renderEdraNode).join('');
}

function renderEdraNode(node: any): string {
    if (!node) return '';
    
    switch (node.type) {
        case 'doc':
            return renderEdraNodes(node.content || []);
            
        case 'paragraph':
            const align = node.attrs?.textAlign;
            const style = align ? ` style="text-align: ${align};"` : '';
            return `<p${style}>${renderEdraNodes(node.content || [])}</p>`;
            
        case 'heading':
            const level = node.attrs?.level || 1;
            const hAlign = node.attrs?.textAlign;
            const hStyle = hAlign ? ` style="text-align: ${hAlign};"` : '';
            return `<h${level}${hStyle}>${renderEdraNodes(node.content || [])}</h${level}>`;
            
        case 'text':
            let text = escapeXml(node.text || '');
            if (node.marks) {
                for (const mark of node.marks) {
                    text = renderMark(text, mark);
                }
            }
            return text;
            
        case 'blockquote':
            return `<blockquote>${renderEdraNodes(node.content || [])}</blockquote>`;
            
        case 'orderedList':
            const start = node.attrs?.start || 1;
            const startAttr = start !== 1 ? ` start="${start}"` : '';
            return `<ol${startAttr}>${renderEdraNodes(node.content || [])}</ol>`;
            
        case 'bulletList':
            return `<ul>${renderEdraNodes(node.content || [])}</ul>`;
            
        case 'taskList':
            return `<ul class="task-list">${renderEdraNodes(node.content || [])}</ul>`;
            
        case 'listItem':
            return `<li>${renderEdraNodes(node.content || [])}</li>`;
            
        case 'taskItem':
            const checked = node.attrs?.checked ? ' checked' : '';
            return `<li class="task-item"><input type="checkbox" disabled${checked}> ${renderEdraNodes(node.content || [])}</li>`;
            
        case 'codeBlock':
            const lang = node.attrs?.language || '';
            const codeContent = node.content?.map((n: any) => n.text || '').join('') || '';
            return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeXml(codeContent)}</code></pre>`;
            
        case 'horizontalRule':
            return '<hr>';
            
        case 'hardBreak':
            return '<br>';
            
        case 'image':
            const src = node.attrs?.src || '';
            const alt = node.attrs?.alt || '';
            const width = node.attrs?.width;
            const imgAlign = node.attrs?.align;
            let imgStyle = '';
            if (width) imgStyle += `width: ${width}; `;
            if (imgAlign) imgStyle += `display: block; margin-${imgAlign === 'center' ? 'left: auto; margin-right: auto' : `${imgAlign}: 0`}; `;
            const styleAttr = imgStyle ? ` style="${imgStyle.trim()}"` : '';
            return `<img src="${escapeXml(src)}" alt="${escapeXml(alt)}"${styleAttr}>`;
            
        case 'video':
            const videoSrc = node.attrs?.src || '';
            const vWidth = node.attrs?.width;
            let vStyle = '';
            if (vWidth) vStyle += `width: ${vWidth}; `;
            const vStyleAttr = vStyle ? ` style="${vStyle.trim()}"` : '';
            return `<video src="${escapeXml(videoSrc)}" controls${vStyleAttr}></video>`;
            
        case 'audio':
            const audioSrc = node.attrs?.src || '';
            return `<audio src="${escapeXml(audioSrc)}" controls></audio>`;
            
        case 'iframe':
            const iframeSrc = node.attrs?.src || '';
            const iWidth = node.attrs?.width;
            let iStyle = '';
            if (iWidth) iStyle += `width: ${iWidth}; `;
            const iStyleAttr = iStyle ? ` style="${iStyle.trim()}"` : '';
            return `<iframe src="${escapeXml(iframeSrc)}"${iStyleAttr} frameborder="0" allowfullscreen></iframe>`;
            
        case 'table':
            return `<table>${renderEdraNodes(node.content || [])}</table>`;
            
        case 'tableRow':
            return `<tr>${renderEdraNodes(node.content || [])}</tr>`;
            
        case 'tableCell':
            const colspan = node.attrs?.colspan || 1;
            const rowspan = node.attrs?.rowspan || 1;
            const colAttr = colspan > 1 ? ` colspan="${colspan}"` : '';
            const rowAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
            return `<td${colAttr}${rowAttr}>${renderEdraNodes(node.content || [])}</td>`;
            
        case 'tableHeader':
            const hColspan = node.attrs?.colspan || 1;
            const hRowspan = node.attrs?.rowspan || 1;
            const hColAttr = hColspan > 1 ? ` colspan="${hColspan}"` : '';
            const hRowAttr = hRowspan > 1 ? ` rowspan="${hRowspan}"` : '';
            return `<th${hColAttr}${hRowAttr}>${renderEdraNodes(node.content || [])}</th>`;
            
        case 'inlineMath':
            const latex = node.attrs?.latex || '';
            return `<span class="math">${escapeXml(latex)}</span>`;
            
        case 'image-placeholder':
        case 'video-placeholder':
        case 'audio-placeholder':
        case 'iframe-placeholder':
            return '';
            
        default:
            if (node.content) {
                return renderEdraNodes(node.content);
            }
            return '';
    }
}

function renderMark(text: string, mark: any): string {
    if (!mark) return text;
    
    switch (mark.type) {
        case 'bold':
            return `<strong>${text}</strong>`;
        case 'italic':
            return `<em>${text}</em>`;
        case 'underline':
            return `<u>${text}</u>`;
        case 'strike':
            return `<s>${text}</s>`;
        case 'code':
            return `<code>${text}</code>`;
        case 'link':
            const href = mark.attrs?.href || '';
            const target = mark.attrs?.target || '_blank';
            const rel = mark.attrs?.rel || 'noopener noreferrer';
            return `<a href="${escapeXml(href)}" target="${target}" rel="${rel}">${text}</a>`;
        case 'textStyle':
            const color = mark.attrs?.color;
            const fontSize = mark.attrs?.fontSize;
            if (!color && !fontSize) return text;
            let style = '';
            if (color) style += `color: ${color}; `;
            if (fontSize) style += `font-size: ${fontSize}; `;
            return `<span style="${style.trim()}">${text}</span>`;
        case 'highlight':
            const bgColor = mark.attrs?.color || '#ffff00';
            return `<mark style="background-color: ${bgColor};">${text}</mark>`;
        case 'superscript':
            return `<sup>${text}</sup>`;
        case 'subscript':
            return `<sub>${text}</sub>`;
        default:
            return text;
    }
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
            const contentHtml = edraJsonToHtml(translation.content);
            if (contentHtml) {
                contentEncoded = `    <content:encoded><![CDATA[${contentHtml}]]></content:encoded>\n`;
            }
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
