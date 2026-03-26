-- Reactions and Comments Enhancement Schema
-- Adds reaction types and enhanced comment functionality to existing system

-- Add reaction types to existing likes table
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'like';

-- Update the unique constraint to allow different reaction types
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_article_id_key;
ALTER TABLE likes ADD CONSTRAINT likes_user_article_reaction_unique 
UNIQUE(user_id, article_id, reaction_type);

-- Add index for reaction type queries
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(reaction_type);

-- Add reactions to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reacted_user_id UUID REFERENCES users(id);

-- Add basic moderation and tracking to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add metadata column for JSON content storage
ALTER TABLE comments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add likes/dislikes columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Add comment indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_edited_at ON comments(edited_at);

-- Function to update article reaction counts
CREATE OR REPLACE FUNCTION update_article_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE article_id = NEW.article_id AND reaction_type = 'like'),
            dislikes = (SELECT COUNT(*) FROM likes WHERE article_id = NEW.article_id AND reaction_type = 'dislike')
        WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE article_id = OLD.article_id AND reaction_type = 'like'),
            dislikes = (SELECT COUNT(*) FROM likes WHERE article_id = OLD.article_id AND reaction_type = 'dislike')
        WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update existing trigger for reactions
DROP TRIGGER IF EXISTS update_likes_count ON likes;
CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_reaction_counts();

-- Function to track comment edits
CREATE OR REPLACE FUNCTION track_comment_edits()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.is_edited = TRUE;
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing comments trigger to include edit tracking
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION track_comment_edits();
