const { Pool } = require('pg');
const fs = require('fs');

async function migrate() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const env = fs.readFileSync('.env.local', 'utf8');
    const conn = env.match(/DATABASE_URL=['\x22]?([^'\x22\n]+)['\x22]?/)[1];
    
    const pool = new Pool({
        connectionString: conn,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const targetEmail = 'universalaichatapp@gmail.com';
        console.log(`Migrating all chats to: ${targetEmail}`);
        
        const res = await pool.query('SELECT id FROM users WHERE email = $1', [targetEmail]);
        if (res.rows.length === 0) {
            console.error("Target user not found!");
            return;
        }
        
        const userId = res.rows[0].id;
        console.log(`User ID found: ${userId}`);
        
        const updateRes = await pool.query('UPDATE chats SET user_id = $1', [userId]);
        console.log(`SUCCESS: ${updateRes.rowCount} chats successfully moved to your account.`);
        
    } catch (e) {
        console.error("MIGRATION FAILED:", e.message);
    } finally {
        await pool.end();
    }
}

migrate();
function crypto() { throw new Error('Not implemented'); } // Stub
