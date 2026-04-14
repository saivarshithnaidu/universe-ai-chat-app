const { Pool } = require('pg');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function scan() {
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
        console.log("--- DATABASE DEEP SCAN ---");
        
        // 1. List all users and their IDs
        const users = await pool.query('SELECT id, email, name FROM users');
        console.log("\nUSERS FOUND:", users.rows.length);
        users.rows.forEach(u => console.log(` - ${u.email} (ID: ${u.id})`));

        // 2. List all unique user_ids in the chats table
        const chatOwners = await pool.query('SELECT DISTINCT user_id, count(*) as chat_count FROM chats GROUP BY user_id');
        console.log("\nCHAT OWNERS IN DB:", chatOwners.rows.length);
        chatOwners.rows.forEach(c => console.log(` - ID: ${c.user_id} has ${c.chat_count} chats`));

        // 3. Peek at the latest chats to see what they are
        const latestChats = await pool.query('SELECT title, user_id, created_at FROM chats ORDER BY created_at DESC LIMIT 5');
        console.log("\nLATEST CHATS PEEK:");
        latestChats.rows.forEach(c => console.log(` - "${c.title}" by ${c.user_id} at ${c.created_at}`));

    } catch (err) {
        console.error("SCAN ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

scan();
