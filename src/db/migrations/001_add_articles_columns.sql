-- Migration: Add missing columns to articles, versions, drafts tables
-- Handles both old MongoDB-style schema and new PostgreSQL schema

-- ============================================
-- ARTICLES TABLE
-- ============================================

-- Make old columns nullable if they exist (new schema uses translations JSONB)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'title') THEN
        EXECUTE 'ALTER TABLE articles ALTER COLUMN title DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'excerpt') THEN
        EXECUTE 'ALTER TABLE articles ALTER COLUMN excerpt DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE articles ALTER COLUMN content DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'slug') THEN
        EXECUTE 'ALTER TABLE articles ALTER COLUMN slug DROP NOT NULL';
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Add missing columns (IF NOT EXISTS for safety)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'tr';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hidden_by UUID;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pending_review JSONB;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for status
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_valid;
ALTER TABLE articles ADD CONSTRAINT articles_status_valid 
    CHECK (status IN ('draft', 'published', 'pending', 'archived'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_translations_slug ON articles USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_hidden ON articles(is_hidden);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN (tags);

-- Add foreign key for hidden_by
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'articles_hidden_by_fkey' 
        AND table_name = 'articles'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT articles_hidden_by_fkey 
            FOREIGN KEY (hidden_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================
-- VERSIONS TABLE
-- ============================================

-- Make old columns nullable if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'versions' AND column_name = 'title') THEN
        EXECUTE 'ALTER TABLE versions ALTER COLUMN title DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'versions' AND column_name = 'excerpt') THEN
        EXECUTE 'ALTER TABLE versions ALTER COLUMN excerpt DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'versions' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE versions ALTER COLUMN content DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'versions' AND column_name = 'slug') THEN
        EXECUTE 'ALTER TABLE versions ALTER COLUMN slug DROP NOT NULL';
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Add new columns
ALTER TABLE versions ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE versions ADD COLUMN IF NOT EXISTS version_number INTEGER;
ALTER TABLE versions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE versions ADD COLUMN IF NOT EXISTS change_note TEXT;

-- Create versions indexes
CREATE INDEX IF NOT EXISTS idx_versions_article_id ON versions(article_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);

-- ============================================
-- DRAFTS TABLE
-- ============================================

-- Add article_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drafts' AND column_name = 'article_id') THEN
        ALTER TABLE drafts ADD COLUMN article_id UUID;
    END IF;
END $$;

-- Add other columns
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN DEFAULT FALSE;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create drafts indexes
CREATE INDEX IF NOT EXISTS idx_drafts_author_id ON drafts(author_id);

-- Add index for article_id only if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drafts' AND column_name = 'article_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_drafts_article_id') THEN
            CREATE INDEX idx_drafts_article_id ON drafts(article_id);
        END IF;
    END IF;
END $$;

-- Add unique constraint only if article_id exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drafts' AND column_name = 'article_id') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'drafts_article_id_author_id_key' 
            AND table_name = 'drafts'
        ) THEN
            ALTER TABLE drafts ADD CONSTRAINT drafts_article_id_author_id_key 
                UNIQUE (article_id, author_id);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
