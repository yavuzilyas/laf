-- Add reaction_type column to likes table to support both likes and dislikes
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(10) DEFAULT 'like';

-- Create index for reaction type queries
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(reaction_type);

-- Update unique constraint to allow same user to have different reaction types
-- First drop the old constraint, then add a new one
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_article_id_key;
ALTER TABLE likes ADD CONSTRAINT likes_user_article_unique UNIQUE(user_id, article_id);

-- Add likes and dislikes columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
