-- Add moderation columns to users table
-- These columns are needed for user moderation functionality

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_action JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Update existing constraints to include new status values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_valid;
ALTER TABLE users ADD CONSTRAINT users_status_valid 
CHECK (status IN ('active', 'suspended', 'banned', 'hidden', 'deleted'));

-- Add indexes for moderation columns
CREATE INDEX IF NOT EXISTS idx_users_is_hidden ON users(is_hidden);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_hidden_by ON users(hidden_by);
CREATE INDEX IF NOT EXISTS idx_users_banned_by ON users(banned_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);
