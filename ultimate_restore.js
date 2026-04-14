const { Pool } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function restore() {
    let connectionString;
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        connectionString = env.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)[1];
    } catch (e) {
        console.error("Could not find DATABASE_URL in .env.local");
        return;
    }

    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Find the user with the most recent created_at or just the last record
        const userRes = await pool.query('SELECT id, email FROM users ORDER BY id DESC LIMIT 1');
        if (userRes.rows.length === 0) {
            console.error("No users found.");
            return;
        }
        
        const newId = userRes.rows[0].id;
        console.log(`FORCE Restoring ALL chats to User: ${userRes.rows[0].email} (${newId})`);

        const res = await pool.query('UPDATE chats SET user_id = $1', [newId]);
        console.log(`SUCCESS: ${res.rowCount} chats force-assigned.`);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

restore();
