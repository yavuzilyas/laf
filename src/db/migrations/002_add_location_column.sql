-- Migration: Add location column to users table (separate from preferences)
-- Created: 2025-04-02

-- Add location column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add index for location lookups
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location) WHERE location IS NOT NULL;
