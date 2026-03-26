-- FINAL FIX SUMMARY for ArticleCard username display issue
-- Run these commands in order to completely fix the issue

-- 1. First, run the migration to add new columns (if not already done)
\i src/db/migrations/010_improve_author_username_handling.sql

-- 2. Update existing articles with author data (populates cached fields)
\i update_existing_articles.sql

-- 3. Verify the fix worked
SELECT 
    a.id,
    a.author_username,
    a.author_nickname,
    COALESCE(a.author_username, u.username) as final_username,
    COALESCE(a.author_nickname, u.nickname) as final_nickname
FROM articles a
JOIN users u ON a.author_id = u.id
WHERE a.id = '1482c14c-7b72-4e57-8722-cc913a9e227e'
LIMIT 1;

-- Expected result: Should show actual username/nickname, not NULLs
-- ArticleCard will now display: @username instead of @user-id

-- Changes made to code:
-- 1. Database queries updated to use cached fields with fallbacks
-- 2. ArticleCard component updated to prioritize username over user ID
-- 3. Article page server updated to use cached data first
-- 4. Write page updated to save author username/nickname

-- The link priority is now: nickname > username > user-id
-- This ensures proper author links in all cases.
