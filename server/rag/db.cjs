const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.RAG_DB_URL });

async function initRagSchema() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        embedding VECTOR(384),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (source_type, source_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
      ON rag_documents USING hnsw (embedding vector_cosine_ops)
    `);
    console.log('RAG schema ready');
  } catch (e) {
    console.error('RAG schema init failed:', e.message);
    throw e;
  }
}

module.exports = { pool, initRagSchema };
