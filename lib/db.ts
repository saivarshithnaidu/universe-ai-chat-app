import { Pool } from 'pg';
import crypto from 'crypto';

// Encryption configuration for API keys
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET ? crypto.createHash('sha256').update(String(process.env.NEXTAUTH_SECRET)).digest('base64').substring(0, 32) : '32-char-encryption-key-fallback'; 
const IV_LENGTH = 16;

// Bypassing SSL self-signed certificate issues for local development with remote databases (Supabase/Neon)
// Force ignore SSL errors for local dev stability
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is missing from environment!");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: {
        rejectUnauthorized: false
    }
});

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
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS model TEXT;`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS fallback BOOLEAN DEFAULT FALSE;`,
            `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT,
                email TEXT UNIQUE,
                "emailVerified" TIMESTAMP,
                email_verified TIMESTAMP,
                image TEXT,
                created_at TIMESTAMP DEFAULT now(),
                is_premium BOOLEAN DEFAULT FALSE,
                premium_trial_used INTEGER DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                last_message_at TIMESTAMP,
                plan TEXT DEFAULT 'free',
                daily_usage_count INTEGER DEFAULT 0,
                token_usage INTEGER DEFAULT 0,
                subscription_start TIMESTAMP,
                subscription_end TIMESTAMP,
                "resumeText" TEXT
            );`,
            `CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                provider TEXT NOT NULL,
                provider_account_id TEXT NOT NULL,
                refresh_token TEXT,
                access_token TEXT,
                expires_at BIGINT,
                token_type TEXT,
                scope TEXT,
                id_token TEXT,
                session_state TEXT,
                UNIQUE (provider, provider_account_id)
            );`,
            `CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                session_token TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires TIMESTAMP NOT NULL
            );`,
            `CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                title TEXT,
                share_token TEXT UNIQUE,
                is_public BOOLEAN DEFAULT FALSE,
                shared_at TIMESTAMP,
                project_files JSONB DEFAULT '{}',
                project_framework TEXT DEFAULT 'react',
                created_at TIMESTAMP DEFAULT now()
            );`,
            `-- ensure project_framework exists
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chats' AND column_name='project_framework') THEN
                    ALTER TABLE chats ADD COLUMN project_framework TEXT DEFAULT 'react';
                END IF;
            END $$;`,
            `CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
                role TEXT CHECK (role IN ('user', 'assistant')),
                model TEXT,
                content TEXT,
                status TEXT DEFAULT 'success',
                fallback BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS usage_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                model_used TEXT,
                tokens_used INTEGER,
                timestamp TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS user_tools (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                tool_key TEXT NOT NULL,
                api_key TEXT,
                connected_at TIMESTAMP DEFAULT now(),
                UNIQUE(user_id, tool_key)
            );`,
            `CREATE TABLE IF NOT EXISTS billing_details (
                user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                address_line1 TEXT NOT NULL,
                address_line2 TEXT,
                area TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                pincode TEXT NOT NULL,
                country TEXT DEFAULT 'India',
                updated_at TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS rate_limits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT now()
            );`,
            `CREATE INDEX IF NOT EXISTS idx_rate_limits_key_timestamp ON rate_limits(key, timestamp);`,
            `ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_files JSONB DEFAULT '{}';`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;`,
            `DO $$ BEGIN
                ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resumeText" TEXT;`
        ];

        for (const query of queries) {
            try {
                await dbPool.query(query);
            } catch (e: any) {
                if (!e.message.includes('already exists')) {
                    console.warn("Schema Init Warning:", e.message);
                }
            }
        }
    },

    async upsertUser(id: string, email?: string) {
        if (email) {
            await dbPool.query(
                `INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
                [id, email]
            );
        } else {
            await dbPool.query(
                `INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
                [id]
            );
        }
    },

    async getUser(id: string) {
        const res = await dbPool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return res.rows[0];
    },

    async getChats(userId: string): Promise<Chat[]> {
        const res = await dbPool.query(
            `SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows;
    },

    async createChat(userId: string, title: string = 'New Chat'): Promise<Chat> {
        const res = await dbPool.query(
            `INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *`,
            [userId, title]
        );
        return res.rows[0];
    },

    async saveMessage(chatId: string, role: string, content: string, model: string = '', status: string = 'success', fallback: boolean = false) {
        const res = await dbPool.query(
            `INSERT INTO messages (chat_id, role, content, model, status, fallback) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [chatId, role, content, model, status, fallback]
        );
        return res.rows[0];
    },

    async getChat(chatId: string): Promise<Chat | null> {
        const res = await dbPool.query(`SELECT * FROM chats WHERE id = $1`, [chatId]);
        return res.rows[0] || null;
    },

    async updateChatTitle(chatId: string, userId: string, title: string) {
        await dbPool.query(
            `UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3`,
            [title, chatId, userId]
        );
    },

    async generateShareToken(chatId: string, userId: string) {
        const token = crypto.randomBytes(16).toString('hex');
        await dbPool.query(
            `UPDATE chats SET share_token = $1, is_public = true, shared_at = now() WHERE id = $2 AND user_id = $3`,
            [token, chatId, userId]
        );
        return token;
    },

    async getChatByShareToken(token: string): Promise<Chat | null> {
        const res = await dbPool.query(
            `SELECT * FROM chats WHERE share_token = $1 AND is_public = true`,
            [token]
        );
        return res.rows[0] || null;
    },

    async deleteUser(userId: string) {
        await dbPool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    },

    async upgradeToPremium(userId: string, plan: string = 'pro') {
        const isPremium = plan !== 'free';
        await dbPool.query(
            `UPDATE users SET plan = $1, is_premium = $2 WHERE id = $3`,
            [plan, isPremium, userId]
        );
    },

    async getChatMessages(chatId: string, userId: string): Promise<Message[]> {
        const res = await dbPool.query(
            `SELECT m.* FROM messages m 
             JOIN chats c ON m.chat_id = c.id 
             WHERE c.id = $1 AND c.user_id = $2 
             ORDER BY m.created_at ASC`,
            [chatId, userId]
        );
        return res.rows;
    },

    async deleteChat(chatId: string, userId: string) {
        await dbPool.query(`DELETE FROM chats WHERE id = $1 AND user_id = $2`, [chatId, userId]);
    },

    async getUserResumeText(userId: string): Promise<string | null> {
        const res = await dbPool.query(`SELECT "resumeText" FROM users WHERE id = $1`, [userId]);
        return res.rows[0]?.resumeText || null;
    },

    async updateUserResume(userId: string, text: string) {
        await dbPool.query(`UPDATE users SET "resumeText" = $1 WHERE id = $2`, [text, userId]);
    },

    async getUserTool(userId: string, toolKey: string) {
        const res = await dbPool.query(
            `SELECT * FROM user_tools WHERE user_id = $1 AND tool_key = $2`,
            [userId, toolKey]
        );
        const row = res.rows[0];
        if (!row || !row.api_key) return null;
        
        try {
            const [ivHex, encryptedHex] = row.api_key.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return { ...row, api_key: decrypted };
        } catch (e) {
            return row;
        }
    },

    async upsertUserTool(userId: string, toolKey: string, apiKey: string) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedKey = `${iv.toString('hex')}:${encrypted}`;

        await dbPool.query(
            `INSERT INTO user_tools (user_id, tool_key, api_key)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, tool_key) DO UPDATE SET 
                api_key = EXCLUDED.api_key,
                connected_at = now()`,
            [userId, toolKey, encryptedKey]
        );
    },

    async deleteUserTool(userId: string, toolKey: string) {
        await dbPool.query(`DELETE FROM user_tools WHERE user_id = $1 AND tool_key = $2`, [userId, toolKey]);
    },

    async listUserTools(userId: string) {
        const res = await dbPool.query(`SELECT tool_key, connected_at FROM user_tools WHERE user_id = $1`, [userId]);
        return res.rows;
    },

    async saveUserTool(userId: string, toolKey: string, apiKey: string) {
        return this.upsertUserTool(userId, toolKey, apiKey);
    },

    async updateChatProjectFiles(chatId: string, files: any) {
        try {
            await dbPool.query(
                `UPDATE chats SET project_files = $1 WHERE id = $2`,
                [JSON.stringify(files), chatId]
            );
        } catch (e: any) {
            console.warn("[DB WARNING] Could not update project_files. Schema might be out of sync:", e.message);
        }
    },

    async getChatProjectFiles(chatId: string) {
        if (!chatId) return {};
        try {
            const res = await dbPool.query(
                `SELECT project_files FROM chats WHERE id = $1`,
                [chatId]
            );
            return res.rows[0]?.project_files || {};
        } catch (e: any) {
            console.warn("[DB WARNING] Could not fetch project_files. Schema might be out of sync:", e.message);
            return {};
        }
    },

    async logUsage(userId: string, modelUsed: string, tokensUsed: number) {
        await dbPool.query(
            `INSERT INTO usage_logs (user_id, model_used, tokens_used) VALUES ($1, $2, $3)`,
            [userId, modelUsed, tokensUsed]
        );
    },

    async saveBillingDetails(userId: string, data: any) {
        await dbPool.query(
            `INSERT INTO billing_details (user_id, name, phone, address_line1, address_line2, area, city, state, pincode, country, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
             ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                address_line1 = EXCLUDED.address_line1,
                address_line2 = EXCLUDED.address_line2,
                area = EXCLUDED.area,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                pincode = EXCLUDED.pincode,
                country = EXCLUDED.country,
                updated_at = now()`,
            [userId, data.name, data.phone, data.address_line1, data.address_line2, data.area, data.city, data.state, data.pincode, data.country]
        );
    },

    async getBillingDetails(userId: string) {
        const res = await dbPool.query(`SELECT * FROM billing_details WHERE user_id = $1`, [userId]);
        return res.rows[0] || null;
    },

    async checkRateLimit(key: string, limit: number, windowSeconds: number) {
        try {
            const now = new Date();
            const windowStart = new Date(now.getTime() - (windowSeconds * 1000));
            
            // Clean old
            await dbPool.query(`DELETE FROM rate_limits WHERE timestamp < $1`, [windowStart]);
            
            // Count current
            const countRes = await dbPool.query(`SELECT COUNT(*) FROM rate_limits WHERE key = $1 AND timestamp >= $2`, [key, windowStart]);
            const count = parseInt(countRes.rows[0].count);
            
            if (count < limit) {
                await dbPool.query(`INSERT INTO rate_limits (key, timestamp) VALUES ($1, $2)`, [key, now]);
                return { success: true, remaining: limit - count - 1 };
            }
            
            return { success: false, remaining: 0 };
        } catch (e: any) {
            console.error("Rate Limit Error:", e.message);
            return { success: true, remaining: 0 }; // Fail open to avoid blocking users
        }
    }
};

// Ensure single instance in dev used by Next.js hot reload
export let dbPool: Pool;
let schemaInitialized = false;

if (process.env.NODE_ENV === 'production') {
    dbPool = pool;
    // Attempt schema sync once per instance in production
    if (!schemaInitialized) {
        schemaInitialized = true;
        db.initSchema().catch(e => {
            schemaInitialized = false; // reset on error to allow retry
            console.error("Production Schema Sync Warning:", e);
        });
    }
} else {
    if (!(global as any).dbPool) {
        (global as any).dbPool = pool;
        // Test connection and Init Schema in dev
        pool.query('SELECT 1').then(() => {
            console.log("✅ Database Connected Successfully (SSL Bypassed)");
            db.initSchema().catch(e => console.error("Schema Init Error:", e));
        }).catch(err => {
            console.error("❌ Database Connection Failed:", err.message);
        });
    }
    dbPool = (global as any).dbPool;
}

export interface Chat {
    id: string;
    user_id: string;
    title: string | null;
    created_at: Date;
    project_files?: any;
    project_framework?: string;
}

export interface Message {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant';
    model: string | null;
    content: string;
    status: 'success' | 'failed' | 'busy';
    fallback: boolean;
    created_at: Date;
}
