// src/routes/api/articles/save/+server.ts
import { json } from '@sveltejs/kit';
import { getArticles, createArticle, updateArticle, getArticleById, getUsers, upsertDraft, createVersion, countVersions, deleteDraft } from '$db/queries';
import { slugify } from '$lib/utils/slugify';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { notifyNewArticle, notifyModeratorsNewArticle } from '$lib/server/notifications-pg';

// Rate limiting storage for article creation
const articleRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Spam detection patterns for articles - RELAXED
const articleSpamPatterns = [
  /\b(buy|sell|discount|offer|deal|urgent|act fast|limited time|click here now|order now|call now)\b/gi,
  /\b(viagra|cialis|casino|poker|bet|gambling|lottery|crypto investment|earn money fast|make money quick)\b/gi,
  /\b(weight loss pill|diet pill|fat burn|slim fast|miracle cure|guaranteed results)\b/gi,
  /([a-zA-Z])\1{4,}/g, // 5+ Repeated characters (was 4)
];

const profanityList = [
  'fuck', 'shit', 'cunt', 'dick', 'pussy'
];

function checkArticleRateLimit(userId: string, limit: number = 3, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const key = `article:${userId}`;
  const record = articleRateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    articleRateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

function detectArticleSpam(article: any): { isSpam: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check all translations for spam
  const translations = article.translations || {};
  for (const [lang, translation] of Object.entries(translations)) {
    if (typeof translation !== 'object' || !translation) continue;
    
    let titleText = translation.title || '';
    let excerptText = translation.excerpt || '';
    let contentText = '';
    
    // Extract text from TipTap JSON content
    if (translation.content) {
      contentText = extractTextFromContent(translation.content);
    }
    
    const combinedText = `${titleText} ${excerptText} ${contentText}`.toLowerCase();
    
    // Check for spam patterns
    for (const pattern of articleSpamPatterns) {
      if (pattern.test(combinedText)) {
        reasons.push('Contains spam keywords');
        break;
      }
    }
    
    // Check for profanity
    for (const word of profanityList) {
      if (combinedText.includes(word)) {
        reasons.push('Contains inappropriate language');
        break;
      }
    }
    
    // Check length limits - RELAXED for drafts
    if (titleText.length > 0 && titleText.length < 3) {
      reasons.push('Title too short');
    } else if (titleText.length > 300) {
      reasons.push('Title too long');
    }
    
    // Only enforce content length for substantial articles (not drafts with just images)
    if (contentText.length > 10000) {
      reasons.push('Content too long');
    }
    
    // Check for excessive repetition (only for longer content)
    const words = contentText.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 50) {
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      if (uniqueWords.size < words.length * 0.3) {
        reasons.push('Excessive repetition');
      }
    }
    
    // Check for too many URLs (only flag if > 10)
    const urlMatches = combinedText.match(/https?:\/\/[^\s]+/g) || [];
    if (urlMatches.length > 10) {
      reasons.push('Too many URLs');
    }
    
    // If we found spam, no need to check other translations
    if (reasons.length > 0) break;
  }
  
  return {
    isSpam: reasons.length > 0,
    reasons
  };
}

