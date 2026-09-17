const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();

  const tables = (await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `)).rows;

  const out = [];
  for (const t of tables) {
    const cols = (await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position
    `, [t.table_name])).rows;
    out.push(`\n=== ${t.table_name} ===`);
    for (const col of cols) {
      out.push(`  ${col.column_name.padEnd(28)} ${col.data_type.padEnd(30)} null=${col.is_nullable}`);
    }
  }

  const fs = require('fs');
  fs.writeFileSync('schema_dump.txt', out.join('\n'));
  console.log('Wrote schema_dump.txt');
  await c.end();
})().catch(e => console.error('ERR:', e.message));
