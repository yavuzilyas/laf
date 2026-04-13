-- Normalize optional fields to NULL instead of empty strings to avoid unique constraint issues
UPDATE users SET email = NULL WHERE email = '';
UPDATE users SET phone_number = NULL WHERE phone_number = '';
UPDATE users SET matrix_username = NULL WHERE matrix_username = '';
UPDATE users SET location = NULL WHERE location = '';
