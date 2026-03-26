-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Add constraint to ensure valid role values
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_role_valid 
CHECK (role IN ('user', 'moderator', 'admin'));

-- Create index for role column for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role (in case there are any without role)
UPDATE users SET role = 'user' WHERE role IS NULL;
