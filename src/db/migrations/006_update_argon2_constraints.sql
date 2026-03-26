-- Update mnemonic hash constraint to support Argon2 format
-- Argon2 hashes are longer and contain different characters than SHA-256 hex

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mnemonic_hash_format;

-- Add new constraint that allows Argon2 hash format
-- Argon2 hashes typically start with $argon2id$ and contain alphanumeric characters
ALTER TABLE users ADD CONSTRAINT users_mnemonic_hash_format 
CHECK (mnemonic_hash IS NULL OR mnemonic_hash ~* '^\$argon2id\$[a-zA-Z0-9+/=]+$');

-- Also update password_hash constraint to be consistent (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_password_hash_format'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_password_hash_format;
        ALTER TABLE users ADD CONSTRAINT users_password_hash_format 
        CHECK (password_hash ~* '^\$argon2id\$[a-zA-Z0-9+/=]+$');
    END IF;
END $$;
