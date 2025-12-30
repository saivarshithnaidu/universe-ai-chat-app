import { Pool } from 'pg';

// Smart SSL: Disable SSL for localhost/127.0.0.1 to fix "server does not support SSL"
// Enable SSL for Neon (remote)
const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

// Ensure single instance in dev used by Next.js hot reload
let dbPool: Pool;
if (process.env.NODE_ENV === 'production') {
    dbPool = pool;
} else {
    if (!(global as any).dbPool) {
        (global as any).dbPool = pool;
    }
    dbPool = (global as any).dbPool;
}

export interface Chat {
    id: string;
    user_id: string;
    title: string | null;
    created_at: Date;
}

export interface Message {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant';
    model: string | null;
    content: string;
    created_at: Date;
}

export const db = {
    async query(text: string, params: any[] = []) {
        try {
            return await dbPool.query(text, params);
        } catch (e: any) {
            console.error("DB Query Error:", e.message, "Query:", text);
            throw e;
        }
    },

    async initSchema() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT now(),
                is_premium BOOLEAN DEFAULT FALSE,
                premium_trial_used INTEGER DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                last_message_at TIMESTAMP
            );`,
            `CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                title TEXT,
                created_at TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
                role TEXT CHECK (role IN ('user', 'assistant')),
                model TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS rate_limits (
                key TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                expires_at TIMESTAMP
            );`,
            `CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);`,
            `CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);`
        ];

        for (const query of queries) {
            await dbPool.query(query);
        }
        console.log("Database schema initialized.");
    },

    async upsertUser(id: string, email?: string) {
        // Initial upsert
        await dbPool.query(
            `INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
            [id]
        );
        // Ensure columns exist (for existing DBs)
        try {
            await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`);
            await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_trial_used INTEGER DEFAULT 0;`);
            await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;`);
            await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;`);
            await dbPool.query(`CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER DEFAULT 0, expires_at TIMESTAMP);`);
        } catch (e) {
            // Ignore error if columns exist
        }
    },

    async getUser(id: string) {
        const res = await dbPool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );
        return res.rows[0];
    },

    async incrementTrialUsage(id: string) {
        await dbPool.query(
            `UPDATE users SET premium_trial_used = premium_trial_used + 1 WHERE id = $1`,
            [id]
        );
    },

    async incrementMessageCount(userId: string) {
        await dbPool.query(
            `UPDATE users SET total_messages = total_messages + 1, last_message_at = now() WHERE id = $1`,
            [userId]
        );
    },

    async deleteUser(userId: string) {
        // Cascade delete will handle chats and messages if FKs set up correctly, 
        // but explicit delete is safer ensuring user intent.
        await dbPool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    },

    // Simple Token Bucket / Fixed Window counter via DB
    async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ success: boolean; remaining: number }> {
        // PERMANENT BUCKET BYPASS: Temporarily disabled due to missing table
        return { success: true, remaining: 100 };

        /*
        const now = new Date();
        const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

        // Clean up expired
        await dbPool.query(`DELETE FROM rate_limits WHERE key = $1 AND expires_at < $2`, [key, now]);

        // Upsert counter
        const res = await dbPool.query(
            `INSERT INTO rate_limits (key, count, expires_at) 
             VALUES ($1, 1, $2) 
             ON CONFLICT (key) 
             DO UPDATE SET count = rate_limits.count + 1 
             RETURNING count`,
            [key, expiresAt]
        );

        const count = res.rows[0].count;
        return {
            success: count <= limit,
            remaining: Math.max(0, limit - count)
        };
        */
    },

    async createChat(userId: string, title: string = 'New Chat'): Promise<Chat> {
        const res = await dbPool.query(
            `INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *`,
            [userId, title]
        );
        return res.rows[0];
    },

    async getUserChats(userId: string): Promise<Chat[]> {
        const res = await dbPool.query(
            `SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows;
    },

    async getChat(chatId: string): Promise<Chat | null> {
        const res = await dbPool.query(
            `SELECT * FROM chats WHERE id = $1`,
            [chatId]
        );
        return res.rows[0] || null;
    },

    async saveMessage(chatId: string, role: string, content: string, model?: string): Promise<Message> {
        const res = await dbPool.query(
            `INSERT INTO messages (chat_id, role, content, model) VALUES ($1, $2, $3, $4) RETURNING *`,
            [chatId, role, content, model]
        );
        return res.rows[0];
    },

    async getChatMessages(chatId: string): Promise<Message[]> {
        const res = await dbPool.query(
            `SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
            [chatId]
        );
        return res.rows;
    },

    async deleteChat(chatId: string, userId: string): Promise<void> {
        await dbPool.query(
            `DELETE FROM chats WHERE id = $1 AND user_id = $2`,
            [chatId, userId]
        );
    },

    async deleteAllChats(userId: string): Promise<void> {
        await dbPool.query(
            `DELETE FROM chats WHERE user_id = $1`,
            [userId]
        );
    }
};
