const { Pool } = require('pg');

async function migrate() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    // Using the PRODUCTION hardcoded URL directly
    const conn = "postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";
    
    const pool = new Pool({
        connectionString: conn,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Searching for universalaichatapp@gmail.com in Production...");
        const res = await pool.query('SELECT id, email FROM users WHERE email ILIKE $1', ['universalaichatapp@gmail.com']);
        
        if (res.rows.length === 0) {
            console.error("User NOT FOUND in Production DB.");
            console.log("Available users in Production:");
            const allUsers = await pool.query('SELECT id, email FROM users');
            console.log(allUsers.rows);
            return;
        }
        
        const userId = res.rows[0].id;
        console.log(`Found User: ${res.rows[0].email} with ID: ${userId}`);
        
        const updateRes = await pool.query('UPDATE chats SET user_id = $1', [userId]);
        console.log(`SUCCESS: ${updateRes.rowCount} chats successfully moved to your account in Production.`);
        
    } catch (e) {
        console.error("MIGRATION FAILED:", e.message);
    } finally {
        await pool.end();
    }
}

migrate();
