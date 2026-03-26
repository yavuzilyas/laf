-- Add collaborators column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS collaborators UUID[] DEFAULT '{}';

-- Add index for collaborators column for better performance
CREATE INDEX IF NOT EXISTS idx_articles_collaborators ON articles USING GIN (collaborators);

-- Add comment to describe the column
COMMENT ON COLUMN articles.collaborators IS 'Array of user IDs who are collaborators on this article';
