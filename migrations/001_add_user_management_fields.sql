-- Migration 001: Add User Management Fields
-- Adds role-based access control and subscription management fields

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

-- Create indexes for admin queries and performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_plan ON users (plan);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_is_disabled ON users (is_disabled)
WHERE
    is_disabled = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role for RBAC: user or admin';

COMMENT ON COLUMN users.plan IS 'Subscription plan: free or pro';

COMMENT ON COLUMN users.subscription_status IS 'Razorpay subscription status';

COMMENT ON COLUMN users.is_disabled IS 'Soft delete flag for account suspension';