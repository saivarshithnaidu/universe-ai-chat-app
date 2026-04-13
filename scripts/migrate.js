require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log("Starting DB Migration...");
    
    const queries = [
        `CREATE TABLE IF NOT EXISTS billing_details (
            user_id TEXT PRIMARY KEY,
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
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_usage INTEGER DEFAULT 0;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;`,
        `CREATE TABLE IF NOT EXISTS usage_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT,
            model_used TEXT,
            tokens_used INTEGER,
            timestamp TIMESTAMP DEFAULT now()
        );`
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log("Successfully ran:", query.split('(')[0].trim());
        } catch (err) {
            console.error("Error running query:", query);
            console.error(err.message);
        }
    }

    console.log("Migration completed.");
    process.exit(0);
}

migrate();
