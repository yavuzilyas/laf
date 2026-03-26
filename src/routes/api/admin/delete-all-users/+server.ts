import { json } from '@sveltejs/kit';
import { query } from '$db/pg';

export async function POST({ request }) {
  try {
    console.log('Starting to delete all users...');
    
    // First, let's see how many users we have
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${userCount} users to delete`);
    
    if (userCount === 0) {
      return json({ message: 'No users to delete', counts: { users: 0 } });
    }
    
    // Delete related data first (due to foreign key constraints)
    console.log('Deleting related data...');
    
    // Delete likes
    const likesResult = await query('DELETE FROM likes');
    console.log(`Deleted ${likesResult.rowCount} likes`);
    
    // Delete saves
    const savesResult = await query('DELETE FROM saves');
    console.log(`Deleted ${savesResult.rowCount} saves`);
    
    // Delete comments
    const commentsResult = await query('DELETE FROM comments');
    console.log(`Deleted ${commentsResult.rowCount} comments`);
    
    // Delete notifications
    const notificationsResult = await query('DELETE FROM notifications');
    console.log(`Deleted ${notificationsResult.rowCount} notifications`);
    
    // Delete drafts
    const draftsResult = await query('DELETE FROM drafts');
    console.log(`Deleted ${draftsResult.rowCount} drafts`);
    
    // Delete versions
    const versionsResult = await query('DELETE FROM versions');
    console.log(`Deleted ${versionsResult.rowCount} versions`);
    
    // Delete articles (since they're tied to users)
    const articlesResult = await query('DELETE FROM articles');
    console.log(`Deleted ${articlesResult.rowCount} articles`);
    
    // Finally delete users
    console.log('Deleting users...');
    const usersResult = await query('DELETE FROM users');
    console.log(`Deleted ${usersResult.rowCount} users`);
    
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
    console.error('❌ Error deleting users:', error);
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
    console.error('Error getting counts:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
}
