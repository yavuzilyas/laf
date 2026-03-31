import { json } from '@sveltejs/kit';
import { query } from '$db/pg';

export async function POST({ request }) {
  try {
    
    // First, let's see how many users we have
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    
    if (userCount === 0) {
      return json({ message: 'No users to delete', counts: { users: 0 } });
    }
    
    // Delete related data first (due to foreign key constraints)
    
    // Delete likes
    const likesResult = await query('DELETE FROM likes');
    
    // Delete saves
    const savesResult = await query('DELETE FROM saves');
    
    // Delete comments
    const commentsResult = await query('DELETE FROM comments');
    
    // Delete notifications
    const notificationsResult = await query('DELETE FROM notifications');
    
    // Delete drafts
    const draftsResult = await query('DELETE FROM drafts');
    
    // Delete versions
    const versionsResult = await query('DELETE FROM versions');
    
    // Delete articles (since they're tied to users)
    const articlesResult = await query('DELETE FROM articles');
    
    // Finally delete users
    const usersResult = await query('DELETE FROM users');
    
    // Verify deletion
    const verificationResults = await query(`
      SELECT 'users' as table_name, COUNT(*) as remaining_count FROM users
      UNION ALL
      SELECT 'articles', COUNT(*) FROM articles
      UNION ALL  
      SELECT 'comments', COUNT(*) FROM comments
      UNION ALL
      SELECT 'likes', COUNT(*) FROM likes
      UNION ALL
      SELECT 'saves', COUNT(*) FROM saves
      UNION ALL
      SELECT 'notifications', COUNT(*) FROM notifications
      UNION ALL
      SELECT 'drafts', COUNT(*) FROM drafts
      UNION ALL
      SELECT 'versions', COUNT(*) FROM versions
    `);
    
    const counts = {};
    verificationResults.rows.forEach(row => {
      counts[row.table_name] = parseInt(row.remaining_count);
    });
    
    return json({ 
      success: true, 
      message: 'All users and related data have been deleted successfully',
      deletedCounts: {
        users: usersResult.rowCount,
        articles: articlesResult.rowCount,
        comments: commentsResult.rowCount,
        likes: likesResult.rowCount,
        saves: savesResult.rowCount,
        notifications: notificationsResult.rowCount,
        drafts: draftsResult.rowCount,
        versions: versionsResult.rowCount
      },
      remainingCounts: counts
    });
    
  } catch (error) {
    return json({ 
      error: 'Server error while deleting users', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    const result = await query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'articles', COUNT(*) FROM articles
      UNION ALL  
      SELECT 'comments', COUNT(*) FROM comments
      UNION ALL
      SELECT 'likes', COUNT(*) FROM likes
      UNION ALL
      SELECT 'saves', COUNT(*) FROM saves
      UNION ALL
      SELECT 'notifications', COUNT(*) FROM notifications
      UNION ALL
      SELECT 'drafts', COUNT(*) FROM drafts
      UNION ALL
      SELECT 'versions', COUNT(*) FROM versions
    `);
    
    const counts = {};
    result.rows.forEach(row => {
      counts[row.table_name] = parseInt(row.count);
    });
    
    return json({ counts });
  } catch (error) {
    return json({ error: 'Server error' }, { status: 500 });
  }
}
