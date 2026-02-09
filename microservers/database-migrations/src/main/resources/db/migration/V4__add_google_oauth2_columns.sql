-- Migration script for Google OAuth2 support
-- Add google_id and auth_provider columns to users table

-- Add google_id column for storing Google's unique user identifier
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add auth_provider column to track how the user registered (LOCAL, GOOGLE, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'LOCAL';

-- Make member_id nullable for OAuth2 users (they don't have a member association initially)
ALTER TABLE users ALTER COLUMN member_id DROP NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Create index on auth_provider for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Update existing users to have LOCAL as their auth_provider
UPDATE users SET auth_provider = 'LOCAL' WHERE auth_provider IS NULL;
