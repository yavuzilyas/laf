-- Migration: Add user information fields to donations table
-- This migration adds username, user_name, and user_surname fields to donations table
-- and updates existing records with data from the users table

-- Add new columns to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_surname VARCHAR(255);

-- Update existing donations with user information
UPDATE donations 
SET 
    username = u.username,
    user_name = u.name,
    user_surname = u.surname
FROM users u 
WHERE donations.user_id = u.id;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_donations_username ON donations(username);
CREATE INDEX IF NOT EXISTS idx_donations_user_name ON donations(user_name);
CREATE INDEX IF NOT EXISTS idx_donations_user_surname ON donations(user_surname);
