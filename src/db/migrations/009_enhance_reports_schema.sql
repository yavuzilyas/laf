-- Enhanced Reports Table Migration
-- Updates the reports table to support all report types and moderation features

-- First, drop the existing reports table if it exists in basic form
DROP TABLE IF EXISTS reports CASCADE;

-- Create enhanced reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Report type and target
    type VARCHAR(20) NOT NULL CHECK (type IN ('profile', 'article', 'comment', 'error')),
    target_id VARCHAR(255) NOT NULL, -- Can be UUID for valid targets or string for error reports
    
    -- Target-specific IDs (nullable depending on type)
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reporter information
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for error reports
    
    -- Report content
    reason TEXT NOT NULL,
    details TEXT,
    url TEXT, -- For error reports
    
    -- Report data (JSON for flexible target information)
    target_data JSONB DEFAULT '{}',
    reporter_data JSONB DEFAULT '{}',
    
    -- Moderation workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolution TEXT,
    notes TEXT,
    
    -- Moderation tracking
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_id ON reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_article_id ON reports(article_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment_id ON reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);

-- Create index for target_data JSONB queries
CREATE INDEX IF NOT EXISTS idx_reports_target_data_gin ON reports USING GIN (target_data);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Function to automatically set resolved_at when status is resolved/dismissed
CREATE OR REPLACE FUNCTION update_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('resolved', 'dismissed') THEN
        NEW.resolved_at = NOW();
    ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status NOT IN ('resolved', 'dismissed') THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resolved_at
DROP TRIGGER IF EXISTS update_resolved_at ON reports;
CREATE TRIGGER update_resolved_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_resolved_at();

-- Add report_count columns to target tables if they don't exist
DO $$
BEGIN
    -- Add to users table for profile reports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'report_count') THEN
        ALTER TABLE users ADD COLUMN report_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add to articles table for article reports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'report_count') THEN
        ALTER TABLE articles ADD COLUMN report_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add to comments table for comment reports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'report_count') THEN
        ALTER TABLE comments ADD COLUMN report_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for report counts
CREATE INDEX IF NOT EXISTS idx_users_report_count ON users(report_count);
CREATE INDEX IF NOT EXISTS idx_articles_report_count ON articles(report_count);
CREATE INDEX IF NOT EXISTS idx_comments_report_count ON comments(report_count);
