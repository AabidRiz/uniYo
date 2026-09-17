const express = require('express');
const { pool } = require('./db.cjs');
const { embedText, generateAnswer } = require('./embeddings.cjs');
const { getSystemPrompt, getAllowedSources } = require('./prompts.cjs');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { role, message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'message required' });

    const queryEmbedding = await embedText(message.trim());
    const allowedTypes = getAllowedSources(role);

    const result = await pool.query(
      `SELECT content, source_type, source_id,
              1 - (embedding <=> $1::vector) AS similarity
       FROM rag_documents
       WHERE source_type = ANY($2::text[])
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [JSON.stringify(queryEmbedding), allowedTypes]
    );

    const context = result.rows
      .map((r, i) => `[${i + 1}] (${r.source_type})\n${r.content}`)
      .join('\n\n');

    const answer = await generateAnswer(context, message.trim(), getSystemPrompt(role));

    res.json({
      response: answer,
      sources: result.rows.map(r => ({
        type: r.source_type,
        id: r.source_id,
        similarity: Number(r.similarity.toFixed(4))
      }))
    });
  } catch (err) {
    console.error('/api/ai/chat failed:', err.message);
    res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

module.exports = router;
