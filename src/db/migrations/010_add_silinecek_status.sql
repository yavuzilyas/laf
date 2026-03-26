-- Update users status constraint to include 'silinecek' status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_valid;
ALTER TABLE users ADD CONSTRAINT users_status_valid 
CHECK (status IN ('active', 'suspended', 'banned', 'hidden', 'deleted', 'silinecek'));
