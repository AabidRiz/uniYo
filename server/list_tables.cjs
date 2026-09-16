const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'uniyo_db'
  });
  await c.connect();
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log('TABLES IN uniyo_db (' + r.rowCount + '):');
  r.rows.forEach(x => console.log(' -', x.tablename));
  await c.end();
})().catch(e => console.error('ERR:', e.message));