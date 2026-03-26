-- Simple script to run the author username improvements migration
-- Execute this file to apply the changes to your database

-- Run the migration
\i src/db/migrations/010_improve_author_username_handling.sql

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name IN ('author_username', 'author_nickname')
ORDER BY column_name;

-- Show sample data to verify the migration worked
SELECT 
    id,
    author_id,
    author_username,
    author_nickname,
    created_at
FROM articles 
LIMIT 5;
