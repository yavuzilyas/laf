-- Add slug column to questions table for SEO-friendly URLs

-- Add slug column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique index for slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_slug ON questions(slug) WHERE slug IS NOT NULL;

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_question_slug(p_title TEXT, p_exclude_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_base_slug TEXT;
    v_slug TEXT;
    v_counter INTEGER := 1;
    v_exists BOOLEAN;
BEGIN
    -- Generate base slug from title
    v_base_slug := LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(p_title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
    
    -- Trim hyphens from ends
    v_base_slug := TRIM(BOTH '-' FROM v_base_slug);
    
    -- Limit length
    IF LENGTH(v_base_slug) > 80 THEN
        v_base_slug := SUBSTRING(v_base_slug, 1, 80);
        -- Trim to last complete word if possible
        v_base_slug := SUBSTRING(v_base_slug FROM '^.*[^-]');
    END IF;
    
    v_slug := v_base_slug;
    
    -- Check if slug exists (excluding the current question if updating)
    LOOP
        IF p_exclude_id IS NULL THEN
            SELECT EXISTS(
                SELECT 1 FROM questions WHERE slug = v_slug
            ) INTO v_exists;
        ELSE
            SELECT EXISTS(
                SELECT 1 FROM questions WHERE slug = v_slug AND id != p_exclude_id
            ) INTO v_exists;
        END IF;
        
        EXIT WHEN NOT v_exists;
        
        -- Append counter to make unique
        v_slug := v_base_slug || '-' || v_counter;
        v_counter := v_counter + 1;
        
        -- Prevent infinite loop
        IF v_counter > 1000 THEN
            v_slug := v_base_slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing questions with slugs (if any)
-- This will only run if there are existing questions without slugs
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, title FROM questions WHERE slug IS NULL LOOP
        UPDATE questions 
        SET slug = generate_question_slug(r.title, r.id)
        WHERE id = r.id;
    END LOOP;
END $$;
