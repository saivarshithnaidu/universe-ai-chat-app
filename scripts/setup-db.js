const result = require('dotenv').config({ path: '.env' });
require('fs').writeFileSync('setup_keys.txt', 'Keys: ' + Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('NEXT')).join(', ') + '\nDotenv parsed: ' + JSON.stringify(result.parsed ? Object.keys(result.parsed) : 'null'));
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

async function init() {
    try {
        console.log("Connecting to Neon DB...");
        const client = await pool.connect();
        console.log("Connected.");

        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT now()
        );`,
            `CREATE TABLE IF NOT EXISTS chats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            title TEXT,
            created_at TIMESTAMP DEFAULT now()
        );`,
            `CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
            role TEXT CHECK (role IN ('user', 'assistant')),
            model TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT now()
        );`,
            `CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);`,
            `CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);`
        ];

        for (const query of queries) {
            await client.query(query);
        }
        console.log("Tables created successfully.");
        client.release();
    } catch (err) {
        console.error("Error initializing DB:", err);
        require('fs').writeFileSync('setup_error.txt',
            `Error: ${err.message}\n` +
            `Stack: ${err.stack}\n` +
            `ConnectionString: ${process.env.DATABASE_URL ? "Defined" : "Undefined"}\n` +
            `IsLocal: ${isLocal}\n`
        );
    } finally {
        await pool.end();
    }
}

init();
