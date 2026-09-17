const { pipeline } = require('@xenova/transformers');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function embedText(text) {
  const model = await getEmbedder();
  const out = await model(String(text).slice(0, 8000), { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

async function generateAnswer(context, question, systemPrompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Reference material:\n\n${context || '(no relevant records found)'}\n\nUser question: ${question}` }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Groq failed: ${JSON.stringify(data)}`);
  return data.choices[0].message.content;
}

module.exports = { embedText, generateAnswer };
