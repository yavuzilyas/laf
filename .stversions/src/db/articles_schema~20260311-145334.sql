-- PostgreSQL Articles Schema
-- Articles ve ilgili tüm tablolar

-- Extensions (gen_random_uuid için gerekli)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Articles table (supports translations, stats, soft delete, versioning)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_nickname VARCHAR(255), -- Store author nickname for display
    
    -- Translations stored as JSONB (keyed by language code)
    -- Each translation has: title, excerpt, content, slug, language
    translations JSONB DEFAULT '{}',
    
    -- Article metadata
    category VARCHAR(255),
    subcategory VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    thumbnail TEXT,
    
    -- Status management
    status VARCHAR(50) DEFAULT 'draft',
    default_language VARCHAR(10) DEFAULT 'tr',
    
    -- Statistics
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    
    -- Visibility and moderation
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_by UUID REFERENCES users(id),
    hidden_at TIMESTAMP WITH TIME ZONE,
    hidden_reason TEXT,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Review workflow for non-privileged users
    pending_review JSONB,
    
    -- Additional metadata (collaborators, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT articles_status_valid CHECK (status IN ('draft', 'published', 'pending', 'archived', 'rejected'))
);

-- Article indexes
CREATE INDEX IF NOT EXISTS idx_articles_translations_slug ON articles USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_hidden ON articles(is_hidden);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN (tags);

-- Drafts table (auto-saved article drafts)
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Full article data snapshot
    data JSONB DEFAULT '{}',
    
    -- Draft metadata
    last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    has_unpublished_changes BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(article_id, author_id)
);

-- Versions table (for article version history)
CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Full article data snapshot at this version
    data JSONB DEFAULT '{}',
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_note TEXT
);

-- Version indexes
CREATE INDEX IF NOT EXISTS idx_versions_article_id ON versions(article_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_version_number ON versions(article_id, version_number);

-- Draft indexes
CREATE INDEX IF NOT EXISTS idx_drafts_article_id ON drafts(article_id);
CREATE INDEX IF NOT EXISTS idx_drafts_author_id ON drafts(author_id);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_hidden BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Saves table (bookmarked articles)
CREATE TABLE IF NOT EXISTS saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Saves indexes
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_article_id ON saves(article_id);
CREATE INDEX IF NOT EXISTS idx_saves_created_at ON saves(created_at DESC);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Reports table (article reports)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_nickname VARCHAR(255), -- Store reporter nickname for display
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_nickname VARCHAR(255), -- Store reviewer nickname for display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT reports_status_valid CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_article_id ON reports(article_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Articles updated_at trigger
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drafts updated_at trigger
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments updated_at trigger
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments count trigger (article comments_count güncelleme)
CREATE OR REPLACE FUNCTION update_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comments_count();

-- Likes count trigger (article likes_count güncelleme)
CREATE OR REPLACE FUNCTION update_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_likes_count ON likes;
CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_likes_count();
