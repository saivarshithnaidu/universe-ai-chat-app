const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("🛠️ Repairing 'messages' table with missing status and fallback columns...");
        
        await pool.query(`
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';
        `);
        await pool.query(`
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS fallback BOOLEAN DEFAULT FALSE;
        `);
        
        console.log("✅ Repair complete.");
        await pool.end();
    } catch (e) {
        console.error("❌ Repair failure:", e.message);
    }
}

run();
