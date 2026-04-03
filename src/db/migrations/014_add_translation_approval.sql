-- Migration: Add article translations approval workflow
-- Created: 2026-04-02

-- Create table to track translation statuses
CREATE TABLE IF NOT EXISTS article_translation_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    translator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Ensure one status record per article+language+translator
    CONSTRAINT unique_translation_status UNIQUE (article_id, language_code, translator_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_translation_statuses_article 
    ON article_translation_statuses(article_id);
    
CREATE INDEX IF NOT EXISTS idx_translation_statuses_translator 
    ON article_translation_statuses(translator_id);
    
CREATE INDEX IF NOT EXISTS idx_translation_statuses_status 
    ON article_translation_statuses(status);
    
CREATE INDEX IF NOT EXISTS idx_translation_statuses_language 
    ON article_translation_statuses(article_id, language_code);

-- Function to check if a translation is approved for display
CREATE OR REPLACE FUNCTION is_translation_approved(article_uuid UUID, lang_code VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM article_translation_statuses 
        WHERE article_id = article_uuid 
        AND language_code = lang_code 
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get pending translations count for an article author
CREATE OR REPLACE FUNCTION get_pending_translations_count(author_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM article_translation_statuses ats
        JOIN articles a ON ats.article_id = a.id
        WHERE a.author_id = author_uuid 
        AND ats.status = 'pending'
    );
END;
$$ LANGUAGE plpgsql;

-- Add notification type for translations
-- Note: This requires updating the notification_type enum or using check constraint
-- We'll use 'translation_review' as a new notification type
