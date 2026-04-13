const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Repairing Schema Columns...");
        
        const repairs = [
            `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
            `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
            
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
             // Ensure all columns in accounts just in case
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;`,
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS access_token TEXT;`,
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS expires_at BIGINT;`,
            `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS id_token TEXT;`,
            
            `CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                session_token TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires TIMESTAMP NOT NULL
            );`,
            
            `CREATE TABLE IF NOT EXISTS verification_token (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TIMESTAMP NOT NULL,
                PRIMARY KEY (identifier, token)
            );`
        ];
        
        for (const q of repairs) {
            try {
                console.log(`Executing: ${q.substring(0, 50)}...`);
                await pool.query(q);
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.warn(`Warning on query: ${err.message}`);
                }
            }
        }
        
        console.log("Schema Repair SUCCESSFUL.");
        await pool.end();
    } catch (e) {
        console.error("CRITICAL SCHEMA ERROR:", e.message);
        process.exit(1);
    }
}

run();
