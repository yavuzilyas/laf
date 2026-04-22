-- Add featured articles support
-- Allows admins to feature articles that will be randomly displayed on homepage

-- Add is_featured column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add featured_at timestamp to track when article was featured
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE;

-- Add featured_by to track which admin featured the article
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_by UUID REFERENCES users(id);

-- Add index for faster queries on featured articles
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_featured_at ON articles(featured_at);

-- Add comment to describe the columns
COMMENT ON COLUMN articles.is_featured IS 'Whether the article is featured and should appear on homepage';
COMMENT ON COLUMN articles.featured_at IS 'When the article was featured';
COMMENT ON COLUMN articles.featured_by IS 'User ID of the admin who featured the article';
