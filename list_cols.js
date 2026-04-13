const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        for (const table of ['users', 'accounts']) {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            console.log(`Columns in ${table}:`, cols.rows.map(c => c.column_name).join(', '));
        }
        await pool.end();
    } catch (e) {
        console.error(e.message);
    }
}

check();
