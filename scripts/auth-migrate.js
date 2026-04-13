const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/^"|"$/g, ''),
    ssl: { rejectUnauthorized: false }
});

async function migrateAuth() {
    console.log("🚀 Initializing NextAuth Schema...");
    
    const queries = [
        // 1. Add missing columns to users
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;`,
        
        // 2. Accounts
        `CREATE TABLE IF NOT EXISTS accounts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at BIGINT,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          UNIQUE(provider, "providerAccountId")
        );`,

        // 3. Sessions
        `CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires TIMESTAMP NOT NULL,
          "sessionToken" TEXT NOT NULL UNIQUE
        );`,
        
        // 4. Verification Token
        `CREATE TABLE IF NOT EXISTS verification_token (
          identifier TEXT NOT NULL,
          token TEXT NOT NULL,
          expires TIMESTAMP NOT NULL,
          PRIMARY KEY (identifier, token)
        );`
    ];
    
    try {
        for (const q of queries) {
            console.log(`Executing: ${q.substring(0, 50)}...`);
            await pool.query(q);
        }
        console.log("✅ NextAuth Schema ready.");
    } catch (err) {
        console.error("❌ Auth Migration Failed:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrateAuth();
