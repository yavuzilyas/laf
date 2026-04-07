import type { RequestHandler } from './$types';
import { getArticles, getUsers } from '$db/queries';

export const GET: RequestHandler = async ({ url }) => {
  const baseUrl = 'https://laf.dev';
  const languages = ['en', 'tr'];
  
  // Get dynamic content
  const articles = await getArticles({ status: 'published', is_hidden: false, limit: 1000 });
  const users = await getUsers({ limit: 1000 });
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'articles', priority: '0.9', changefreq: 'daily' },
    { path: 'events', priority: '0.8', changefreq: 'daily' },
    { path: 'links', priority: '0.6', changefreq: 'weekly' },
    { path: 'help', priority: '0.5', changefreq: 'monthly' },
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  // Add static pages for each language
  for (const lang of languages) {
    for (const page of staticPages) {
      const pageUrl = page.path ? `${baseUrl}/${lang}/${page.path}` : `${baseUrl}/${lang}`;
      const lastmod = new Date().toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
`;
      
      // Add alternate language links
      for (const altLang of languages) {
        const altUrl = page.path ? `${baseUrl}/${altLang}/${page.path}` : `${baseUrl}/${altLang}`;
        sitemap += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />
`;
      }
      
      sitemap += `  </url>
`;
    }
  }

  // Add article pages
  for (const article of articles) {
    if (!article.translations) continue;
    
    for (const [lang, translation] of Object.entries(article.translations)) {
      if (!translation.slug) continue;
      
      const articleUrl = `${baseUrl}/${lang}/article/${translation.slug}`;
      const lastmod = article.updated_at 
        ? new Date(article.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
`;
      
      // Add alternate language links for this article
      for (const [altLang, altTrans] of Object.entries(article.translations)) {
        if (altTrans.slug) {
          const altUrl = `${baseUrl}/${altLang}/article/${altTrans.slug}`;
          sitemap += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />
`;
        }
      }
      
      sitemap += `  </url>
`;
    }
  }

  // Add user profile pages
  for (const user of users) {
    if (!user.nickname) continue;
    
    for (const lang of languages) {
      const profileUrl = `${baseUrl}/${lang}/${user.nickname}`;
      const lastmod = user.updated_at 
        ? new Date(user.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      sitemap += `  <url>
    <loc>${profileUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }
  }

  sitemap += '</urlset>';

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
