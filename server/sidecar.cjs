const express = require('express');
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

let embedder = null;
async function getEmbedder() {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embedder;
}

app.post('/embed', async (req, res) => {
  try {
    const text = (req.body && req.body.text) || '';
    if (!text) return res.status(400).json({ error: 'text required' });
    const model = await getEmbedder();
    const out = await model(String(text).slice(0, 8000), { pooling: 'mean', normalize: true });
    return res.json({ embedding: Array.from(out.data) });
  } catch (e) {
    console.error('embed error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(5001, () => console.log('Embedding sidecar on http://localhost:5001'));
