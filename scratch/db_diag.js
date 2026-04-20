const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

client.connect()
  .then(async () => {
    console.log("Connected to DB");
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:", tables.rows.map(r => r.table_name));

    // Check columns for users and accounts
    const columns = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'accounts')
      ORDER BY table_name, column_name
    `);
    console.log("Columns:", JSON.stringify(columns.rows, null, 2));

    // Check recent auth logs
    const logs = await client.query(`
      SELECT key, timestamp 
      FROM rate_limits 
      WHERE key LIKE 'AUTH_LOG%' 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.log("Auth Logs:", JSON.stringify(logs.rows, null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error("DB Error:", err);
    process.exit(1);
  });
