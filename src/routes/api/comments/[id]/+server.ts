// src/routes/api/comments/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getComments, deleteComment, getArticles, updateArticle } from '$db/queries';
import { rm } from 'fs/promises';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';
import { slugify } from '$lib/utils/slugify';

export async function DELETE({ params, locals }) {
  const user = (locals as any)?.user;

  // if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = params.id;
  // const userId = user.id;

  // Get comment
  const commentData = await getComments({ id: commentId });
  const comment = commentData[0];


  if (!comment) {
    return json({ error: 'Comment not found' }, { status: 404 });
  }

  // Get author info for user folder path
  const authorId = comment.author_id;
  
  // Yorumu soft delete yap
  await deleteComment(commentId);

  // Article'ın comment count'ını azalt
  if (comment?.article_id) {
    const articles = await getArticles({ id: comment.article_id });
    if (articles.length > 0) {
      const article = articles[0];
      await updateArticle(comment.article_id, { 
        comments_count: Math.max(0, (article.comments_count || 0) - 1) 
      });
    }
  }

  // Delete comment upload folder
  try {
    const UPLOAD_BASE_DIR = env.UPLOAD_DIR || '/app/uploads';
    const baseUploadsDir = resolve(UPLOAD_BASE_DIR);
    
    // Get author username for folder path
    const { getUsers } = await import('$db/queries');
    const users = await getUsers({ id: authorId });
    const author = users[0];
    
    if (author) {
      const rawNickname = typeof author.username === 'string' && author.username.trim().length
        ? author.username
        : (author.id?.toString?.() ?? 'user');
      const safeUserId = slugify(rawNickname) || 'user';
      
      // Comment folder path: /uploads/users/{userId}/comments/{commentId}/
      const commentFolderPath = resolve(baseUploadsDir, 'users', safeUserId, 'comments', commentId);
      
      console.log('[DELETE COMMENT] Attempting to delete folder:', commentFolderPath);
      
      try {
        await rm(commentFolderPath, { recursive: true, force: true });
        console.log('[DELETE COMMENT] Folder deleted successfully:', commentFolderPath);
      } catch (err) {
        // Folder might not exist, which is fine
        console.log('[DELETE COMMENT] Folder deletion result:', err?.message || 'Folder may not exist');
      }
    }
  } catch (err) {
    console.error('[DELETE COMMENT] Error deleting comment folder:', err);
    // Don't fail the request if folder deletion fails
  }

  return json({ success: true, message: 'Comment deleted successfully' });
}
