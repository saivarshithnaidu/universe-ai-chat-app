const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'messages' AND table_schema = 'public'
        `);
        console.log("Columns in 'messages' table:");
        res.rows.forEach(row => console.log(`- ${row.column_name}`));
        await pool.end();
    } catch (e) {
        console.error("Diagnostic Error:", e.message);
    }
}

check();
