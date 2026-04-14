const { Pool } = require('pg');

async function hammer() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const conn = "postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";
    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

    try {
        const targetId = '476591ab-c4be-4e60-832d-2cf0cb976b85';
        console.log(`Force-migrating all chats to: ${targetId}`);
        const res = await pool.query('UPDATE chats SET user_id = $1', [targetId]);
        console.log(`✅ SUCCESS: ${res.rowCount} chats are now linked to your account.`);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

hammer();
