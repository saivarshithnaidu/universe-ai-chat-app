const { Pool } = require('pg');

async function audit() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const conn = "postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";
    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query('SELECT id, email FROM users');
        console.log("--- PRODUCTION USERS ---");
        res.rows.forEach(u => console.log(`${u.id} | ${u.email}`));
    } finally {
        await pool.end();
    }
}

audit();
