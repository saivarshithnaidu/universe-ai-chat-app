const { Pool } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function merge() {
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
        const email = 'pujalasaivarshith@gmail.com';
        console.log(`Merging into: ${email}`);

        const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.error("Target user not found. Please log in first.");
            return;
        }
        const newId = userRes.rows[0].id;

        const res = await pool.query('UPDATE chats SET user_id = $1 WHERE user_id != $1', [newId]);
        console.log(`Success: ${res.rowCount} chats restored to your current profile.`);

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

merge();
