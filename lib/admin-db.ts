// Admin-specific database methods extension
import { Pool } from 'pg';

// Create database pool
const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

let dbPool: Pool;
if (process.env.NODE_ENV === 'production') {
    dbPool = pool;
} else {
    if (!(global as any).dbPool) {
        (global as any).dbPool = pool;
    }
    dbPool = (global as any).dbPool;
}

export const adminDb = {
    getUserById: async (id: string) => {
        const res = await dbPool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return res.rows[0] || null;
    },

    updateUserFromClerk: async (userId: string, data: { email?: string; name?: string }) => {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        if (data.email) { updates.push(`email = $${paramIndex++}`); values.push(data.email); }
        if (data.name) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (updates.length === 0) return;
        values.push(userId);
        await dbPool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    },

    updateUserRole: async (userId: string, role: 'user' | 'admin') => {
        await dbPool.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);
    },

    updateUserPlan: async (userId: string, plan: 'free' | 'pro', subscriptionId?: string) => {
        await dbPool.query(`UPDATE users SET plan = $1, subscription_id = $2 WHERE id = $3`, [plan, subscriptionId || null, userId]);
    },

    updateSubscriptionStatus: async (userId: string, status: string) => {
        await dbPool.query(`UPDATE users SET subscription_status = $1 WHERE id = $2`, [status, userId]);
    },

    disableUser: async (userId: string, disabled: boolean) => {
        await dbPool.query(`UPDATE users SET is_disabled = $1 WHERE id = $2`, [disabled, userId]);
    },

    getTotalUsers: async (): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(*) as count FROM users`);
        return parseInt(res.rows[0].count);
    },

    getActiveUsers: async (days: number = 30): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(DISTINCT user_id) as count FROM chats WHERE created_at > now() - interval '${days} days'`);
        return parseInt(res.rows[0].count);
    },

    getUsersByPlan: async (plan: 'free' | 'pro'): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(*) as count FROM users WHERE plan = $1`, [plan]);
        return parseInt(res.rows[0].count);
    },

    getTotalMessages: async (): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(*) as count FROM messages`);
        return parseInt(res.rows[0].count);
    },

    getAllUsers: async (params: { page?: number; limit?: number; search?: string; plan?: string; role?: string; }) => {
        const { page = 1, limit = 50, search, plan, role } = params;
        const offset = (page - 1) * limit;
        let query = `
            SELECT u.*, COUNT(m.id) as total_messages 
            FROM users u 
            LEFT JOIN messages m ON u.id = m.user_id 
            WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;
        if (search) { query += ` AND (u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`; queryParams.push(`%${search}%`); paramIndex++; }
        if (plan) { query += ` AND u.plan = $${paramIndex}`; queryParams.push(plan); paramIndex++; }
        if (role) { query += ` AND u.role = $${paramIndex}`; queryParams.push(role); paramIndex++; }
        query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);
        const res = await dbPool.query(query, queryParams);
        let countQuery = `SELECT COUNT(*) as count FROM users WHERE 1=1`;
        const countParams: any[] = [];
        let countIndex = 1;
        if (search) { countQuery += ` AND (email ILIKE $${countIndex} OR name ILIKE $${countIndex})`; countParams.push(`%${search}%`); countIndex++; }
        if (plan) { countQuery += ` AND plan = $${countIndex}`; countParams.push(plan); countIndex++; }
        if (role) { countQuery += ` AND role = $${countIndex}`; countParams.push(role); }
        const countRes = await dbPool.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);
        return { users: res.rows, total, page, limit };
    },

    logError: async (params: { error_type: 'model_api' | 'payment' | 'general' | 'auth' | 'database'; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; stack_trace?: string; user_id?: string; endpoint?: string; request_data?: any; metadata?: any; }) => {
        await dbPool.query(`INSERT INTO error_logs (error_type, severity, message, stack_trace, user_id, endpoint, request_data, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [params.error_type, params.severity, params.message, params.stack_trace || null, params.user_id || null, params.endpoint || null, params.request_data ? JSON.stringify(params.request_data) : null, params.metadata ? JSON.stringify(params.metadata) : null]);
    },

    getErrorLogs: async (params: { type?: string; severity?: string; limit?: number; offset?: number; }) => {
        let query = `SELECT * FROM error_logs WHERE 1=1`;
        const queryParams: any[] = [];
        let paramIndex = 1;
        if (params.type) { query += ` AND error_type = $${paramIndex}`; queryParams.push(params.type); paramIndex++; }
        if (params.severity) { query += ` AND severity = $${paramIndex}`; queryParams.push(params.severity); paramIndex++; }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(params.limit || 100, params.offset || 0);
        const res = await dbPool.query(query, queryParams);
        return res.rows;
    },

    getErrorCount: async (hours: number = 24): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(*) as count FROM error_logs WHERE created_at > now() - interval '${hours} hours'`);
        return parseInt(res.rows[0].count);
    },

    createSupportTicket: async (params: { user_id: string; user_email: string; subject: string; description: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; category?: string; }) => {
        const res = await dbPool.query(`INSERT INTO support_tickets (user_id, user_email, subject, description, priority, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [params.user_id, params.user_email, params.subject, params.description, params.priority || 'medium', params.category || 'other']);
        return res.rows[0];
    },

    getSupportTickets: async (params: { status?: string; priority?: string; limit?: number; offset?: number; }) => {
        let query = `SELECT * FROM support_tickets WHERE 1=1`;
        const queryParams: any[] = [];
        let paramIndex = 1;
        if (params.status) { query += ` AND status = $${paramIndex}`; queryParams.push(params.status); paramIndex++; }
        if (params.priority) { query += ` AND priority = $${paramIndex}`; queryParams.push(params.priority); paramIndex++; }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(params.limit || 50, params.offset || 0);
        const res = await dbPool.query(query, queryParams);
        return res.rows;
    },

    getTicketById: async (ticketId: string) => {
        const res = await dbPool.query(`SELECT * FROM support_tickets WHERE id = $1`, [ticketId]);
        return res.rows[0] || null;
    },

    updateTicketStatus: async (ticketId: string, status: string) => {
        await dbPool.query(`UPDATE support_tickets SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE resolved_at END WHERE id = $2`, [status, ticketId]);
    },

    addTicketResponse: async (params: { ticket_id: string; user_id: string; is_admin: boolean; message: string; }) => {
        await dbPool.query(`INSERT INTO ticket_responses (ticket_id, user_id, is_admin, message) VALUES ($1, $2, $3, $4)`, [params.ticket_id, params.user_id, params.is_admin, params.message]);
    },

    getTicketResponses: async (ticketId: string) => {
        const res = await dbPool.query(`SELECT * FROM ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC`, [ticketId]);
        return res.rows;
    },

    getOpenTicketsCount: async (): Promise<number> => {
        const res = await dbPool.query(`SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')`);
        return parseInt(res.rows[0].count);
    },

    logAdminAction: async (params: { admin_id: string; action: string; target_user_id?: string; details?: any; }) => {
        console.log('Admin action logged:', params);
    }
};
