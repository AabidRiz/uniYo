const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();
  const m = await c.query("SELECT id, investment_id, investor_id, student_id, status FROM investment_meetings WHERE id='invmeet_1789581807392'");
  console.log('MEETING:', m.rows[0]);
  const inv = await c.query("SELECT id, project_id, student_lead, investor_id FROM investment_interests WHERE id=$1", [m.rows[0]?.investment_id]);
  console.log('INVESTMENT:', inv.rows[0]);
  await c.end();
})().catch(e => console.error(e.message));
