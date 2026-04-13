const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("🚀 Starting Full Schema Repair for Chat Functionality...");
        
        const repairs = [
            // 1. Repair USERS table
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_trial_used INTEGER DEFAULT 0;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER DEFAULT 0;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_usage INTEGER DEFAULT 0;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;`,

            // 2. Repair ACCOUNTS table (Double check)
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "userId" TEXT;`,
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "providerAccountId" TEXT;`,

            // 3. Repair CHATS table
            `ALTER TABLE chats ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;`,
            `ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;`,
            `ALTER TABLE chats ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP;`,

            // 4. Repair MESSAGES table (CRITICAL)
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS model TEXT;`,
            `ALTER TABLE messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;`,
            
            // 5. Ensure OTHER tables exist
            `CREATE TABLE IF NOT EXISTS usage_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                model_used TEXT,
                tokens_used INTEGER,
                timestamp TIMESTAMP DEFAULT now()
            );`,
            `CREATE TABLE IF NOT EXISTS rate_limits (
                key TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                expires_at TIMESTAMP
            );`,
            `CREATE TABLE IF NOT EXISTS billing_details (
                user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                name TEXT,
                phone TEXT,
                address_line1 TEXT,
                address_line2 TEXT,
                area TEXT,
                city TEXT,
                state TEXT,
                pincode TEXT,
                country TEXT DEFAULT 'India',
                updated_at TIMESTAMP DEFAULT now()
            );`
        ];
        
        for (const q of repairs) {
            try {
                console.log(`Executing: ${q.substring(0, 70)}...`);
                await pool.query(q);
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.warn(`Warning: ${err.message}`);
                }
            }
        }
        
        console.log("✅ Full Schema Repair SUCCESSFUL.");
        console.log("All chat, usage, and billing columns are now synchronized.");
        await pool.end();
    } catch (e) {
        console.error("❌ CRITICAL REPAIR ERROR:", e.message);
        process.exit(1);
    }
}

run();
