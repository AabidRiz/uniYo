const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: 'localhost', port: 5432, user: 'postgres',
    password: '1234', database: 'uniyo_db'
  });
  await c.connect();

  console.log('--- Searching for Dulanjaya ---');
  const found = await c.query(
    "SELECT id, name, email, role FROM users WHERE name ILIKE $1",
    ['%dulanjaya%']
  );
  console.log(found.rows);

  if (found.rows.length === 0) {
    console.log('No user found matching "dulanjaya".');
    await c.end();
    return;
  }

  console.log('--- Flipping role to student ---');
  const updated = await c.query(
    "UPDATE users SET role='student' WHERE name ILIKE $1 RETURNING id, name, role",
    ['%dulanjaya%']
  );
  console.log(updated.rows);

  await c.end();
})().catch(e => console.error('ERR:', e.message));