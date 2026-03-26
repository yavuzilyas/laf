-- Update existing articles with author usernames and nicknames
-- This will populate the cached fields for existing articles

-- Update existing articles with author usernames
UPDATE articles 
SET author_username = u.username 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_username IS NULL 
AND u.username IS NOT NULL;

-- Update existing articles with author nicknames  
UPDATE articles 
SET author_nickname = u.nickname 
FROM users u 
WHERE articles.author_id = u.id 
AND articles.author_nickname IS NULL 
AND u.nickname IS NOT NULL;

-- Verify the updates
SELECT 
    a.id,
    a.author_username,
    a.author_nickname,
    u.username as user_username,
    u.nickname as user_nickname,
    COALESCE(a.author_username, u.username) as final_username,
    COALESCE(a.author_nickname, u.nickname) as final_nickname
FROM articles a
JOIN users u ON a.author_id = u.id
WHERE a.id = '1482c14c-7b72-4e57-8722-cc913a9e227e'
LIMIT 1;
