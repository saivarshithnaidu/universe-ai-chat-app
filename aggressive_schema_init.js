const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Running aggressive schema init...");
        
        const queries = [
            `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                "emailVerified" TIMESTAMP,
                image TEXT,
                created_at TIMESTAMP DEFAULT now()
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
            `CREATE TABLE IF NOT EXISTS verification_token (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TIMESTAMP NOT NULL,
                PRIMARY KEY (identifier, token)
            );`
        ];
        
        for (const q of queries) {
            console.log(`Executing: ${q.substring(0, 50)}...`);
            await pool.query(q);
        }
        
        console.log("Aggressive Schema Init SUCCESSFUL.");
        await pool.end();
    } catch (e) {
        console.error("CRITICAL SCHEMA ERROR:", e.message);
        if (e.detail) console.error("DETAIL:", e.detail);
        process.exit(1);
    }
}

run();