function extractTextFromContent(content: any): string {
  if (!content || typeof content !== 'object') return '';
  
  let text = '';
  
  function traverse(node: any) {
    if (typeof node === 'string') {
      text += node + ' ';
    } else if (node && typeof node === 'object') {
      if (node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
  }
  
  traverse(content);
  return text.trim();
}

export async function POST({ request, locals }) {
    const user = (locals as any)?.user;
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

type JSONContent = {
    type?: string;
    attrs?: Record<string, any>;
    content?: JSONContent[];
    [key: string]: any;
};

function extractMediaUrlsFromContent(content: unknown, target: Set<string>) {
    if (!content) return;

    let normalized: JSONContent | JSONContent[] | null = null;
    if (typeof content === 'string') {
        try {
            normalized = JSON.parse(content);
        } catch {
            normalized = null;
        }
    } else {
        normalized = content as JSONContent | JSONContent[];
    }

    if (!normalized) return;

    if (Array.isArray(normalized)) {
        for (const node of normalized) {
            extractMediaUrlsFromContent(node, target);
        }
        return;
    }

    const node = normalized as JSONContent;
    const src = node?.attrs?.src;
    if (typeof src === 'string') {
        target.add(src);
    }

    const contentNodes = node?.content;
    if (Array.isArray(contentNodes)) {
        for (const child of contentNodes) {
            extractMediaUrlsFromContent(child, target);
        }
    }
}

function collectArticleMediaUrls(article: any): Set<string> {
    const urls = new Set<string>();
    if (!article) return urls;

    if (article.thumbnail && typeof article.thumbnail === 'string') {
        urls.add(article.thumbnail);
    }

    const translations = article.translations || {};
    for (const translation of Object.values<any>(translations)) {
        extractMediaUrlsFromContent(translation?.content, urls);
    }

    return urls;
}

async function cleanupUnusedMedia(existing: any, updated: any, articleId: string) {
    if (!existing) return;

    const previousUrls = collectArticleMediaUrls(existing);
    const updatedUrls = collectArticleMediaUrls(updated);

    if (!previousUrls.size) return;

    const baseUploadsDir = resolve('static', 'uploads');
    const allowedPrefix = `/uploads/articles/${articleId}/`;

    const toDelete: string[] = [];
    for (const url of previousUrls) {
        if (!updatedUrls.has(url) && typeof url === 'string' && url.startsWith(allowedPrefix)) {
            toDelete.push(url);
        }
    }

    if (!toDelete.length) return;

    await Promise.all(
        toDelete.map(async (url) => {
            try {
                const fsPath = resolve('static', url.replace(/^\//, ''));
                if (fsPath.startsWith(baseUploadsDir)) {
                    await rm(fsPath, { force: true });
                }
            } catch (error) {
            }
        })
    );
}

    const data = await request.json();
    
    try {
        // Get user's role first (needed for privileged checks)
        const userData = await getUsers({ id: user.id });
        const userRecord = userData[0];
        const userRole = userRecord?.role || 'user';
        const isPrivileged = userRole === 'admin' || userRole === 'moderator';

        // Rate limiting check for article creation (skip for privileged users)
        if (!isPrivileged && !checkArticleRateLimit(user.id)) {
            return json({ 
                error: 'Too many articles created. Please wait before creating another article.' 
            }, { status: 429 });
        }

        // Honeypot check for bots (skip for privileged users)
        if (!isPrivileged && data.website && data.website.trim() !== '') {
            return json({ error: 'Spam detected' }, { status: 400 });
        }

        // Spam detection (skip for privileged users)
        if (!isPrivileged) {
            const spamCheck = detectArticleSpam(data);
            if (spamCheck.isSpam) {
                return json({ 
                    error: 'Article appears to be spam',
                    reasons: spamCheck.reasons 
                }, { status: 400 });
            }
        }

        // Check article limit for non-privileged users
        if (data.status === 'published' && !isPrivileged) {
            // Count user's published articles today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            // Get all articles by user and filter manually for today
            const userArticles = await getArticles({ 
                author_id: user.id 
            });
            
            const publishedToday = userArticles.filter((article: any) => 
                article.status === 'published' && 
                new Date(article.created_at) >= startOfDay
            );

            if (publishedToday.length >= 2) {
                return json({ 
                    error: 'Günlük makale yayınlama limitinize ulaştınız. Günde en fazla 2 makale yayınlayabilirsiniz.' 
                }, { status: 403 });
            }

            // Set status to pending for non-privileged users
            data.status = 'pending';
        }

        // defaultLanguage yoksa mevcut çevirilerden ilkini ata
        if (!data.defaultLanguage) {
            const langs = Object.keys(data.translations || {});
            if (langs.length > 0) data.defaultLanguage = langs[0];
        }

        // Slug kontrolü ve oluşturma (dil bazlı)
        for (const [lang, translation] of Object.entries<any>(data.translations || {})) {
            if (translation.title && !translation.slug) {
                translation.slug = slugify(translation.title);
            }

            // Slug benzersizlik kontrolü - check if slug exists for this language
            if (translation.slug) {
                const baseSlug = translation.slug;
                const existingArticles = await getArticles({ 
                    slug: baseSlug, 
                    language: lang 
                });
                
                // Filter out the current article if updating
                const existing = existingArticles.find((a: any) => a.id !== (data._id || data.id));

                // Only add unique suffix if there's a duplicate
                if (existing) {
                    translation.slug = `${baseSlug}-${Date.now()}`;
                }
            }
        }

        const articleData = {
            translations: data.translations || {},
            category: data.category || null,
            subcategory: data.subcategory || null,
            tags: data.tags || [],
            thumbnail: data.thumbnail || null,
            collaborators: data.collaborators || [],
            status: data.status || 'draft',
            default_language: data.defaultLanguage || 'tr',
            views: data.stats?.views || 0,
            likes_count: data.stats?.likes || 0,
            comments_count: data.stats?.comments || 0,
            author_id: user.id,
            published_at: data.status === 'published' ? new Date() : data.published_at,
            // Store reviewer info if status was changed to pending
            ...(data.status === 'pending' && !isPrivileged && {
                pending_review: {
                    requestedAt: new Date(),
                    status: 'pending',
                    reviewerId: null,
                    reviewedAt: null,
                    comment: null
                }
            })
        };

        // Store original status for reference (not saved to DB)
        const originalStatus = data.status;

        let articleId: string;

        const existingId = data._id || data.id;
        let existingArticle: any = null;
        if (existingId) {
            // Güncelleme
            articleId = existingId;
            existingArticle = await getArticleById(articleId);
            await updateArticle(articleId, articleData);
        } else {
            // Yeni makale
            const result = await createArticle(articleData);
            articleId = result.id;
        }

        // Taslak kaydetme
        if (data.status === 'draft') {
            await upsertDraft(articleId, user.id, {
                data: articleData,
                has_unpublished_changes: true
            });
        } else {
            // Yayınlama - versiyon kaydet
            const versionCount = await countVersions(articleId);
            await createVersion({
                articleId: articleId,
                data: articleData,
                authorId: user.id,
                changeNote: `Version ${versionCount + 1}`
            });

            // Taslağı temizle
            await deleteDraft(articleId);

            await cleanupUnusedMedia(existingArticle, articleData, articleId);
            
            // Send notifications to followers if this is a new published article
            if (!existingId && originalStatus === 'published') {
              const authorData = await getUsers({ id: user.id });
              const author = authorData[0];
              
              if (author) {
                const defaultLang = articleData.default_language || 'tr';
                const title = articleData.translations?.[defaultLang]?.title || 'Yeni Makale';
                
                await notifyNewArticle({
                  articleId: articleId,
                  articleSlug: articleData.translations?.[defaultLang]?.slug,
                  authorId: user.id,
                  articleTitle: title,
                  authorName: author.username || author.name || 'Bir kullanıcı'
                });
              }
            }

            // Send notifications to moderators if this is a new article needing review
            if (!existingId && (data.status === 'pending' || data.status === 'published')) {
              const authorData = await getUsers({ id: user.id });
              const author = authorData[0];
              
              if (author) {
                const defaultLang = articleData.default_language || 'tr';
                const title = articleData.translations?.[defaultLang]?.title || 'Yeni Makale';
                
                try {
                  await notifyModeratorsNewArticle({
                    articleId: articleId,
                    articleSlug: articleData.translations?.[defaultLang]?.slug,
                    authorId: user.id,
                    articleTitle: title,
                    authorName: author.username || author.name || 'Bir kullanıcı'
                  });
                } catch (notificationError) {
                  // Don't fail the request if notification fails
                }
              }
            }
        }

        return json({
            success: true,
            articleId: articleId,
            slug: articleData.translations?.[articleData.default_language as string]?.slug
        });

    } catch (error) {
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}