const { Pool } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    let out = "";
    try {
        const tables = ['users', 'accounts', 'sessions', 'chats', 'messages', 'usage_logs', 'rate_limits', 'billing_details'];
        for (const table of tables) {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY column_name
            `, [table]);
            if (cols.rows.length === 0) {
                out += `Table ${table}: DOES NOT EXIST\n`;
            } else {
                out += `Columns in ${table}: ${cols.rows.map(c => c.column_name).join(', ')}\n`;
            }
        }
        await pool.end();
        fs.writeFileSync('db_full_schema_dump.txt', out);
    } catch (e) {
        fs.writeFileSync('db_full_schema_dump.txt', e.message);
    }
}

check();
