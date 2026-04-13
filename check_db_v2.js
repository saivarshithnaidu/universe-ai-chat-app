const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log("Checking DB tables...");
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log("Registered Tables:", JSON.stringify(tables.rows.map(r => r.table_name), null, 2));
        
        for (const table of ['users', 'accounts', 'sessions']) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`Table '${table}' exists. Count: ${res.rows[0].count}`);
                
                const cols = await pool.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [table]);
                console.log(`Columns in ${table}:`, cols.rows.map(c => c.column_name).join(', '));
            } catch (e) {
                console.log(`Table '${table}' does NOT exist or error: ${e.message}`);
            }
        }
        
        await pool.end();
    } catch (e) {
        console.error("Critical Check Failed:", e);
    }
}

check();
