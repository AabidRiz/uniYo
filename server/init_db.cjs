const pg = require('pg');
const { Client } = pg;

const DB_CONFIG = { host: 'localhost', port: 5432, user: 'postgres', password: '1234' };

const AV1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230A66C2"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';
const AV2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230284c7"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';
const AV3 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230d9488"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';
const AV_P = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234f46e5"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';
const AV_B = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23d97706"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';

const UNIS = [
  { name: 'University of Colombo – Colombo', category: 'UGC State', code: 'UOC', domain: 'cmb.ac.lk', pattern: '^UOC-\\d{6}$' },
  { name: 'University of Peradeniya – Peradeniya', category: 'UGC State', code: 'UOP', domain: 'pdn.ac.lk', pattern: '^UOP-\\d{6}$' },
  { name: 'University of Sri Jayewardenepura – Nugegoda', category: 'UGC State', code: 'USJ', domain: 'sjp.ac.lk', pattern: '^USJ-\\d{6}$' },
  { name: 'University of Kelaniya – Kelaniya', category: 'UGC State', code: 'UOK', domain: 'kln.ac.lk', pattern: '^UOK-\\d{6}$' },
  { name: 'University of Moratuwa – Moratuwa', category: 'UGC State', code: 'UOM', domain: 'mrt.ac.lk', pattern: '^UOM-\\d{6}$' },
  { name: 'University of Jaffna – Jaffna', category: 'UGC State', code: 'UOJ', domain: 'jfn.ac.lk', pattern: '^UOJ-\\d{6}$' },
  { name: 'University of Ruhuna – Matara', category: 'UGC State', code: 'UOR', domain: 'ruh.ac.lk', pattern: '^UOR-\\d{6}$' },
  { name: 'Eastern University, Sri Lanka – Chenkalady', category: 'UGC State', code: 'EUSL', domain: 'esn.ac.lk', pattern: '^EUSL-\\d{6}$' },
  { name: 'South Eastern University of Sri Lanka – Oluvil', category: 'UGC State', code: 'SEUSL', domain: 'seu.ac.lk', pattern: '^SEUSL-\\d{6}$' },
  { name: 'Rajarata University of Sri Lanka – Mihintale', category: 'UGC State', code: 'RUSL', domain: 'rjt.ac.lk', pattern: '^RUSL-\\d{6}$' },
  { name: 'Sabaragamuwa University of Sri Lanka – Belihuloya', category: 'UGC State', code: 'SUSL', domain: 'sab.ac.lk', pattern: '^SUSL-\\d{6}$' },
  { name: 'Wayamba University of Sri Lanka – Kuliyapitiya', category: 'UGC State', code: 'WUSL', domain: 'wyb.ac.lk', pattern: '^WUSL-\\d{6}$' },
  { name: 'Uva Wellassa University – Badulla', category: 'UGC State', code: 'UWU', domain: 'uwu.ac.lk', pattern: '^UWU-\\d{6}$' },
  { name: 'University of the Visual and Performing Arts – Colombo', category: 'UGC State', code: 'UVPA', domain: 'vpa.ac.lk', pattern: '^UVPA-\\d{6}$' },
  { name: 'The Open University of Sri Lanka – Nugegoda', category: 'UGC State', code: 'OUSL', domain: 'ou.ac.lk', pattern: '^OUSL-\\d{6}$' },
  { name: 'Gampaha Wickramarachchi University of Indigenous Medicine – Yakkala', category: 'UGC State', code: 'GWUIM', domain: 'gwu.ac.lk', pattern: '^GWU-\\d{6}$' },
  { name: 'Vavuniya University – Vavuniya', category: 'UGC State', code: 'UV', domain: 'vau.ac.lk', pattern: '^UV-\\d{6}$' },
  { name: 'General Sir John Kotelawala Defence University (KDU) – Ratmalana', category: 'Defense & Gov', code: 'KDU', domain: 'kdu.ac.lk', pattern: '^KDU-\\d{5}$' },
  { name: 'Buddhist and Pali University of Sri Lanka – Homagama', category: 'Defense & Gov', code: 'BPU', domain: 'bpu.ac.lk', pattern: '^BPU-\\d{5}$' },
  { name: 'Buddhasravaka Bhiksu University – Anuradhapura', category: 'Defense & Gov', code: 'BBU', domain: 'bbu.ac.lk', pattern: '^BBU-\\d{5}$' },
  { name: 'University of Vocational Technology (UNIVOTEC) – Ratmalana', category: 'Defense & Gov', code: 'UNIVOTEC', domain: 'univotec.ac.lk', pattern: '^UNIV-\\d{5}$' },
  { name: 'Ocean University of Sri Lanka (OCU) – Mattakkuliya', category: 'Defense & Gov', code: 'OCU', domain: 'ocu.ac.lk', pattern: '^OCU-\\d{5}$' },
  { name: 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', category: 'Non-State/Private', code: 'SLIIT', domain: 'sliit.lk', pattern: '^IT-\\d{8}$' },
  { name: 'NSBM Green University – Homagama', category: 'Non-State/Private', code: 'NSBM', domain: 'nsbm.ac.lk', pattern: '^NSBM-\\d{6}$' },
  { name: 'CINEC Campus – Malabe', category: 'Non-State/Private', code: 'CINEC', domain: 'cinec.edu', pattern: '^CINEC-\\d{5}$' },
  { name: 'Informatics Institute of Technology (IIT) – Colombo 06', category: 'Non-State/Private', code: 'IIT', domain: 'iit.ac.lk', pattern: '^IIT-\\d{6}$' },
  { name: 'Horizon Campus – Malabe', category: 'Non-State/Private', code: 'HORIZON', domain: 'horizoncampus.edu.lk', pattern: '^HC-\\d{5}$' },
  { name: 'Asia Pacific Institute of Information Technology (APIIT) – Colombo 02', category: 'Non-State/Private', code: 'APIIT', domain: 'apiit.lk', pattern: '^APIIT-\\d{5}$' },
  { name: 'National Institute of Business Management (NIBM) – Colombo 07', category: 'Non-State/Private', code: 'NIBM', domain: 'nibm.lk', pattern: '^NIBM-\\d{6}$' },
  { name: 'ICBT Campus – Colombo 04', category: 'Non-State/Private', code: 'ICBT', domain: 'icbt.lk', pattern: '^ICBT-\\d{5}$' },
  { name: 'Aquinas College of Higher Studies – Colombo 08', category: 'Non-State/Private', code: 'AQUINAS', domain: 'aquinas.lk', pattern: '^AQU-\\d{5}$' },
  { name: 'Sri Lanka Institute of Advanced Technological Education (SLIATE)', category: 'Non-State/Private', code: 'SLIATE', domain: 'sliate.ac.lk', pattern: '^ATE-\\d{6}$' },
  { name: 'Gateway Graduate School – Colombo', category: 'Non-State/Private', code: 'GATEWAY', domain: 'gateway.lk', pattern: '^GGS-\\d{5}$' },
  { name: 'Bristol Institute of Business Management – Colombo 03', category: 'Non-State/Private', code: 'BRISTOL', domain: 'bristol.lk', pattern: '^BIBM-\\d{5}$' },
  { name: 'Esoft Metro Campus – Colombo 03', category: 'Non-State/Private', code: 'ESOFT', domain: 'esoft.lk', pattern: '^EMC-\\d{6}$' },
  { name: 'Saegis Campus – Nugegoda', category: 'Non-State/Private', code: 'SAEGIS', domain: 'saegis.ac.lk', pattern: '^SC-\\d{5}$' },
  { name: 'Sri Lanka International Buddhist Academy (SIBA) – Pallekele', category: 'Non-State/Private', code: 'SIBA', domain: 'siba.edu.lk', pattern: '^SIBA-\\d{5}$' },
  { name: 'Sri Lanka Institute of Marketing (SLIM) – Colombo', category: 'Non-State/Private', code: 'SLIM', domain: 'slim.lk', pattern: '^SLIM-\\d{5}$' },
  { name: 'Institute of Chemistry Ceylon (ICHEMC) – Rajagoriya', category: 'Non-State/Private', code: 'ICHEMC', domain: 'ichemc.edu.lk', pattern: '^ICC-\\d{5}$' },
  { name: 'Santhaloka Campus – Kurunegala', category: 'Non-State/Private', code: 'SANTHALOKA', domain: 'santhaloka.edu.lk', pattern: '^SLC-\\d{5}$' }
];

const USERS = [
  { id: 'usr_std_sliit_1', role: 'student', name: 'Kusal Perera', email: 'kusal.p@sliit.lk', student_id: 'IT-20249812', university_name: 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', faculty: 'Computing & AI', degree: 'B.Sc (Hons) Information Technology - SE (3rd Year)', bio: 'Passionate full-stack & AI software engineer at SLIIT.', avatar_base64: AV1, verified: true, verification_status: 'verified', skills: 'React, Node.js, Python, PostgreSQL, Agentic AI' },
  { id: 'usr_std_uom_1', role: 'student', name: 'Nethmi Silva', email: 'nethmi.s@mrt.ac.lk', student_id: 'UOM-194821', university_name: 'University of Moratuwa – Moratuwa', faculty: 'Engineering & CS', degree: 'B.Sc. Eng Hons Computer Science (4th Year)', bio: 'Robotics & drone telemetry developer at UoM CSE Lab.', avatar_base64: AV2, verified: true, verification_status: 'verified', skills: 'C++, ROS2, PyTorch, OpenCV, Embedded Systems' },
  { id: 'usr_std_uoc_1', role: 'student', name: 'Dilshan Fernando', email: 'dilshan.f@cmb.ac.lk', student_id: 'UOC-889124', university_name: 'University of Colombo – Colombo', faculty: 'Faculty of Science', degree: 'B.Sc. Artificial Intelligence & Data Science', bio: 'LLM fine-tuning & NLP in Sinhala and Tamil.', avatar_base64: AV3, verified: true, verification_status: 'verified', skills: 'Python, Transformers, NLP, Hugging Face, FastAPI' },
  { id: 'usr_std_uop_1', role: 'student', name: 'Tharushi Wickramasinghe', email: 'tharushi.w@pdn.ac.lk', student_id: 'UOP-551209', university_name: 'University of Peradeniya – Peradeniya', faculty: 'Faculty of Engineering', degree: 'B.Sc. Electrical & Electronic Engineering', bio: 'Embedded systems, solar inverter telemetry.', avatar_base64: AV2, verified: true, verification_status: 'verified', skills: 'Embedded C, STM32, Power Electronics, MATLAB' },
  { id: 'usr_std_nsbm_1', role: 'student', name: 'Chamari Atapattu', email: 'chamari.a@nsbm.ac.lk', student_id: 'NSBM-774102', university_name: 'NSBM Green University – Homagama', faculty: 'School of Computing', degree: 'B.Sc. Software Engineering', bio: 'UI/UX Designer & Frontend React developer.', avatar_base64: AV1, verified: true, verification_status: 'verified', skills: 'React, Flutter, Figma, Tailwind, UX Research' },
  { id: 'usr_std_kdu_1', role: 'student', name: 'Kasun Rajitha', email: 'kasun.r@kdu.ac.lk', student_id: 'KDU-99812', university_name: 'General Sir John Kotelawala Defence University (KDU) – Ratmalana', faculty: 'Faculty of Computing', degree: 'B.Sc. Cybersecurity & Defense Tech', bio: 'Network security auditing, zero-knowledge proofs.', avatar_base64: AV3, verified: true, verification_status: 'verified', skills: 'Kali, Burp Suite, ZKP, Rust, Network Security' },
  { id: 'usr_std_iit_1', role: 'student', name: 'Shenali De Silva', email: 'shenali.d@iit.ac.lk', student_id: 'IIT-550192', university_name: 'Informatics Institute of Technology (IIT) – Colombo 06', faculty: 'Department of Computing', degree: 'B.Eng (Hons) Software Engineering', bio: 'Product manager & Flutter mobile developer.', avatar_base64: AV2, verified: true, verification_status: 'verified', skills: 'Flutter, Dart, Firebase, Product Management' },
  { id: 'usr_std_aabid_1', role: 'student', name: 'Aabid Rizam', email: 'aabid.r@sliit.lk', student_id: 'IT-20261001', university_name: 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', faculty: 'Computing & AI', degree: 'B.Sc (Hons) Software Engineering', bio: 'Software engineering undergraduate interested in AI and full-stack systems.', avatar_base64: AV1, verified: true, verification_status: 'verified', skills: 'React, Node.js, Python, PostgreSQL' },
  { id: 'usr_prof_cmb_1', role: 'professor', name: 'Prof. Rohan Abeyaratne', email: 'rohan@cmb.ac.lk', university_name: 'University of Colombo – Colombo', faculty: 'Faculty of Science', title: 'Chair Professor of Computer Science', bio: 'Directing the AI & Data Science Research Lab. Open for student office hours & thesis guidance.', avatar_base64: AV_P, verified: true, hourly_rate: 'Free / LKR 5,000', consultation_type: 'both', skills: 'AI, Machine Learning, Data Science, Research Methods' },
  { id: 'usr_prof_mrt_1', role: 'professor', name: 'Prof. Ananda Jayawardane', email: 'ananda@mrt.ac.lk', university_name: 'University of Moratuwa – Moratuwa', faculty: 'Faculty of Engineering', title: 'Senior Professor of Technology Management', bio: 'Advising campus tech incubators & multi-disciplinary student venture founders across Sri Lanka.', avatar_base64: AV_P, verified: true, hourly_rate: 'LKR 8,000 / hour', consultation_type: 'paid', skills: 'Technology Management, Entrepreneurship, Innovation' },
  { id: 'usr_biz_1', role: 'business', name: 'Dinesh Gunawardena', email: 'dinesh@lankaventures.lk', company: 'Lanka Venture Partners & Labs', industry: 'Early Stage Tech VC', title: 'Partner & Managing Director', bio: 'Investing in high-potential student-led startups.', avatar_base64: AV_B, verified: true }
];

async function setupDatabase() {
  console.log('--- UniYO DB Init ---');
  const sys = new Client(DB_CONFIG);
  await sys.connect();
  const exists = await sys.query("SELECT 1 FROM pg_database WHERE datname='uniyo_db'");
  if (!exists.rowCount) await sys.query('CREATE DATABASE uniyo_db');
  await sys.end();

  const db = new Client({ ...DB_CONFIG, database: 'uniyo_db' });
  await db.connect();
  console.log('Ensuring tables...');

  await db.query(`CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, category VARCHAR(100),
    code VARCHAR(50), domain VARCHAR(100), pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY, role VARCHAR(50) NOT NULL, name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) DEFAULT '1234',
    student_id VARCHAR(100), university_name VARCHAR(255), faculty VARCHAR(255),
    degree VARCHAR(255), company VARCHAR(255), industry VARCHAR(255), title VARCHAR(255),
    bio TEXT, avatar_base64 TEXT, cover_base64 TEXT, skills TEXT,
    verified BOOLEAN DEFAULT FALSE, verification_status VARCHAR(50) DEFAULT 'pending',
    verification_reason TEXT, hourly_rate VARCHAR(100), consultation_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '1234';`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, connected_user_id));`);

  await db.query(`CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(100) PRIMARY KEY,
    author_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255), author_university VARCHAR(255), author_avatar_base64 TEXT,
    author_role VARCHAR(50), author_verified BOOLEAN DEFAULT FALSE,
    content TEXT NOT NULL, image_base64 TEXT, attachment_base64 TEXT, attachment_name VARCHAR(255),
    likes_count INT DEFAULT 0, comments_count INT DEFAULT 0,
    tags TEXT[], tagged_user_ids TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_base64 TEXT;`);
  await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);`);
  await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS tagged_user_ids TEXT[];`);
  await db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS post_likes (
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id));`);

  await db.query(`CREATE TABLE IF NOT EXISTS post_comments (
    id VARCHAR(100) PRIMARY KEY,
    post_id VARCHAR(100) REFERENCES posts(id) ON DELETE CASCADE,
    author_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255), author_avatar_base64 TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY, owner_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    owner_name VARCHAR(255), owner_university VARCHAR(255), owner_avatar_base64 TEXT,
    title VARCHAR(255) NOT NULL, description TEXT NOT NULL, banner_base64 TEXT,
    open_universities TEXT[], skills_needed TEXT[],
    seeking_investment BOOLEAN DEFAULT FALSE, investment_goal VARCHAR(100),
    traction_score INT DEFAULT 85,
    visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';`);
  await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_requests (
    id VARCHAR(100) PRIMARY KEY, project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255), university VARCHAR(255), skill VARCHAR(100),
    pitch TEXT, status VARCHAR(50) DEFAULT 'Pending',
    type VARCHAR(20) DEFAULT 'request',
    invited_by_id VARCHAR(100), responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'request';`);
  await db.query(`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS invited_by_id VARCHAR(100);`);
  await db.query(`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;`);
  await db.query(`ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_messages (
    id VARCHAR(100) PRIMARY KEY, project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    sender_id VARCHAR(100), sender VARCHAR(255), avatar_base64 TEXT, text TEXT,
    message_type VARCHAR(20) DEFAULT 'chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100);`);
  await db.query(`ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'chat';`);
  await db.query(`ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_members (
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'Collaborator',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id));`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_repos (
    id VARCHAR(100) PRIMARY KEY, project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255), url TEXT, stars INT DEFAULT 0);`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_docs (
    id VARCHAR(100) PRIMARY KEY, project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255), size VARCHAR(50), url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE project_docs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_tasks (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, description TEXT,
    status VARCHAR(50) DEFAULT 'todo', priority VARCHAR(20) DEFAULT 'medium',
    assignee_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    assignee_name VARCHAR(255), due_date VARCHAR(50),
    created_by_id VARCHAR(100), created_by_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_meetings (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, description TEXT,
    meeting_date VARCHAR(50), meeting_time VARCHAR(50),
    duration_minutes INT DEFAULT 60, link TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_by_id VARCHAR(100), created_by_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_meeting_attendees (
    meeting_id VARCHAR(100) REFERENCES project_meetings(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, user_id));`);

  await db.query(`CREATE TABLE IF NOT EXISTS project_activity (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    actor_id VARCHAR(100), actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL, target_type VARCHAR(50), target_id VARCHAR(100),
    message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON project_tasks(assignee_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_meetings_project ON project_meetings(project_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_meetings_date ON project_meetings(meeting_date);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_project ON project_activity(project_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_created ON project_activity(created_at DESC);`);

  // Professor sessions
  await db.query(`CREATE TABLE IF NOT EXISTS professor_sessions (
    id VARCHAR(100) PRIMARY KEY, prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    prof_name VARCHAR(255), university VARCHAR(255), student_id VARCHAR(100),
    student_name VARCHAR(255), date VARCHAR(100), time VARCHAR(100),
    type VARCHAR(100), topic TEXT, status VARCHAR(50) DEFAULT 'Confirmed',
    notes TEXT, completed_at TIMESTAMP, rating INT, rating_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS notes TEXT;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS rating INT;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS rating_comment TEXT;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS meeting_link TEXT;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS response_message TEXT;`);
  await db.query(`ALTER TABLE professor_sessions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_profile JSONB;`);
  await db.query(`ALTER TABLE internships ADD COLUMN IF NOT EXISTS owner_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL;`);
  for (const table of ['internships', 'project_messages', 'project_repos', 'project_docs', 'project_tasks', 'project_meetings', 'project_activity', 'investment_interests']) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  }
  await db.query(`ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS investor_id VARCHAR(100);`);
  await db.query(`ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS project_id VARCHAR(100);`);
  await db.query(`ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending';`);

  await db.query(`CREATE TABLE IF NOT EXISTS professor_availability (
    id VARCHAR(100) PRIMARY KEY, prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    day VARCHAR(50), time VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  // Professor teaching videos
  await db.query(`CREATE TABLE IF NOT EXISTS professor_videos (
    id VARCHAR(100) PRIMARY KEY,
    prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_minutes INT,
    tags TEXT[],
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS professor_video_impressions (
    id VARCHAR(100) PRIMARY KEY,
    video_id VARCHAR(100) REFERENCES professor_videos(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_avatar TEXT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  // Professor Q&A
  await db.query(`CREATE TABLE IF NOT EXISTS professor_questions (
    id VARCHAR(100) PRIMARY KEY,
    prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_avatar TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS admin_complaints (
    id VARCHAR(100) PRIMARY KEY,
    reporter_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  // Project advisors
  await db.query(`CREATE TABLE IF NOT EXISTS project_advisors (
    project_id VARCHAR(100) REFERENCES projects(id) ON DELETE CASCADE,
    prof_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    pitch TEXT,
    requested_by VARCHAR(100),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    PRIMARY KEY (project_id, prof_id));`);

  // Internships
  await db.query(`CREATE TABLE IF NOT EXISTS internships (
    id VARCHAR(100) PRIMARY KEY, title VARCHAR(255) NOT NULL, company VARCHAR(255) NOT NULL,
    location VARCHAR(255), stipend VARCHAR(100), type VARCHAR(100), description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS internship_applications (
    id VARCHAR(100) PRIMARY KEY, internship_id VARCHAR(100) REFERENCES internships(id) ON DELETE CASCADE,
    user_id VARCHAR(100), name VARCHAR(255), university VARCHAR(255),
    gpa VARCHAR(50), email VARCHAR(255), phone VARCHAR(100), degree VARCHAR(255), faculty VARCHAR(255), experience TEXT, cv_base64 TEXT, cv_name VARCHAR(255), status VARCHAR(50) DEFAULT 'Applied');`);

  await db.query(`CREATE TABLE IF NOT EXISTS investment_interests (
    id VARCHAR(100) PRIMARY KEY, project_id VARCHAR(100),
    project_title VARCHAR(255), student_lead VARCHAR(255),
    investor_id VARCHAR(100), investor_name VARCHAR(255),
    target_amount VARCHAR(100), status VARCHAR(100), ai_summary TEXT,
    meeting_slot VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
  await db.query(`CREATE TABLE IF NOT EXISTS investment_meetings (
    id VARCHAR(100) PRIMARY KEY, investment_id VARCHAR(100) REFERENCES investment_interests(id) ON DELETE CASCADE,
    investor_id VARCHAR(100), student_id VARCHAR(100), date VARCHAR(100), time VARCHAR(100), link TEXT, message TEXT,
    status VARCHAR(40) DEFAULT 'Proposed', change_request TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

  await db.query(`CREATE TABLE IF NOT EXISTS verification_queue (
    id VARCHAR(100) PRIMARY KEY, user_id VARCHAR(100), name VARCHAR(255), email VARCHAR(255),
    student_id VARCHAR(100), university VARCHAR(255), submitted_at VARCHAR(100),
    id_format_match BOOLEAN, otp_verified BOOLEAN, ai_confidence VARCHAR(50),
    flag_reason TEXT, id_card_base64 TEXT, status VARCHAR(50) DEFAULT 'Pending');`);

  await db.query(`ALTER TABLE verification_queue ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);`);
  await db.query(`ALTER TABLE verification_queue ADD COLUMN IF NOT EXISTS id_card_base64 TEXT;`);

  // Seeding
  console.log('Seeding universities...');
  for (const u of UNIS) {
    await db.query(`INSERT INTO universities (name, category, code, domain, pattern)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE
      SET category=EXCLUDED.category, pattern=EXCLUDED.pattern, code=EXCLUDED.code, domain=EXCLUDED.domain;`,
      [u.name, u.category, u.code, u.domain, u.pattern]);
  }

  console.log('Seeding users...');
  for (const u of USERS) {
    await db.query(`INSERT INTO users (id, role, name, email, student_id, university_name, faculty, degree, company, industry, title, bio, avatar_base64, verified, verification_status, hourly_rate, consultation_type, skills)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, bio=EXCLUDED.bio, avatar_base64=EXCLUDED.avatar_base64, skills=EXCLUDED.skills;`,
      [u.id, u.role, u.name, u.email, u.student_id || null, u.university_name || null,
       u.faculty || null, u.degree || null, u.company || null, u.industry || null,
       u.title || null, u.bio || null, u.avatar_base64, u.verified || true,
       u.verification_status || 'verified', u.hourly_rate || null,
       u.consultation_type || null, u.skills || null]);
  }

  await db.query(`INSERT INTO users (id, role, name, email, password, university_name, avatar_base64, verified)
    VALUES ('usr_admin_1', 'admin', 'UniYO HQ System Admin', 'admin@uniyo.lk', '1234', 'Platform Wide Administration', $1, TRUE)
    ON CONFLICT (id) DO NOTHING;`, [AV_P]);

  console.log('Seeding connections...');
  const conns = [
    ['usr_std_sliit_1','usr_std_uom_1'], ['usr_std_sliit_1','usr_std_uoc_1'],
    ['usr_std_sliit_1','usr_std_uop_1'], ['usr_std_sliit_1','usr_std_nsbm_1'],
    ['usr_std_sliit_1','usr_std_iit_1'], ['usr_std_sliit_1','usr_std_kdu_1'],
    ['usr_std_uom_1','usr_std_uoc_1'], ['usr_std_uom_1','usr_std_uop_1'],
    ['usr_std_uom_1','usr_std_kdu_1'], ['usr_std_uoc_1','usr_std_uop_1'],
    ['usr_std_nsbm_1','usr_std_iit_1'],
    ['usr_std_aabid_1','usr_std_sliit_1'], ['usr_std_aabid_1','usr_std_uom_1']
  ];
  for (const [a,b] of conns) {
    await db.query(`INSERT INTO user_connections (user_id, connected_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING;`, [a,b]);
    await db.query(`INSERT INTO user_connections (user_id, connected_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING;`, [b,a]);
  }

  console.log('Seeding posts...');
  await db.query(`INSERT INTO posts (id, author_id, author_name, author_university, author_avatar_base64, author_role, author_verified, content, tags)
    VALUES ('post_lk_1', 'usr_std_sliit_1', 'Kusal Perera', 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', $1, 'student', TRUE,
    '🇱🇰 Excited to launch our cross-university project "AgriSense LK" bringing together SLIIT & University of Moratuwa engineering students to build smart IoT sensors for tea plantations!',
    ARRAY['#SLIIT','#Moratuwa','#AgriTech','#Collaborate'])
    ON CONFLICT (id) DO NOTHING;`, [AV1]);

  await db.query(`INSERT INTO posts (id, author_id, author_name, author_university, author_avatar_base64, author_role, author_verified, content, tags)
    VALUES ('post_lk_2', 'usr_std_uom_1', 'Nethmi Silva', 'University of Moratuwa – Moratuwa', $1, 'student', TRUE,
    'Robotics lab update: our drone telemetry stack now supports multi-agent coordination over LoRaWAN.',
    ARRAY['#Robotics','#UoM','#Collaborate'])
    ON CONFLICT (id) DO NOTHING;`, [AV2]);

  await db.query(`INSERT INTO post_comments (id, post_id, author_id, author_name, author_avatar_base64, content)
    VALUES ('cmt_1', 'post_lk_1', 'usr_std_uom_1', 'Nethmi Silva', $1, 'This looks amazing Kusal!')
    ON CONFLICT (id) DO NOTHING;`, [AV2]);

  await db.query(`UPDATE posts SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id);`);

  console.log('Seeding projects...');
  await db.query(`INSERT INTO projects (id, owner_id, owner_name, owner_university, owner_avatar_base64, title, description, open_universities, skills_needed, seeking_investment, investment_goal, traction_score, visibility)
    VALUES ('proj_lk_1', 'usr_std_sliit_1', 'Kusal Perera', 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', $1,
    'AgriSense LK: IoT Carbon & Soil Telemetry for Tea Estates',
    'Developing solar-powered IoT hardware nodes combined with machine learning models to optimize tea plantation yield across Nuwara Eliya and Badulla.',
    ARRAY['ALL'],
    ARRAY['React Native','PyTorch ML','Embedded C++','LoRaWAN'], TRUE, 'LKR 2,500,000 Seed Pitch', 92, 'public')
    ON CONFLICT (id) DO NOTHING;`, [AV1]);

  await db.query(`INSERT INTO project_members (project_id, user_id, role)
    VALUES ('proj_lk_1', 'usr_std_sliit_1', 'Lead Founder') ON CONFLICT DO NOTHING;`);

  await db.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type)
    VALUES ('msg_lk_1', 'proj_lk_1', 'usr_std_sliit_1', 'Kusal Perera', $1, 'Welcome to AgriSense LK workspace!', 'chat')
    ON CONFLICT (id) DO NOTHING;`, [AV1]);

  await db.query(`INSERT INTO project_repos (id, project_id, name, url, stars)
    VALUES ('repo_lk_1', 'proj_lk_1', 'agrisense-core-api', 'https://github.com/uniyo-projects/agrisense', 32)
    ON CONFLICT (id) DO NOTHING;`);

  await db.query(`INSERT INTO project_docs (id, project_id, title, size, url)
    VALUES ('doc_lk_1', 'proj_lk_1', 'Project_Architecture_v1.pdf', '3.4 MB', '#')
    ON CONFLICT (id) DO NOTHING;`);

  await db.query(`INSERT INTO projects (id, owner_id, owner_name, owner_university, owner_avatar_base64, title, description, open_universities, skills_needed, seeking_investment, investment_goal, traction_score, visibility)
    VALUES ('proj_lk_2', 'usr_std_aabid_1', 'Aabid Rizam', 'Sri Lanka Institute of Information Technology (SLIIT) – Malabe', $1,
    'CampusConnect: Cross-University Event Hub',
    'A mobile-first platform to discover and RSVP for hackathons, tech talks, and workshops across all Sri Lankan university campuses.',
    ARRAY['ALL'],
    ARRAY['React Native','Node.js','PostgreSQL','UI/UX'], FALSE, NULL, 78, 'public')
    ON CONFLICT (id) DO NOTHING;`, [AV1]);

  await db.query(`INSERT INTO project_members (project_id, user_id, role)
    VALUES ('proj_lk_2', 'usr_std_aabid_1', 'Lead Founder') ON CONFLICT DO NOTHING;`);

  await db.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type)
    VALUES ('msg_lk_2', 'proj_lk_2', 'usr_std_aabid_1', 'Aabid Rizam', $1, 'Welcome to CampusConnect!', 'chat')
    ON CONFLICT (id) DO NOTHING;`, [AV1]);

  await db.query(`INSERT INTO projects (id, owner_id, owner_name, owner_university, owner_avatar_base64, title, description, open_universities, skills_needed, seeking_investment, investment_goal, traction_score, visibility)
    VALUES ('proj_lk_3', 'usr_std_uom_1', 'Nethmi Silva', 'University of Moratuwa – Moratuwa', $1,
    'SkyEye: Autonomous Drone Swarm for Disaster Response',
    'Private research initiative building a coordinated drone swarm system for flood and landslide relief operations in Sri Lanka.',
    ARRAY['University of Moratuwa – Moratuwa'],
    ARRAY['ROS2','C++','Computer Vision','Embedded Systems'], TRUE, 'LKR 5,000,000 R&D Grant', 95, 'private')
    ON CONFLICT (id) DO NOTHING;`, [AV2]);

  await db.query(`INSERT INTO project_members (project_id, user_id, role)
    VALUES ('proj_lk_3', 'usr_std_uom_1', 'Lead Founder') ON CONFLICT DO NOTHING;`);

  console.log('Seeding tasks...');
  const tasks = [
    ['task_1','proj_lk_1','Design LoRaWAN node schematic','Finalize PCB layout.','todo','high','usr_std_sliit_1','Kusal Perera','2026-10-15'],
    ['task_2','proj_lk_1','Train soil moisture ML model','Collect data and train.','in_progress','urgent','usr_std_sliit_1','Kusal Perera','2026-10-10'],
    ['task_3','proj_lk_1','Draft pitch deck','12-slide deck.','review','medium','usr_std_sliit_1','Kusal Perera','2026-10-20'],
    ['task_4','proj_lk_1','Setup GitHub CI','Automate build + tests.','done','low','usr_std_sliit_1','Kusal Perera','2026-09-30'],
    ['task_5','proj_lk_2','Design event screen','Figma mock.','todo','medium','usr_std_aabid_1','Aabid Rizam','2026-10-18'],
    ['task_6','proj_lk_2','Setup PostgreSQL schema','Events, RSVPs tables.','in_progress','high','usr_std_aabid_1','Aabid Rizam','2026-10-12']
  ];
  for (const t of tasks) {
    await db.query(`INSERT INTO project_tasks (id, project_id, title, description, status, priority, assignee_id, assignee_name, due_date, created_by_id, created_by_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$7,$8) ON CONFLICT (id) DO NOTHING;`, t);
  }

  console.log('Seeding meetings...');
  await db.query(`INSERT INTO project_meetings (id, project_id, title, description, meeting_date, meeting_time, duration_minutes, link, status, created_by_id, created_by_name)
    VALUES ('meet_1','proj_lk_1','Weekly Sprint Sync','Review sprint progress.','2026-10-05','10:00 AM',60,'https://meet.google.com/abc-defg-hij','Scheduled','usr_std_sliit_1','Kusal Perera')
    ON CONFLICT (id) DO NOTHING;`);
  await db.query(`INSERT INTO project_meeting_attendees (meeting_id, user_id)
    VALUES ('meet_1','usr_std_sliit_1') ON CONFLICT DO NOTHING;`);

  console.log('Seeding activity...');
  const acts = [
    ['act_1','proj_lk_1','usr_std_sliit_1','Kusal Perera','created_project',null,null,'Created project AgriSense LK'],
    ['act_2','proj_lk_1','usr_std_sliit_1','Kusal Perera','added_repo','repo','repo_lk_1','Added repository agrisense-core-api'],
    ['act_3','proj_lk_2','usr_std_aabid_1','Aabid Rizam','created_project',null,null,'Created project CampusConnect']
  ];
  for (const a of acts) {
    await db.query(`INSERT INTO project_activity (id, project_id, actor_id, actor_name, action, target_type, target_id, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING;`, a);
  }

  console.log('Seeding professor availability...');
  await db.query(`INSERT INTO professor_availability (id, prof_id, day, time) VALUES
    ('av_p1_1','usr_prof_cmb_1','Mon','10:00 AM - 11:00 AM'),
    ('av_p1_2','usr_prof_cmb_1','Wed','02:00 PM - 03:00 PM'),
    ('av_p1_3','usr_prof_cmb_1','Fri','11:00 AM - 12:00 PM'),
    ('av_p2_1','usr_prof_mrt_1','Tue','09:00 AM - 10:00 AM'),
    ('av_p2_2','usr_prof_mrt_1','Thu','03:00 PM - 04:00 PM')
    ON CONFLICT (id) DO NOTHING;`);

  console.log('Seeding professor videos...');
  const vids = [
    ['vid_1','usr_prof_cmb_1','Building Agentic AI Systems with Tool-Calling Orchestrations',
     'Deep dive into orchestrating multi-agent workflows with tool calls and human-in-the-loop checkpoints.',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
     42, ['AI','Agents','LLM'], 1240],
    ['vid_2','usr_prof_cmb_1','Data Science Research Methodology for Undergraduates',
     'How to structure a research paper, run experiments, and present findings at conferences.',
     'https://www.youtube.com/watch?v=example2',
     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
     35, ['Research','Data Science'], 890],
    ['vid_3','usr_prof_mrt_1','Technology Management for Student Founders',
     'Practical strategies for turning campus research into venture-backed companies.',
     'https://www.youtube.com/watch?v=example3',
     'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
     50, ['Startups','Management'], 1560]
  ];
  for (const v of vids) {
    await db.query(`INSERT INTO professor_videos (id, prof_id, title, description, video_url, thumbnail_url, duration_minutes, tags, views)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;`, v);
  }

  await db.query(`INSERT INTO professor_video_impressions (id, video_id, student_id, student_name, student_avatar, rating, comment) VALUES
    ('imp_1','vid_1','usr_std_uom_1','Nethmi Silva',$1,5,'Incredible breakdown of subagent state management!'),
    ('imp_2','vid_1','usr_std_uoc_1','Dilshan Fernando',$2,5,'Clear explanation of human-in-the-loop triggers.'),
    ('imp_3','vid_3','usr_std_sliit_1','Kusal Perera',$3,4,'Great frameworks for first-time founders.')
    ON CONFLICT (id) DO NOTHING;`, [AV2, AV3, AV1]);

  console.log('Seeding professor questions...');
  await db.query(`INSERT INTO professor_questions (id, prof_id, student_id, student_name, student_avatar, question, answer, answered_at) VALUES
    ('q_1','usr_prof_cmb_1','usr_std_uom_1','Nethmi Silva',$1,
     'How should I structure my ML model evaluation chapter in my thesis?',
     'Focus on baselines, ablations, and a clear error analysis section. Include tables comparing against at least two alternative architectures.',
     CURRENT_TIMESTAMP),
    ('q_2','usr_prof_cmb_1','usr_std_sliit_1','Kusal Perera',$2,
     'What is the best way to approach cross-university collaboration for a final year project?',
     NULL, NULL),
    ('q_3','usr_prof_mrt_1','usr_std_uoc_1','Dilshan Fernando',$3,
     'How do I protect IP for a student-led ML project before pitching to investors?',
     NULL, NULL)
    ON CONFLICT (id) DO NOTHING;`, [AV2, AV1, AV3]);

  console.log('Seeding professor sessions...');
  await db.query(`INSERT INTO professor_sessions (id, prof_id, prof_name, university, student_id, student_name, date, time, type, topic, status) VALUES
    ('sess_seed_1','usr_prof_cmb_1','Prof. Rohan Abeyaratne','University of Colombo – Colombo','usr_std_uom_1','Nethmi Silva','2026-10-08','10:00 AM - 11:00 AM','Consultation','Thesis chapter review','Confirmed'),
    ('sess_seed_2','usr_prof_cmb_1','Prof. Rohan Abeyaratne','University of Colombo – Colombo','usr_std_sliit_1','Kusal Perera','2026-10-10','02:00 PM - 03:00 PM','Consultation','ML model review for AgriSense','Confirmed'),
    ('sess_seed_3','usr_prof_cmb_1','Prof. Rohan Abeyaratne','University of Colombo – Colombo','usr_std_uoc_1','Dilshan Fernando','2026-09-28','11:00 AM - 12:00 PM','Consultation','NLP thesis kickoff','Completed')
    ON CONFLICT (id) DO NOTHING;`);
  await db.query(`UPDATE professor_sessions SET completed_at = CURRENT_TIMESTAMP, rating = 5, rating_comment = 'Fantastic session, very practical advice!' WHERE id='sess_seed_3';`);

  console.log('Seeding project advisor request...');
  await db.query(`INSERT INTO project_advisors (project_id, prof_id, status, pitch, requested_by)
    VALUES ('proj_lk_2','usr_prof_cmb_1','Pending','We''d love your guidance on the AI event recommendation engine for CampusConnect.','usr_std_aabid_1')
    ON CONFLICT DO NOTHING;`);

  console.log('Seeding internships...');
  await db.query(`INSERT INTO internships (id, title, company, location, stipend, type, description)
    VALUES ('job_lk_1','Full-Stack Software Engineering Intern','Lanka Venture Labs','Colombo 03 (Hybrid)','LKR 75,000 / month','Summer Internship','Seeking top software engineering undergraduates from Sri Lankan universities proficient in React, Node.js, and PostgreSQL.')
    ON CONFLICT (id) DO NOTHING;`);

  console.log('✅ SUCCESS: Database seeded with professor videos, questions, sessions, advisor requests.');
  await db.end();
}

setupDatabase().catch(e => { console.error('FATAL:', e); process.exit(1); });