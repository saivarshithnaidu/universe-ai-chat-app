const { Pool } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupVector() {
    try {
        console.log("🚀 Enabling pgvector and creating document_chunks table...");
        
        // 1. Enable vector extension
        await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
        
        // 2. Create document_chunks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS document_chunks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                embedding VECTOR(1536), -- Optimized for OpenAI text-embedding-3-small
                metadata JSONB,
                created_at TIMESTAMP DEFAULT now()
            );
        `);
        
        // 3. Create vector index for faster search (Cosine Similarity)
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
            ON document_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        `);

        console.log("✅ Vector search infrastructure is READY.");
        await pool.end();
    } catch (e) {
        console.error("❌ Vector Setup Error:", e.message);
        process.exit(1);
    }
}

setupVector();
