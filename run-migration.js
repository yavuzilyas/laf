import { query } from '../src/db/pg';

async function runMigration() {
  try {
    console.log('Adding deletion_timestamp column...');
    
    // Add deletion_timestamp column to users table
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_timestamp TIMESTAMP WITH TIME ZONE');
    
    // Create index for better performance on deletion queries
    await query('CREATE INDEX IF NOT EXISTS idx_users_deletion_timestamp ON users(deletion_timestamp)');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
