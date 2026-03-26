-- Delete all users and related data
-- This script will clean the entire database

-- Start transaction
BEGIN;

-- Delete related data first (due to foreign key constraints)
-- Delete likes
DELETE FROM likes;

-- Delete saves  
DELETE FROM saves;

-- Delete comments
DELETE FROM comments;

-- Delete notifications
DELETE FROM notifications;

-- Delete drafts
DELETE FROM drafts;

-- Delete versions
DELETE FROM versions;

-- Delete articles (since they're tied to users)
DELETE FROM articles;

-- Finally delete users
DELETE FROM users;

-- Commit the transaction
COMMIT;

-- Verify deletion
SELECT 'users' as table_name, COUNT(*) as remaining_count FROM users
UNION ALL
SELECT 'articles', COUNT(*) FROM articles
UNION ALL  
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'saves', COUNT(*) FROM saves
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'drafts', COUNT(*) FROM drafts
UNION ALL
SELECT 'versions', COUNT(*) FROM versions;
