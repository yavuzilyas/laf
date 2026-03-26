import { json } from '@sveltejs/kit';
import { query } from '$db/pg';

export async function POST() {
  try {
    console.log('Running Argon2 constraint migration...');
    
    // Drop the old constraint
    await query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mnemonic_hash_format
    `);
    
    // Add new constraint that allows Argon2 hash format
    await query(`
      ALTER TABLE users ADD CONSTRAINT users_mnemonic_hash_format 
      CHECK (mnemonic_hash IS NULL OR mnemonic_hash ~* '^\$argon2id\$[a-zA-Z0-9+/=]+$')
    `);
    
    // Also update password_hash constraint to be consistent (if it exists)
    const constraintCheck = await query(`
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'users_password_hash_format'
    `);
    
    if (constraintCheck.rows.length > 0) {
      await query(`
        ALTER TABLE users DROP CONSTRAINT users_password_hash_format
      `);
      
      await query(`
        ALTER TABLE users ADD CONSTRAINT users_password_hash_format 
        CHECK (password_hash ~* '^\$argon2id\$[a-zA-Z0-9+/=]+$')
      `);
    }
    
    console.log('✅ Argon2 constraint migration completed successfully');
    
    return json({ 
      success: true, 
      message: 'Database constraints updated for Argon2 hashes' 
    });
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    return json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}
