const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        console.log("Testing user creation...");
        const res = await pool.query(
            `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING *`,
            ['test-uuid-1', 'test@example.com', 'Test User']
        );
        console.log("User created:", res.rows[0]);
        
        console.log("Testing account creation...");
        const acc = await pool.query(
            `INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES ($1, $2, $3, $4) RETURNING *`,
            ['test-uuid-1', 'oauth', 'google', 'test-google-id']
        );
        console.log("Account created:", acc.rows[0]);
        
        console.log("Cleaning up...");
        await pool.query('DELETE FROM users WHERE id = $1', ['test-uuid-1']);
        console.log("Cleanup successful.");
        
        await pool.end();
    } catch (e) {
        console.error("Manual Entry Failed:", e.message);
        if (e.detail) console.error("Detail:", e.detail);
    }
}

test();
