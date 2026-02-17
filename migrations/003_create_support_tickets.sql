-- Migration 003: Create Support Tickets System
-- Customer support ticket management with responses

-- Main support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (
        status IN (
            'open',
            'in_progress',
            'resolved',
            'closed'
        )
    ),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (
        priority IN (
            'low',
            'medium',
            'high',
            'urgent'
        )
    ),
    assigned_to TEXT REFERENCES users (id) ON DELETE SET NULL,
    category VARCHAR(50) CHECK (
        category IN (
            'billing',
            'technical',
            'feature_request',
            'bug',
            'other'
        )
    ),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    resolved_at TIMESTAMP
);

-- Ticket responses/messages table
CREATE TABLE IF NOT EXISTS ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    ticket_id UUID REFERENCES support_tickets (id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets (user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets (priority);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets (assigned_to)
WHERE
    assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON ticket_responses (ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_responses_created_at ON ticket_responses (created_at ASC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_timestamp();

-- Add comments
COMMENT ON TABLE support_tickets IS 'Customer support ticket system';

COMMENT ON COLUMN support_tickets.status IS 'Ticket status: open, in_progress, resolved, closed';

COMMENT ON COLUMN support_tickets.priority IS 'Priority level: low, medium, high, urgent';

COMMENT ON
TABLE ticket_responses IS 'Responses/messages within a support ticket';