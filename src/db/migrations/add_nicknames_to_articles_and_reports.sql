-- Migration: Add nickname fields to users, articles and reports tables
-- This migration adds nickname storage for better performance and consistency

-- Add nickname column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(255) UNIQUE;

-- Add author_nickname to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_nickname VARCHAR(255);

-- Add nickname fields to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_nickname VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewer_nickname VARCHAR(255);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_articles_author_nickname ON articles(author_nickname);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_nickname ON reports(reporter_nickname);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reports_reviewer_nickname ON reports(reviewer_nickname);

-- Update existing articles with author nicknames
UPDATE articles 
SET author_nickname = u.nickname 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_nickname IS NULL 
AND u.nickname IS NOT NULL;

-- Update existing reports with reporter nicknames  
UPDATE reports 
SET reporter_nickname = u.nickname 
FROM users u 
WHERE reports.reporter_id = u.id 
AND reports.reporter_nickname IS NULL 
AND u.nickname IS NOT NULL;

-- Update existing reports with reviewer nicknames
UPDATE reports 
SET reviewer_nickname = u.nickname,
    reviewed_by = u.id
FROM users u 
WHERE reports.reviewed_by = u.id 
AND reports.reviewer_nickname IS NULL 
AND u.nickname IS NOT NULL;

-- Create trigger to automatically update author_nickname when author changes
CREATE OR REPLACE FUNCTION update_article_author_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.author_id != NEW.author_id THEN
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    ELSIF TG_OP = 'INSERT' THEN
        NEW.author_nickname = (SELECT nickname FROM users WHERE id = NEW.author_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update reporter_nickname when reporter changes
CREATE OR REPLACE FUNCTION update_report_reporter_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.reporter_id != NEW.reporter_id THEN
        NEW.reporter_nickname = (SELECT nickname FROM users WHERE id = NEW.reporter_id);
    ELSIF TG_OP = 'INSERT' THEN
        NEW.reporter_nickname = (SELECT nickname FROM users WHERE id = NEW.reporter_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update reviewer_nickname when reviewer changes
CREATE OR REPLACE FUNCTION update_report_reviewer_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.reviewed_by != NEW.reviewed_by THEN
        NEW.reviewer_nickname = (SELECT nickname FROM users WHERE id = NEW.reviewed_by);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_article_author_nickname ON articles;
DROP TRIGGER IF EXISTS trigger_update_report_reporter_nickname ON reports;
DROP TRIGGER IF EXISTS trigger_update_report_reviewer_nickname ON reports;

-- Create the triggers
CREATE TRIGGER trigger_update_article_author_nickname
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_author_nickname();

CREATE TRIGGER trigger_update_report_reporter_nickname
    BEFORE INSERT OR UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_report_reporter_nickname();

CREATE TRIGGER trigger_update_report_reviewer_nickname
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_report_reviewer_nickname();
