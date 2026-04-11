-- Migration: Remove ip_address and user_agent from contact_messages table
-- Created: 2026-04-10

-- Remove columns from contact_messages table
ALTER TABLE contact_messages DROP COLUMN IF EXISTS ip_address;
ALTER TABLE contact_messages DROP COLUMN IF EXISTS user_agent;
