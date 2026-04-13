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
        for (const table of ['users', 'accounts']) {
            const cols = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY column_name
            `, [table]);
            out += `Columns in ${table}: ${cols.rows.map(c => c.column_name).join(', ')}\n`;
        }
        await pool.end();
        fs.writeFileSync('db_columns_dump.txt', out);
    } catch (e) {
        fs.writeFileSync('db_columns_dump.txt', e.message);
    }
}

check();
