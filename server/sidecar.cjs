const express = require('express');
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

let embedder = null;
const cache = new Map();
let queue = Promise.resolve();

function enqueue(fn) {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding model ready.');
  }
  return embedder;
}

app.get('/health', (_req, res) => res.json({ status: 'ok', cached: cache.size }));
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'UniYO sidecar' }));

app.post('/embed', async (req, res) => {
  try {
    const text = (req.body && req.body.text) || '';
    if (!text) return res.status(400).json({ error: 'text required' });

    if (cache.has(text)) {
      return res.json({ embedding: cache.get(text), cached: true });
    }

    const embedding = await enqueue(async () => {
      const model = await getEmbedder();
      const out = await model(String(text).slice(0, 8000), { pooling: 'mean', normalize: true });
      return Array.from(out.data);
    });

    if (cache.size >= 500) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(text, embedding);

    return res.json({ embedding });
  } catch (e) {
    console.error('embed error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Embedding sidecar listening on port ${PORT}`));
