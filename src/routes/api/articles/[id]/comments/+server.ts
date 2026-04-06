// src/routes/api/articles/[id]/comments/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, createComment, getArticles, getUsers, getBlockedUsers, isUserBlockedRelation, updateArticle } from '$db/queries';
import { notifyArticleComment, notifyCommentReply } from '$lib/server/notifications-pg';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Spam detection patterns
const spamPatterns = [
  /\b(buy|sell|cheap|free|discount|offer|deal|price|click|here|now|urgent|act|fast|quick)\b/gi,
  /\b(http|www|\.com|\.net|\.org|\.info|\.biz|link|url|site|website)\b/gi,
  /\b(money|cash|dollar|bitcoin|crypto|investment|profit|income|earn)\b/gi,
  /\b(viagra|cialis|casino|poker|bet|gambling|lottery)\b/gi,
  /\b(weight|loss|diet|pill|fat|burn|slim)\b/gi,
  /([a-zA-Z])\1{3,}/g, // Repeated characters
  /[A-Z]{5,}/g, // All caps
  /\b([a-zA-Z])\b(?:\s+\1\b){2,}/g, // Repeated words
];

const profanityList = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'cunt', 'dick', 'pussy',
  'whore', 'slut', 'bastard', 'idiot', 'stupid', 'moron', 'retard'
];

