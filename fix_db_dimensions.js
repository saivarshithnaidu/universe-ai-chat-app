const { Pool } = require('pg');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetVectorTable() {
  console.log("🚀 Starting Database Vector Dimension Sync (384D)...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("⚠️  Cleaning up old 1536-D table...");
    await client.query('DROP TABLE IF EXISTS document_chunks CASCADE');

    console.log("✨  Creating new 384-D Vector Table (Optimized for Local MiniLM)...");
    await client.query(`
      CREATE TABLE document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          embedding vector(384),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("⚡  Rebuilding Search Indexes...");
    await client.query('CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
    await client.query('CREATE INDEX idx_chunks_user_id ON document_chunks(user_id);');

    await client.query('COMMIT');
    console.log("✅  SUCCESS! Your database is now 100% compatible with the local embedding engine.");
    console.log("👉  You can now upload PDFs without any errors.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌  SYNC FAILED:", e.message);
  } finally {
    client.release();
    process.exit();
  }
}

resetVectorTable();
