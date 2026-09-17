const { Client } = require('pg');
(async () => {
  const c = new Client({
    host: 'localhost', port: 5432,
    user: 'postgres', password: '1234',
    database: 'uniyo_db'
  });
  await c.connect();
  const r = await c.query("SELECT * FROM pg_available_extensions WHERE name='vector'");
  console.log('pgvector available:', r.rows.length > 0);
  if (r.rows.length > 0) {
    console.log('Details:', r.rows[0]);
  }
  await c.end();
})().catch(e => console.error('ERR:', e.message));
