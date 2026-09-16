const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();

  // 1. Find the student (project owner) behind this investment
  const p = await c.query("SELECT owner_id, owner_name FROM projects WHERE id='proj_1789572192054'");
  console.log('PROJECT OWNER:', p.rows[0]);
  const studentId = p.rows[0]?.owner_id;

  if (!studentId) {
    console.log('No owner found — cannot fix.');
    await c.end();
    return;
  }

  // 2. Patch the meeting
  const r = await c.query(
    "UPDATE investment_meetings SET student_id=$1 WHERE id='invmeet_1789581807392' RETURNING id, investor_id, student_id, status",
    [studentId]
  );
  console.log('PATCHED MEETING:', r.rows[0]);

  await c.end();
})().catch(e => console.error('ERR:', e.message));