function checkRateLimit(userId: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `comment:${userId}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

function detectSpam(content: any): { isSpam: boolean; reasons: string[]; hasMedia: boolean } {
  const reasons: string[] = [];
  let textContent = '';
  let hasMedia = false;

  if (typeof content === 'string') {
    textContent = content;
  } else if (typeof content === 'object' && content !== null) {
    // Extract text from TipTap JSON content
    textContent = extractTextFromContent(content);
    // Check for media attachments
    hasMedia = checkForMedia(content);
  }

  const lowerText = textContent.toLowerCase();

  // If comment has media, only check for extreme spam (honeypot caught, way too many URLs)
  // Skip other spam checks for media-rich comments
  if (hasMedia) {
    // Only flag obvious spam in media comments
    const urlMatches = lowerText.match(/https?:\/\/[^\s]+/g) || [];
    if (urlMatches.length > 5) {
      reasons.push('Too many URLs');
    }
    
    // Still check for profanity in media comments
    for (const word of profanityList) {
      if (lowerText.includes(word)) {
        reasons.push('Contains inappropriate language');
        break;
      }
    }

    return {
      isSpam: reasons.length > 0,
      reasons,
      hasMedia
    };
  }

  // Check for spam patterns (only for text-only comments)
  for (const pattern of spamPatterns) {
    if (pattern.test(lowerText)) {
      reasons.push('Contains spam keywords');
      break;
    }
  }

  // Check for profanity
  for (const word of profanityList) {
    if (lowerText.includes(word)) {
      reasons.push('Contains inappropriate language');
      break;
    }
  }

  // Check length limits (skip for media comments)
  if (!hasMedia) {
    if (textContent.length < 3) {
      reasons.push('Comment too short');
    } else if (textContent.length > 2000) {
      reasons.push('Comment too long');
    }
  } else {
    // For media comments, only check upper limit
    if (textContent.length > 2000) {
      reasons.push('Comment too long');
    }
  }

  // Check for excessive repetition
  const words = textContent.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
    reasons.push('Excessive repetition');
  }

  // Check for too many URLs
  const urlMatches = lowerText.match(/https?:\/\/[^\s]+/g) || [];
  if (urlMatches.length > 2) {
    reasons.push('Too many URLs');
  }

  return {
    isSpam: reasons.length > 0,
    reasons,
    hasMedia
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

function checkForMedia(content: any): boolean {
  if (!content || typeof content !== 'object') return false;
  
  // Media node types in TipTap/Edra
  const mediaTypes = ['image', 'video', 'audio', 'file', 'fileAttachment', 'iframe', 'image-extended', 'video-extended', 'audio-extended'];
  
  function traverse(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    
    // Check if this node is a media type
    if (node.type && mediaTypes.includes(node.type)) {
      return true;
    }
    
    // Check attrs for media indicators
    if (node.attrs) {
      if (node.attrs.src || node.attrs.url || node.attrs.fileUrl || node.attrs.filename) {
        return true;
      }
    }
    
    // Recursively check content
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        if (traverse(child)) return true;
      }
    }
    
    return false;
  }
  
  return traverse(content);
}

export async function GET({ params, locals }) {
  const user = (locals as any)?.user;
  const viewerId = user?.id || null;

  let viewerBlockedIds = new Set<string>();
  let blockedViewerIds = new Set<string>();

  if (viewerId) {
    // Get users blocked by viewer
    const blockedUsers = await getBlockedUsers(viewerId);
    if (blockedUsers?.blocked_actor_ids) {
      viewerBlockedIds = new Set(blockedUsers.blocked_actor_ids);
    }

    // Get users who blocked the viewer
    const allUsers = await getUsers();
    for (const u of allUsers) {
      const isBlocked = await isUserBlockedRelation(u.id, viewerId);
      if (isBlocked) {
        blockedViewerIds.add(u.id);
      }
    }
  }

  const shouldHideUser = (authorId: string | null | undefined) => {
    if (!authorId || !user) return false;
    if (authorId === user.id) return false;
    return viewerBlockedIds.has(authorId) || blockedViewerIds.has(authorId);
  };

  // Check if user can see hidden comments (author, moderator, or admin)
  const canSeeHidden = (comment: any) => {
    if (!comment.hidden) return true;
    if (!user) return false;
    
    // Comment author can always see their own hidden comments
    if (comment.author_id === user.id) return true;
    
    // Moderators and admins can see hidden comments
    const userRole = user.role?.toLowerCase();
    return userRole === 'moderator' || userRole === 'admin';
  };

  async function loadReplies(parentId: string): Promise<any[]> {
    const replies = await getComments({ 
      parent_id: parentId,
      article_id: params.id 
    });

    const nested = await Promise.all(
      replies
        .filter((r: any) => !shouldHideUser(r.author_id) && canSeeHidden(r))
        .map(async (r: any) => {
          const author = await getUsers({ id: r.author_id });
          let content = r.content;
          // Parse JSON content if it's a JSON string
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
              content = JSON.parse(content);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
          
          return {
            id: r.id,
            userId: r.author_id,
            content: content,
            createdAt: r.created_at?.toISOString(),
            author: author[0] ? {
              id: author[0].id,
              nickname: author[0].username || author[0].name || 'Unknown User',
              name: author[0].name,
              surname: author[0].surname,
              avatar: author[0].avatar_url || ''
            } : null,
            likes: r.likes || 0,
            dislikes: r.dislikes || 0,
            hidden: r.hidden || false,
            metadata: r.metadata || {},
            reportCount: r.report_count || 0,
            replies: await loadReplies(r.id)
          };
        })
    );

    return nested;
  }

  const list = await getComments({ 
    article_id: params.id,
    parent_id: null 
  });

  const normalized = await Promise.all(
    list
      .filter((c: any) => !shouldHideUser(c.author_id) && canSeeHidden(c))
      .map(async (c: any) => {
        const author = await getUsers({ id: c.author_id });
        let content = c.content;
        // Parse JSON content if it's a JSON string
        if (typeof content === 'string' && content.trim().startsWith('{')) {
          try {
            content = JSON.parse(content);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
        
        return {
          id: c.id,
          userId: c.author_id,
          content: content,
          createdAt: c.created_at?.toISOString(),
          author: author[0] ? {
            id: author[0].id,
            nickname: author[0].username || author[0].name || 'Unknown User',
            name: author[0].name,
            surname: author[0].surname,
            avatar: author[0].avatar_url || ''
          } : null,
          likes: c.likes || 0,
          dislikes: c.dislikes || 0,
          hidden: c.hidden || false,
          metadata: c.metadata || {},
          reportCount: c.report_count || 0,
          replies: await loadReplies(c.id)
        };
      })
  );

  return json(normalized);
}

export async function POST({ params, request, locals }) {
  const user = (locals as any)?.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  // Check if user is admin or moderator
  const userRole = user.role?.toLowerCase();
  const isPrivileged = userRole === 'admin' || userRole === 'moderator';

  // Rate limiting check (skip for privileged users)
  if (!isPrivileged && !checkRateLimit(user.id)) {
    return json({ error: 'Too many comments. Please wait before posting again.' }, { status: 429 });
  }

  const body = await request.json();
  const content = body?.content;
  const parentId = body?.parentId;
  const honeypot = body?.website; // Honeypot field for bots
  const clientCommentId = body?.clientCommentId; // Client-generated comment ID for file uploads
  
  // Honeypot check - bots usually fill all fields
  if (honeypot && honeypot.trim() !== '') {
    return json({ error: 'Spam detected' }, { status: 400 });
  }
  
  if (content === undefined || content === null) return json({ error: 'Empty' }, { status: 400 });

  // Spam detection (skip for privileged users)
  if (!isPrivileged) {
    const spamCheck = detectSpam(content);
    if (spamCheck.isSpam) {
      return json({ 
        error: 'Comment appears to be spam', 
        reasons: spamCheck.reasons 
      }, { status: 400 });
    }
  }

  const articles = await getArticles({ id: params.id });
  const article = articles[0];
  
  if (!article) {
    return json({ error: 'Article not found' }, { status: 404 });
  }
  
  const commentData: any = {
    article_id: params.id,
    author_id: user.id,
    content,
    parent_id: parentId || null
  };
  
  // If client provided a comment ID (for pre-submission file uploads), use it
  if (clientCommentId && typeof clientCommentId === 'string') {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(clientCommentId)) {
      commentData.id = clientCommentId;
    }
  }
  
  const newComment = await createComment(commentData);

  // Update article comment count in metadata
  await updateArticle(params.id, {
    metadata: {
      ...article.metadata,
      stats: {
        ...article.metadata?.stats,
        comments: (article.metadata?.stats?.comments || 0) + 1
      }
    }
  });

  const commentId = newComment.id;

  // Bildirimler
  try {
    await notifyArticleComment({
      articleId: params.id,
      articleSlug: article?.slug ? String(article.slug) : undefined,
      commenterId: user.id,
      articleAuthorId: article?.author_id ?? null,
      commentId,
      articleTitle: article?.title ?? null
    });

    if (parentId) {
      await notifyCommentReply({
        parentCommentId: parentId,
        replierId: user.id,
        articleId: params.id,
        articleSlug: article?.slug ? String(article.slug) : undefined,
        commentId
      });
    }
  } catch (error) {
  }
  
  let responseContent = newComment.content;
// Parse JSON content if it's a JSON string for consistency
if (typeof responseContent === 'string' && responseContent.trim().startsWith('{')) {
  try {
    responseContent = JSON.parse(responseContent);
  } catch (e) {
    // Keep as string if parsing fails
  }
}

return json({ 
    id: commentId, 
    userId: newComment.author_id,
    content: responseContent,
    createdAt: newComment.created_at.toISOString(),
    author: { 
      id: user.id, 
      nickname: user.username || user.name || 'Unknown User', 
      name: user.name, 
      surname: user.surname,
      avatar: user.avatar_url || ''
    },
    likes: 0,
    dislikes: 0,
    replies: []
  });
}
