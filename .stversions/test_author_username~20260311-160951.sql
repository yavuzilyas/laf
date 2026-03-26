-- Test script to verify author username handling
-- Run this after applying the migration to test the functionality

-- 1. Check if the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name IN ('author_username', 'author_nickname')
ORDER BY column_name;

-- 2. Test the trigger by inserting a test article
-- (This assumes you have a test user with ID, username, and nickname)

-- First, let's see what users exist
SELECT id, username, nickname, name, surname 
FROM users 
LIMIT 5;

-- Test insert (replace with actual user ID from above)
-- INSERT INTO articles (
--     author_id, author_username, author_nickname, 
--     translations, category, status, default_language
-- ) VALUES (
--     'your-user-id-here', 
--     'testuser', 
--     'Test User',
--     '{"tr": {"title": "Test", "content": "Test content"}}',
--     'test',
--     'draft',
--     'tr'
-- );

-- Check if trigger worked
-- SELECT id, author_id, author_username, author_nickname 
-- FROM articles 
-- WHERE author_id = 'your-user-id-here'
-- ORDER BY created_at DESC LIMIT 1;

-- 3. Test the view
SELECT * FROM articles_with_author LIMIT 3;

-- 4. Test the function
SELECT * FROM get_articles_with_author_display(5, 0, 'draft');
