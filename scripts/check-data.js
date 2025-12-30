require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

async function checkData() {
    try {
        console.log("Checking database data...");
        const usersRes = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`Users count: ${usersRes.rows[0].count}`);

        const chatsRes = await pool.query('SELECT COUNT(*) FROM chats');
        console.log(`Chats count: ${chatsRes.rows[0].count}`);

        if (parseInt(chatsRes.rows[0].count) > 0) {
            const lastChat = await pool.query('SELECT * FROM chats ORDER BY created_at DESC LIMIT 1');
            console.log('Latest chat:', lastChat.rows[0]);
        }

        const messagesRes = await pool.query('SELECT COUNT(*) FROM messages');
        console.log(`Messages count: ${messagesRes.rows[0].count}`);

    } catch (err) {
        console.error("Error querying data:", err);
    } finally {
        await pool.end();
    }
}

checkData();
