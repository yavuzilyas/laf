-- Migration: Add phone_number column to users table
-- Created: 2025-04-02

-- Add phone_number column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add index for phone_number lookups (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;
