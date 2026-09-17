const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();
  const r = await c.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'");
  console.log('TABLES:', r.rows[0].count);
  const t = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log(t.rows.map(x => x.table_name).join('\n'));
  await c.end();
})().catch(e => console.error('ERR:', e.message));
