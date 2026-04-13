const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/^"|"$/g, ''),
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const { rows } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Supabase Tables:", rows.map(r => r.table_name));
        
        const { rows: userCols } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log("Users Columns:", userCols.map(c => c.column_name));
    } catch (err) {
        console.error("Check Failed:", err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

check();
