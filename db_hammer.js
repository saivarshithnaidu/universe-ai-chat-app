process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.pncqcgtnvktdlgziodcd:UbdInGghdKZw82kZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function hammer() {
  console.log('Hammering DB schema to perfection...');
  
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  
  // Fix accounts unique constraint if it was broken
  try {
     // Drop old index if exists (next-auth usually creates one or we did with mismatch)
     await pool.query('ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_provider_provider_account_id_key');
  } catch(e) {}

  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'accounts' AND constraint_name = 'accounts_unique_provider_account') THEN
        ALTER TABLE accounts ADD CONSTRAINT accounts_unique_provider_account UNIQUE (provider, "providerAccountId");
      END IF;
    END $$;
  `);

  console.log('✅ DB Hammer complete.');
}

hammer().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
