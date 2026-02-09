-- Make member_id nullable for OAuth2 users (they don't have a member association initially)
ALTER TABLE users ALTER COLUMN member_id DROP NOT NULL;
