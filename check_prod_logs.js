process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query("SELECT * FROM rate_limits LIMIT 10");
  console.log('Production rate_limits sample:');
  console.log(res.rows);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
