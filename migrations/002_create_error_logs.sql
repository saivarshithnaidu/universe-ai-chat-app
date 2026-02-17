-- Migration 002: Create Error Logs Table
-- System-wide error logging for monitoring and debugging

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    error_type VARCHAR(50) NOT NULL CHECK (
        error_type IN (
            'model_api',
            'payment',
            'general',
            'auth',
            'database'
        )
    ),
    severity VARCHAR(20) NOT NULL CHECK (
        severity IN (
            'low',
            'medium',
            'high',
            'critical'
        )
    ),
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
    endpoint VARCHAR(255),
    request_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for fast querying and filtering
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs (error_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs (severity);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs (user_id)
WHERE
    user_id IS NOT NULL;

-- Add comments
COMMENT ON
TABLE error_logs IS 'System-wide error logging for admin monitoring';

COMMENT ON COLUMN error_logs.error_type IS 'Category of error: model_api, payment, general, auth, database';

COMMENT ON COLUMN error_logs.severity IS 'Error severity level: low, medium, high, critical';

COMMENT ON COLUMN error_logs.request_data IS 'JSON data of the request that caused the error (sanitized)';