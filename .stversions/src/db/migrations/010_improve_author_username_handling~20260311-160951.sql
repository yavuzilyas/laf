-- Migration: Improve author username handling in articles
-- This migration adds better author username management with automatic synchronization

-- Add author_username column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_username VARCHAR(255);

-- Add index for author_username
CREATE INDEX IF NOT EXISTS idx_articles_author_username ON articles(author_username);

-- Update existing articles with author usernames from users table
UPDATE articles 
SET author_username = u.username 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_username IS NULL;

-- Enhanced trigger function to keep both author_username and author_nickname in sync
CREATE OR REPLACE FUNCTION update_article_author_info()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.author_id != NEW.author_id THEN
        -- Update both username and nickname when author changes
        NEW.author_username = (SELECT username FROM users WHERE id = NEW.author_id);
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    ELSIF TG_OP = 'INSERT' THEN
        -- Set both username and nickname for new articles
        NEW.author_username = (SELECT username FROM users WHERE id = NEW.author_id);
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_article_author_nickname ON articles;

-- Create the enhanced trigger
CREATE TRIGGER trigger_update_article_author_info
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_author_info();

-- Create a view for easier article queries with author information
CREATE OR REPLACE VIEW articles_with_author AS
SELECT 
    a.*,
    u.username as current_author_username,
    u.nickname as current_author_nickname,
    u.email as author_email,
    u.avatar_url as author_avatar_url,
    u.bio as author_bio,
    -- Display name preference: nickname if exists, otherwise username
    COALESCE(u.nickname, u.username) as author_display_name
FROM articles a
LEFT JOIN users u ON a.author_id = u.id
WHERE a.deleted_at IS NULL;

-- Create index for the view (if needed for performance)
-- Note: PostgreSQL doesn't allow indexes on views directly, but we can index the underlying tables

-- Function to update all articles when a user changes their username or nickname
CREATE OR REPLACE FUNCTION update_articles_on_user_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Update username if it changed
        IF OLD.username != NEW.username THEN
            UPDATE articles 
            SET author_username = NEW.username 
            WHERE author_id = NEW.id;
        END IF;
        
        -- Update nickname if it changed
        IF OLD.nickname != NEW.nickname THEN
            UPDATE articles 
            SET author_nickname = NEW.nickname 
            WHERE author_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on users table to update articles when user info changes
DROP TRIGGER IF EXISTS trigger_update_articles_on_user_change ON users;
CREATE TRIGGER trigger_update_articles_on_user_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_articles_on_user_change();

-- Add constraint to ensure author_username is not null for new articles
ALTER TABLE articles ADD CONSTRAINT articles_author_username_not_null 
    CHECK (author_username IS NOT NULL);

-- Create a function to get articles with author display names (for API usage)
CREATE OR REPLACE FUNCTION get_articles_with_author_display(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'published'
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_username VARCHAR,
    author_nickname VARCHAR,
    author_display_name VARCHAR,
    translations JSONB,
    category VARCHAR,
    subcategory VARCHAR,
    tags TEXT[],
    thumbnail TEXT,
    status VARCHAR,
    default_language VARCHAR,
    views INTEGER,
    likes_count INTEGER,
    comments_count INTEGER,
    dislikes INTEGER,
    is_hidden BOOLEAN,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.author_id,
        a.author_username,
        a.author_nickname,
        COALESCE(a.author_nickname, a.author_username) as author_display_name,
        a.translations,
        a.category,
        a.subcategory,
        a.tags,
        a.thumbnail,
        a.status,
        a.default_language,
        a.views,
        a.likes_count,
        a.comments_count,
        a.dislikes,
        a.is_hidden,
        a.published_at,
        a.created_at,
        a.updated_at
    FROM articles a
    WHERE a.deleted_at IS NULL
    AND (p_status IS NULL OR a.status = p_status)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant usage if needed (uncomment and adjust for your database user)
-- GRANT USAGE ON SCHEMA public TO your_app_user;
-- GRANT SELECT ON articles_with_author TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_articles_with_author_display TO your_app_user;
