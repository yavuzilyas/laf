-- PostgreSQL schema for LAF application
-- Replace MongoDB collections with PostgreSQL tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    preferences JSONB DEFAULT '{}',
    -- Auth and mnemonic fields
    name VARCHAR(255),
    surname VARCHAR(255),
    mnemonic_hash TEXT,
    verification_token UUID,
    verification_token_expires_at TIMESTAMP WITH TIME ZONE,
    last_mnemonic_attempt TIMESTAMP WITH TIME ZONE,
    mnemonic_attempts INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    report_count INTEGER DEFAULT 0,
    CONSTRAINT users_mnemonic_attempts_non_negative CHECK (mnemonic_attempts >= 0),
    CONSTRAINT users_status_valid CHECK (status IN ('active', 'suspended', 'banned')),
    CONSTRAINT users_mnemonic_hash_format CHECK (mnemonic_hash IS NULL OR mnemonic_hash ~* '^[a-f0-9]{64}$')
);

-- Articles table (supports translations, stats, soft delete, versioning)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
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
    report_count INTEGER DEFAULT 0,
    
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
    
    CONSTRAINT articles_status_valid CHECK (status IN ('draft', 'published', 'pending', 'archived'))
);

-- Article translations index for slug lookups
CREATE INDEX IF NOT EXISTS idx_articles_translations_slug ON articles USING GIN (translations);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_hidden ON articles(is_hidden);
CREATE INDEX IF NOT EXISTS idx_articles_report_count ON articles(report_count);

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
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    report_count INTEGER DEFAULT 0
);

-- Saves table (bookmarked articles)
CREATE TABLE IF NOT EXISTS saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Enhanced Reports table
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

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_actor_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- User blocks table (individual blocking relationships)
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_report_count ON comments(report_count);
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_verification_token_expires_at ON users(verification_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_last_mnemonic_attempt ON users(last_mnemonic_attempt);
CREATE INDEX IF NOT EXISTS idx_users_report_count ON users(report_count);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_user_id ON user_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_user_id ON user_blocks(blocked_user_id);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Donation details
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    txid VARCHAR(255) NOT NULL,
    donation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Optional message from donor
    message TEXT,
    display_name VARCHAR(255),
    
    -- User information (cached for easy access)
    username VARCHAR(255),
    user_name VARCHAR(255),
    user_surname VARCHAR(255),
    
    -- Moderation status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Moderation tracking
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_username ON donations(username);
CREATE INDEX IF NOT EXISTS idx_donations_user_name ON donations(user_name);
CREATE INDEX IF NOT EXISTS idx_donations_user_surname ON donations(user_surname);

-- Trigger function to update user info in donations when user info changes
CREATE OR REPLACE FUNCTION update_donations_user_info()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE donations 
    SET 
        username = NEW.username,
        user_name = NEW.name,
        user_surname = NEW.surname,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update donations when user info changes
CREATE TRIGGER trigger_update_donations_user_info
    AFTER UPDATE OF username, name, surname ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_donations_user_info();

-- Trigger function to set user info in donations when new donation is created
CREATE OR REPLACE FUNCTION set_donation_user_info()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT username, name, surname 
        INTO NEW.username, NEW.user_name, NEW.user_surname
        FROM users 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set user info when donation is created
CREATE TRIGGER trigger_set_donation_user_info
    BEFORE INSERT ON donations
    FOR EACH ROW
    EXECUTE FUNCTION set_donation_user_info();
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_donation_date ON donations(donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_reviewed_by ON donations(reviewed_by);

-- Function to update donations updated_at timestamp
CREATE OR REPLACE FUNCTION update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donations updated_at
DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_donations_updated_at();

-- Contact Messages table (from contact form submissions)
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- User information (cached for easy access)
    user_email VARCHAR(255),
    user_nickname VARCHAR(255),
    user_username VARCHAR(255),
    
    -- Form data
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('general', 'feedback', 'collaboration', 'report', 'other')),
    message TEXT NOT NULL,
    
    -- Technical metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Status for moderation workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded', 'archived')),
    
    -- Moderation tracking
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Spam protection
    honeypot_filled BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_subject ON contact_messages(subject);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_reviewed_by ON contact_messages(reviewed_by);

-- Trigger function to update contact_messages updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update contact_messages updated_at
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- Trigger function to set user info in contact_messages when new message is created
CREATE OR REPLACE FUNCTION set_contact_message_user_info()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT email, nickname, username 
        INTO NEW.user_email, NEW.user_nickname, NEW.user_username
        FROM users 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set user info when contact message is created
DROP TRIGGER IF EXISTS trigger_set_contact_message_user_info ON contact_messages;
CREATE TRIGGER trigger_set_contact_message_user_info
    BEFORE INSERT ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_contact_message_user_info();
