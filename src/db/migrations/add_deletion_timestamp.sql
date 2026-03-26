-- Add deletion_timestamp column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on deletion queries
CREATE INDEX IF NOT EXISTS idx_users_deletion_timestamp ON users(deletion_timestamp);
