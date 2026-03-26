-- COMPREHENSIVE FIX: Eliminate all user ID displays
-- Run this to completely fix the username/user ID issue

-- 1. First, ensure all existing articles have cached author data
UPDATE articles 
SET author_username = u.username 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_username IS NULL 
AND u.username IS NOT NULL;

UPDATE articles 
SET author_nickname = u.nickname 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_nickname IS NULL 
AND u.nickname IS NOT NULL;

-- 2. Verify the fix worked
SELECT 
    a.id,
    a.author_username,
    a.author_nickname,
    a.author_full_name,
    u.username as db_username,
    u.nickname as db_nickname,
    COALESCE(a.author_username, u.username) as final_username,
    COALESCE(a.author_nickname, u.nickname) as final_nickname,
    CASE 
        WHEN a.author_nickname IS NOT NULL THEN '@' || a.author_nickname
        WHEN a.author_username IS NOT NULL THEN '@' || a.author_username
        ELSE '@' || u.username
    END as display_link
FROM articles a
JOIN users u ON a.author_id = u.id
WHERE a.id = '1482c14c-7b72-4e57-8722-cc913a9e227e'
LIMIT 1;

-- Expected result: Should show @bbb instead of @user-id
-- All components now prioritize: nickname > username > user-id

-- 3. Check if any articles still have NULL cached fields
SELECT COUNT(*) as null_username_count 
FROM articles 
WHERE author_username IS NULL;

SELECT COUNT(*) as null_nickname_count 
FROM articles 
WHERE author_nickname IS NULL;

-- If these counts are 0, the fix is complete!
