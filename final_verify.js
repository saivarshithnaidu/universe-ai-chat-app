const { Pool } = require('pg');
const fs = require('fs');

async function verify() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const env = fs.readFileSync('.env.local', 'utf8');
    const conn = env.match(/DATABASE_URL=['\x22]?([^'\x22\n]+)['\x22]?/)[1];
    
    const pool = new Pool({
        connectionString: conn,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("--- Production Verification ---");
        const res = await pool.query('SELECT count(*) FROM chats WHERE user_id = $1', ['test-uuid-1']);
        console.log('CHATS COUNT FOR test-uuid-1:', res.rows[0].count);
        
        const res2 = await pool.query('SELECT id, title FROM chats WHERE user_id = $1 LIMIT 5', ['test-uuid-1']);
        console.log('SAMPLE CHATS:', res2.rows);
        
        const res3 = await pool.query('SELECT email FROM users WHERE id = $1', ['test-uuid-1']);
        console.log('USER EMAIL:', res3.rows[0]?.email || 'No email found');
        
    } catch (e) {
        console.error("VERIFICATION FAILED:", e.message);
    } finally {
        await pool.end();
    }
}

verify();
