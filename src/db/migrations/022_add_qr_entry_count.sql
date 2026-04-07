-- Migration: Unified QR entry tracking for entire site
-- Tracks all QR entries site-wide with username, timestamp, and source URL

DROP TABLE IF EXISTS qr_entries;
DROP TABLE IF EXISTS profile_qr_entries;

CREATE TABLE IF NOT EXISTS qr_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255), -- NULL for anonymous users
    source_url TEXT NOT NULL, -- Full URL where user entered from QR
    entry_time TIMESTAMP NOT NULL DEFAULT NOW(),
    user_agent TEXT -- Optional: browser info
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_qr_entries_username ON qr_entries(username);
CREATE INDEX IF NOT EXISTS idx_qr_entries_source_url ON qr_entries(source_url);
CREATE INDEX IF NOT EXISTS idx_qr_entries_entry_time ON qr_entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_qr_entries_time_url ON qr_entries(entry_time, source_url);
