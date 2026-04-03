-- Migration: Add daily translation limit tracking
-- Created: 2026-04-02

-- Create table to track user daily translations
CREATE TABLE IF NOT EXISTS user_daily_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    translation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate counting for same article+language per day
    CONSTRAINT unique_daily_translation UNIQUE (user_id, translation_date, article_id, language_code)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_daily_translations_user_date 
    ON user_daily_translations(user_id, translation_date);
    
CREATE INDEX IF NOT EXISTS idx_user_daily_translations_date 
    ON user_daily_translations(translation_date);

-- Function to count daily translations for a user
CREATE OR REPLACE FUNCTION get_user_daily_translation_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM user_daily_translations 
        WHERE user_id = user_uuid 
        AND translation_date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add a daily translation record
CREATE OR REPLACE FUNCTION add_daily_translation(
    user_uuid UUID,
    article_uuid UUID,
    lang_code VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO user_daily_translations (user_id, article_id, language_code)
    VALUES (user_uuid, article_uuid, lang_code)
    ON CONFLICT (user_id, translation_date, article_id, language_code) 
    DO UPDATE SET created_at = NOW()
    RETURNING id INTO new_id;
    
    RETURN TRUE;
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
