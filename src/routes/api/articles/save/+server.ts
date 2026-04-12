// src/routes/api/articles/save/+server.ts
import { json } from '@sveltejs/kit';
import { getArticles, createArticle, updateArticle, getArticleById, getUsers, upsertDraft, createVersion, countVersions, deleteDraft, countDraftsByUser } from '$db/queries';
import { checkDailyTranslationLimit, addDailyTranslation } from '$db/queries-translations';
import { slugify } from '$lib/utils/slugify';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';
import { notifyNewArticle, notifyModeratorsNewArticle } from '$lib/server/notifications-pg';
import { notifyTranslationReview } from '$lib/server/translation-notifications';
import { createTranslationStatus } from '$db/queries-translation-status';

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

function checkArticleRateLimit(userId: string, limit: number = 5, windowMs: number = 3600000): boolean {
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

async function cleanupUnusedMedia(existing: any, updated: any, articleId: string, status?: string) {
    // Skip cleanup for drafts - don't delete uploaded files when saving as draft
    if (status === 'draft' || updated?.status === 'draft') {
        console.log('[cleanupUnusedMedia] Skipping cleanup for draft article:', articleId);
        return;
    }
    
    if (!existing) return;

    const previousUrls = collectArticleMediaUrls(existing);
    const updatedUrls = collectArticleMediaUrls(updated);

    if (!previousUrls.size) return;

    const baseUploadsDir = resolve(env.UPLOAD_DIR);
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
                const fsPath = resolve(baseUploadsDir, url.replace(/^\/uploads\//, '').replace(/^\//, ''));
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

        // Check article limit for non-privileged users (hourly: max 2 articles per hour)
        if (data.status === 'published' && !isPrivileged) {
            // Count user's published articles in the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            // Get all articles by user and filter manually for last hour
            const userArticles = await getArticles({ 
                author_id: user.id 
            });
            
            const publishedLastHour = userArticles.filter((article: any) => 
                article.status === 'published' && 
                new Date(article.created_at) >= oneHourAgo
            );

            if (publishedLastHour.length >= 10) {
                return json({
                    error: 'Saatlik makale yayınlama limitinize ulaştınız. Saatte en fazla 10 makale yayınlayabilirsiniz.'
                }, { status: 403 });
            }

            // Check draft limit for non-privileged users (hourly: max 10 drafts per hour)
            // Only check for NEW drafts (not when editing existing draft/article)
            if (!data.id && !data._id) {
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const draftCount = await countDraftsByUser(user.id, oneHourAgo);

                if (draftCount >= 10) {
                    return json({
                        error: 'Saatlik taslak oluşturma limitinize ulaştınız. Saatte en fazla 10 taslak oluşturabilirsiniz.'
                    }, { status: 403 });
                }
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
            // Başlık yoksa veya boşsa "undefined" kullan, yoksa başlıktan oluştur
            if (!translation.slug) {
                if (translation.title && translation.title.trim()) {
                    translation.slug = slugify(translation.title);
                } else {
                    translation.slug = 'undefined';
                }
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
            author_id: user.id,
            published_at: data.publishedAt ? new Date(data.publishedAt) : (data.status === 'published' ? new Date() : null),
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
        let isCollaboratorEdit = false;
        let originalAuthorId: string | null = null;
        
        if (existingId) {
            // Güncelleme - yetki kontrolü yap
            articleId = existingId;
            existingArticle = await getArticleById(articleId);
            
            if (!existingArticle) {
                return json({ error: 'Article not found' }, { status: 404 });
            }
            
            // Preserve existing interaction counts
            (articleData as any).views = existingArticle.views ?? 0;
            (articleData as any).likes_count = existingArticle.likes_count ?? 0;
            (articleData as any).comments_count = existingArticle.comments_count ?? 0;
            
            // Store original author ID from existing article
            originalAuthorId = existingArticle.author_id;
            articleData.author_id = originalAuthorId;
            
            // Check if user is author or collaborator
            const isAuthor = String(existingArticle.author_id) === String(user.id);
            const isCollaborator = existingArticle.collaborators?.includes(user.id);
            isCollaboratorEdit = isCollaborator && !isAuthor;
            const isTranslator = data.isTranslator === true;
            
            let canEdit = isAuthor || isCollaborator;
            let isPrivilegedEdit = false;
            
            // Admin ve moderator her zaman privileged kabul edilir
            if (userRole === 'admin') {
                isPrivilegedEdit = true;
                if (!canEdit) {
                    canEdit = true;
                }
            } else if (userRole === 'moderator' && !canEdit) {
                const authorData = await getUsers({ id: existingArticle.author_id });
                const authorRole = authorData[0]?.role || 'user';
                if (authorRole === 'user') {
                    canEdit = true;
                    isPrivilegedEdit = true;
                }
            }
            
            if (!canEdit && !isTranslator) {
                return json({ error: 'Unauthorized - you are not the author, collaborator, or translator' }, { status: 403 });
            }
            
            // Check hourly translation limit for translators (max 4 per hour)
            if (isTranslator) {
                // Check if article already has any translations - block if it does
                const existingTranslations = existingArticle.translations || {};
                const availableLangs = Object.keys(existingTranslations).filter(
                    lang => existingTranslations[lang] && existingTranslations[lang].title
                );
                const defaultLang = existingArticle.default_language || 'tr';
                const hasDefault = availableLangs.includes(defaultLang);
                const otherLangs = availableLangs.filter(lang => lang !== defaultLang);
                
                // If article already has default + any other translation, block new translations
                if (hasDefault && otherLangs.length >= 1) {
                    return json({ 
                        error: 'Bu makaleye çeviri eklenemez. Makale zaten çevrilmiş durumda.' 
                    }, { status: 403 });
                }
                
                const limitCheck = await checkDailyTranslationLimit(user.id, 10);
                if (!limitCheck.canTranslate) {
                    return json({
                        error: 'Saatlik çeviri limitine ulaştınız. Saatte en fazla 10 çeviri yapabilirsiniz.',
                        hourlyLimit: 10,
                        currentCount: limitCheck.currentCount
                    }, { status: 429 });
                }
                
                // Sadece yeni çeviriler veya mevcut non-default çeviriler güncellenebilir
                const updatedTranslations = { ...existingArticle.translations };
                
                for (const [lang, translation] of Object.entries(data.translations || {})) {
                    // Ana dil çevirisi değiştirilemez
                    if (lang === defaultLang) {
                        continue;
                    }
                    // Sadece geçerli çeviri verisi varsa güncelle
                    if (translation && typeof translation === 'object') {
                        updatedTranslations[lang] = translation;
                    }
                }
                
                const translatorArticleData = {
                    translations: updatedTranslations,
                    author_id: originalAuthorId, // Orijinal yazarı koru
                    views: existingArticle.views ?? 0,
                    likes_count: existingArticle.likes_count ?? 0,
                    comments_count: existingArticle.comments_count ?? 0
                };
                await updateArticle(articleId, translatorArticleData);
                
                // Record this translation for daily limit tracking
                for (const lang of Object.keys(data.translations || {})) {
                    if (lang !== defaultLang && data.translations[lang]) {
                        await addDailyTranslation(user.id, articleId, lang);
                        
                        // Check if translator is author, admin, or moderator (privileged)
                        // Only privileged users get auto-approval
                        const isPrivilegedTranslator = isAuthor || isPrivileged;
                        
                        console.log(`[TRANSLATION] Translator mode - lang: ${lang}, isPrivileged: ${isPrivilegedTranslator}`);
                        
                        // Create translation status record for approval workflow
                        const translationStatusId = await createTranslationStatus(
                            articleId,
                            lang,
                            user.id,
                            isPrivilegedTranslator ? 'approved' : 'pending'
                        );
                        
                        console.log(`[TRANSLATION] Created status for ${lang}: ${translationStatusId} (${isPrivilegedTranslator ? 'approved' : 'pending'})`);
                        
                        // Send notification to author for review (only for non-privileged translators)
                        if (translationStatusId && existingArticle?.author_id && !isPrivilegedTranslator) {
                            try {
                                await notifyTranslationReview({
                                    articleId: articleId,
                                    articleSlug: data.translations[lang]?.slug || existingArticle.translations?.[defaultLang]?.slug,
                                    translatorId: user.id,
                                    articleAuthorId: existingArticle.author_id,
                                    languageCode: lang,
                                    articleTitle: data.translations[lang]?.title || existingArticle.translations?.[defaultLang]?.title,
                                    translationStatusId: translationStatusId
                                });
                                console.log(`[TRANSLATION] Notification sent to author ${existingArticle.author_id} for ${lang}`);
                            } catch (notificationError) {
                                console.error('Failed to send translation notification:', notificationError);
                            }
                        }
                    }
                }
            } else if (isCollaboratorEdit || isPrivilegedEdit) {
                console.log(`[TRANSLATION] Edit mode (privileged/collaborator) by ${user.id}, role: ${userRole} - auto-approving all new translations`);
                const collaboratorArticleData = {
                    ...articleData,
                    author_id: originalAuthorId // Orijinal yazarı koru
                };
                await updateArticle(articleId, collaboratorArticleData);
                
                // Handle new languages added by collaborator/admin/moderator - auto-approve
                const existingTranslations = existingArticle.translations || {};
                const updatedTranslations = articleData.translations || {};
                
                for (const [lang, translation] of Object.entries(updatedTranslations)) {
                    // Skip default language
                    if (lang === articleData.default_language) continue;
                    
                    // Skip if language already existed before with content
                    if (existingTranslations[lang]?.title) continue;
                    
                    // This is a new language being added - create approved translation status
                    if (translation && typeof translation === 'object' && (translation as any).title) {
                        try {
                            const statusId = await createTranslationStatus(
                                articleId,
                                lang,
                                user.id,
                                'approved'
                            );
                            if (statusId) {
                                console.log(`[TRANSLATION] ✓ Auto-approved ${lang} (edit mode): ${statusId}`);
                            }
                        } catch (err) {
                            console.error(`[TRANSLATION] Error creating status for ${lang}:`, err);
                        }
                    }
                }
            } else {
                // Yazar düzenlemesi: normal güncelleme
                console.log(`[TRANSLATION] Edit mode (author) by ${user.id} - auto-approving all new translations`);
                await updateArticle(articleId, articleData);
                
                // Handle new languages added by author - auto-approve
                const existingTranslations = existingArticle.translations || {};
                const updatedTranslations = articleData.translations || {};
                
                for (const [lang, translation] of Object.entries(updatedTranslations)) {
                    // Skip default language
                    if (lang === articleData.default_language) continue;
                    
                    // Skip if language already existed before with content
                    if (existingTranslations[lang]?.title) continue;
                    
                    // This is a new language being added - create approved translation status
                    if (translation && typeof translation === 'object' && (translation as any).title) {
                        try {
                            const statusId = await createTranslationStatus(
                                articleId,
                                lang,
                                user.id,
                                'approved'
                            );
                            if (statusId) {
                                console.log(`[TRANSLATION] Created approved status for ${lang} by author/admin: ${statusId}`);
                            } else {
                                console.error(`[TRANSLATION] Failed to create status for ${lang}`);
                            }
                        } catch (err) {
                            console.error(`[TRANSLATION] Error creating status for ${lang}:`, err);
                        }
                    }
                }
            }
        } else {
            // Yeni makale
            const result = await createArticle(articleData);
            articleId = result.id;
            
            // Yeni makaledeki tüm çevirileri otomatik onayla kaydet (edit yetkisi olan herkes için)
            const newTranslations = articleData.translations || {};
            const defaultLang = articleData.default_language || 'tr';
            
            for (const [lang, translation] of Object.entries(newTranslations)) {
                // Skip default language
                if (lang === defaultLang) continue;
                
                // Geçerli çeviri varsa kaydet
                if (translation && typeof translation === 'object' && (translation as any).title) {
                    try {
                        const statusId = await createTranslationStatus(
                            articleId,
                            lang,
                            user.id,
                            'approved'
                        );
                        if (statusId) {
                            console.log(`[TRANSLATION] ✓ New article - auto-approved ${lang}: ${statusId}`);
                        }
                    } catch (err) {
                        console.error(`[TRANSLATION] Error creating status for new article ${lang}:`, err);
                    }
                }
            }
        }

        // Taslak kaydetme
        if (data.status === 'draft') {
            await upsertDraft(articleId, user.id, {
                data: articleData,
                has_unpublished_changes: true
            });
            
            // Taslak için de cleanup çalıştır (draft ise dosya silinmeyecek)
            await cleanupUnusedMedia(existingArticle, articleData, articleId, articleData.status);
        } else {
            // Yayınlama - versiyon kaydet
            const versionCount = await countVersions(articleId);
            await createVersion({
                articleId: articleId,
                data: articleData,
                authorId: user.id,
                changeNote: `Version ${versionCount + 1}`
            });

            await cleanupUnusedMedia(existingArticle, articleData, articleId, articleData.status);
            
            // Taslağı temizle
            await deleteDraft(articleId);
            
            // Get collaborators list
            const collaborators = articleData.collaborators || [];
            
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

            // Send notifications to moderators if this is a new article needing review OR
            // if an existing article is being updated to pending status
            const wasPendingStatusChange = existingId && (data.status === 'pending') && existingArticle?.status !== 'pending';
            const isNewArticleForReview = !existingId && (data.status === 'pending' || data.status === 'published');
            if (isNewArticleForReview || wasPendingStatusChange) {
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
                    authorName: author.username || author.name || 'Bir kullanıcı',
                    excludeUserIds: collaborators // Don't send moderator notifications to collaborators
                  });
                } catch (notificationError) {
                  console.error('[NOTIFICATION] Failed to notify moderators about pending article:', notificationError);
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
        console.error('Error saving article:', error);
        return json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}