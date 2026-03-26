import { query } from '../src/db/pg.ts';

async function deleteAllUsers() {
  try {
    console.log('Starting to delete all users...');
    
    // First, let's see how many users we have
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${userCount} users to delete`);
    
    if (userCount === 0) {
      console.log('No users to delete');
      return;
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
    
    // Delete articles (since they're tied to users)
    const articlesResult = await query('DELETE FROM articles');
    console.log(`Deleted ${articlesResult.rowCount} articles`);
    
    // Finally delete users
    console.log('Deleting users...');
    const usersResult = await query('DELETE FROM users');
    console.log(`Deleted ${usersResult.rowCount} users`);
    
    console.log('✅ All users and related data have been deleted successfully');
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

deleteAllUsers();
