const { Client } = require('pg');
(async () => {
  const c = new Client({ host:'localhost', port:5432, user:'postgres', password:'1234', database:'uniyo_db' });
  await c.connect();

  const cols = [
    'user_id VARCHAR(100)',
    'university VARCHAR(255)',
    'gpa VARCHAR(50)',
    'email VARCHAR(255)',
    'phone VARCHAR(100)',
    'degree VARCHAR(255)',
    'faculty VARCHAR(255)',
    'experience TEXT',
    'cv_base64 TEXT',
    'cv_name VARCHAR(255)',
    "status VARCHAR(50) DEFAULT 'Applied'"
  ];
  for (const col of cols) {
    await c.query('ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS ' + col);
  }

  await c.query(`CREATE TABLE IF NOT EXISTS investment_meetings (
    id VARCHAR(100) PRIMARY KEY,
    investment_id VARCHAR(100) REFERENCES investment_interests(id) ON DELETE CASCADE,
    investor_id VARCHAR(100),
    student_id VARCHAR(100),
    date VARCHAR(100),
    time VARCHAR(100),
    link TEXT,
    message TEXT,
    status VARCHAR(40) DEFAULT 'Proposed',
    change_request TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const cols2 = [
    'investor_id VARCHAR(100)',
    'student_id VARCHAR(100)',
    'change_request TEXT',
    'message TEXT',
    "status VARCHAR(40) DEFAULT 'Proposed'"
  ];
  for (const col of cols2) {
    await c.query('ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS ' + col);
  }

  console.log('✅ Done');
  await c.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
