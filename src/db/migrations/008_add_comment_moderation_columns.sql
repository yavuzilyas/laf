-- Add moderation columns to comments table

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_action JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Add indexes for comment moderation columns
CREATE INDEX IF NOT EXISTS idx_comments_hidden_by ON comments(hidden_by);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_by ON comments(deleted_by);
