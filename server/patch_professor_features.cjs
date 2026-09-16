const { Client } = require('pg');

const DB_CONFIG = { host: 'localhost', port: 5432, user: 'postgres', password: '1234', database: 'uniyo_db' };

async function patch() {
  const db = new Client(DB_CONFIG);
  await db.connect();
  console.log('Patching professor features…');

  // 1. Course enrollments
  await db.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id VARCHAR(100) PRIMARY KEY,
      student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      video_id VARCHAR(100) REFERENCES professor_videos(id) ON DELETE CASCADE,
      prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(30) DEFAULT 'Enrolled',
      is_paid BOOLEAN DEFAULT FALSE,
      amount_paid VARCHAR(50),
      transaction_id VARCHAR(100),
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, video_id)
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_video ON course_enrollments(video_id);`);

  // 2. Video pricing (each video can be free or paid)
  await db.query(`ALTER TABLE professor_videos ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;`);
  await db.query(`ALTER TABLE professor_videos ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'LKR';`);

  // 3. Session reviews
  await db.query(`
    CREATE TABLE IF NOT EXISTS session_reviews (
      id VARCHAR(100) PRIMARY KEY,
      session_id VARCHAR(100) REFERENCES professor_sessions(id) ON DELETE CASCADE,
      prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      student_name VARCHAR(255),
      student_avatar TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id)
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_reviews_prof ON session_reviews(prof_id);`);

  // 4. Consultation fee (in LKR, 0 = volunteer)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 0;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_currency VARCHAR(10) DEFAULT 'LKR';`);

  // Backfill: give Rohan free, Ananda 8000 LKR based on existing data
  await db.query(`UPDATE users SET consultation_fee = 0 WHERE id = 'usr_prof_cmb_1' AND (consultation_fee IS NULL OR consultation_fee = 0);`);
  await db.query(`UPDATE users SET consultation_fee = 8000 WHERE id = 'usr_prof_mrt_1' AND (consultation_fee IS NULL OR consultation_fee = 0);`);

  // 5. Set prices on seeded videos: vid_1 free, vid_2 paid 1500, vid_3 paid 2500
  await db.query(`UPDATE professor_videos SET price = 0    WHERE id = 'vid_1';`);
  await db.query(`UPDATE professor_videos SET price = 1500 WHERE id = 'vid_2';`);
  await db.query(`UPDATE professor_videos SET price = 2500 WHERE id = 'vid_3';`);

  console.log('✅ Professor features patched successfully.');
  await db.end();
}

patch().catch(e => { console.error('FATAL:', e.message); process.exit(1); });