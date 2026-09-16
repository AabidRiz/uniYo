const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();
  const r = await c.query(`SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'internship_applications'
    ORDER BY ordinal_position`);
  console.table(r.rows);
  await c.end();
})().catch(e => console.error(e.message));
