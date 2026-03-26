import { query } from './src/db/pg.js';

async function runMigration() {
  try {
    console.log('Adding collaborators column to articles table...');
    
    // Add collaborators column to articles table
    await query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS collaborators UUID[] DEFAULT \'{}\'');
    
    // Add index for collaborators column for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_articles_collaborators ON articles USING GIN (collaborators)');
    
    console.log('Collaborators migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
