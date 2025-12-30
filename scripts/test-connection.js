require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log("Testing connection to:", process.env.DATABASE_URL ? "Defined" : "Undefined");
        const client = await pool.connect();
        console.log("Connected to DB.");

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log("Tables found:", res.rows.map(r => r.table_name));

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("DB Connection Failed:", err);
        require('fs').writeFileSync('verification_error.txt', `Error: ${err.message}\nStack: ${err.stack}`);
        process.exit(1);
    }
}

testConnection();
