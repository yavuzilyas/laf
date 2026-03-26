import { getUsers, updateUser } from '../src/db/queries';
import { query } from '../src/db/pg';

async function cleanupDeletedUsers() {
  console.log('Starting cleanup of deleted users...');
  
  try {
    // Get users with 'silinecek' status for more than 48 hours
    const deletedUsers = await query(`
      SELECT * FROM users 
      WHERE status = 'silinecek' 
      AND deletion_timestamp < NOW() - INTERVAL '48 hours'
    `);
    
    console.log(`Found ${deletedUsers.rows.length} users to permanently delete`);
    
    for (const user of deletedUsers.rows) {
      try {
        // Start a transaction to delete all user data
        await query('BEGIN');
        
        // Delete user's articles
        await query('DELETE FROM articles WHERE author_id = $1', [user.id]);
        
        // Delete user's comments
        await query('DELETE FROM comments WHERE author_id = $1', [user.id]);
        
        // Delete user's likes
        await query('DELETE FROM likes WHERE user_id = $1', [user.id]);
        
        // Delete user's saves/bookmarks
        await query('DELETE FROM saves WHERE user_id = $1', [user.id]);
        
        // Delete user's notifications
        await query('DELETE FROM notifications WHERE user_id = $1', [user.id]);
        
        // Delete user's messages (both sent and received)
        await query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [user.id]);
        
        // Delete user's follows (both follower and following)
        await query('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [user.id]);
        
        // Delete user's blocks
        await query('DELETE FROM user_blocks WHERE user_id = $1 OR blocked_user_id = $1', [user.id]);
        
        // Delete user's blocked_users entry
        await query('DELETE FROM blocked_users WHERE user_id = $1', [user.id]);
        
        // Delete reports made by this user
        await query('DELETE FROM reports WHERE reporter_id = $1', [user.id]);
        
        // Finally delete the user
        await query('DELETE FROM users WHERE id = $1', [user.id]);
        
        await query('COMMIT');
        console.log(`Permanently deleted user: ${user.username} (${user.id})`);
        
      } catch (error) {
        await query('ROLLBACK');
        console.error(`Failed to delete user ${user.username} (${user.id}):`, error);
      }
    }
    
    console.log('Cleanup completed');
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupDeletedUsers, 60 * 60 * 1000);

// Run once on startup
cleanupDeletedUsers();
