import { query } from '../src/db/pg.js';

async function createBlockedUsersTable() {
    try {
        console.log('Creating blocked_users table...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS blocked_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                blocked_actor_ids TEXT[] DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id)
            );
        `;
        
        await query(createTableSQL);
        console.log('blocked_users table created successfully');
        
        // Create index
        const createIndexSQL = `
            CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
        `;
        
        await query(createIndexSQL);
        console.log('Index created successfully');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createBlockedUsersTable();
