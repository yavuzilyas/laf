-- Quick test to verify author username handling in ArticleCard
-- Run this to check if articles are returning proper author info

-- Test the getArticles query with author information
SELECT 
    a.id,
    a.author_username,
    a.author_nickname,
    COALESCE(a.author_username, u.username) as author_name,
    COALESCE(a.author_nickname, u.nickname) as author_nickname_display,
    u.username as user_username,
    u.nickname as user_nickname,
    u.name as user_name
FROM articles a
JOIN users u ON a.author_id = u.id
LIMIT 5;

-- Check if migration was applied
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name IN ('author_username', 'author_nickname')
ORDER BY column_name;
