process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const accounts = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'accounts' AND table_schema = 'public'");
  console.log('Accounts Nullability:', accounts.rows);
  
  const users = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'");
  console.log('Users Nullability:', users.rows);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
