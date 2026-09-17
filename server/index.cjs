const express = require('express');
const cors = require('cors');
const pg = require('pg');
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'uniyo_db'
});



require('dotenv').config();
const { initRagSchema } = require('./rag/db.cjs');
const ragRouter = require('./rag/routes.cjs');
app.use('/api/ai', ragRouter);
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- AUTO-MIGRATE ON BOOT ----------
async function ensureSchema() {
  const stmts = [
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS user_id VARCHAR(100)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS university VARCHAR(255)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS gpa VARCHAR(50)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(100)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS degree VARCHAR(255)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS faculty VARCHAR(255)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS experience TEXT`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS cv_base64 TEXT`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS cv_name VARCHAR(255)`,
    `ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Applied'`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS investor_id VARCHAR(100)`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS project_id VARCHAR(100)`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Pending'`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS meeting_slot VARCHAR(100)`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS ai_summary TEXT`,
    `ALTER TABLE investment_interests ADD COLUMN IF NOT EXISTS student_id VARCHAR(100)`,
    `CREATE TABLE IF NOT EXISTS investment_meetings (
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
    )`,
    `ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS investor_id VARCHAR(100)`,
    `ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS student_id VARCHAR(100)`,
    `ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS change_request TEXT`,
    `ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS message TEXT`,
    `ALTER TABLE investment_meetings ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'Proposed'`
  ];
  for (const sql of stmts) {
    try { await pool.query(sql); }
    catch (e) { console.warn('⚠️  migrate skipped:', e.message); }
  }
}

// ---------- HELPERS ----------
async function buildUser(u) {
  if (!u) return null;
  const [c, p, po, adv] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM user_connections WHERE user_id=$1', [u.id]),
    pool.query('SELECT COUNT(*) FROM project_members WHERE user_id=$1', [u.id]),
    pool.query('SELECT COUNT(*) FROM posts WHERE author_id=$1', [u.id]),
    pool.query(`SELECT COUNT(*) FROM project_advisors WHERE prof_id=$1 AND status='Active'`, [u.id])
  ]);
  return {
    id: u.id, role: u.role, name: u.name, email: u.email,
    studentId: u.student_id, student_id: u.student_id,
    university: u.university_name, university_name: u.university_name,
    faculty: u.faculty, degree: u.degree,
    company: u.company, industry: u.industry, title: u.title, bio: u.bio,
    avatar: u.avatar_base64, avatar_base64: u.avatar_base64,
    cover: u.cover_base64, cover_base64: u.cover_base64,
    skills: u.skills ? u.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    verified: u.verified,
    verificationStatus: u.verification_status,
    verification_status: u.verification_status,
    verificationReason: u.verification_reason,
    hourlyRate: u.hourly_rate, hourly_rate: u.hourly_rate,
    consultationType: u.consultation_type, consultation_type: u.consultation_type,
    consultationFee: u.consultation_fee || 0,
    consultationCurrency: u.consultation_currency || 'LKR',
    enterpriseProfile: u.enterprise_profile || null,
    stats: {
      connections: parseInt(c.rows[0].count, 10),
      projects: parseInt(p.rows[0].count, 10),
      posts: parseInt(po.rows[0].count, 10),
      advisedProjects: parseInt(adv.rows[0].count, 10)
    }
  };
}

async function buildPost(p) {
  const [comments, likes] = await Promise.all([
    pool.query('SELECT * FROM post_comments WHERE post_id=$1 ORDER BY created_at ASC', [p.id]),
    pool.query('SELECT COUNT(*) FROM post_likes WHERE post_id=$1', [p.id])
  ]);
  return {
    id: p.id,
    author: { id: p.author_id, name: p.author_name, university: p.author_university, avatar: p.author_avatar_base64, role: p.author_role, verified: p.author_verified },
    authorId: p.author_id,
    content: p.content, image: p.image_base64, imageBase64: p.image_base64,
    attachment: p.attachment_base64 ? { base64: p.attachment_base64, name: p.attachment_name } : null,
    tags: p.tags || [], taggedUserIds: p.tagged_user_ids || [],
    likes: parseInt(likes.rows[0].count, 10),
    commentsCount: comments.rows.length,
    createdAt: p.created_at,
    timestamp: new Date(p.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
    comments: comments.rows.map(c => ({
      id: c.id, postId: c.post_id, authorId: c.author_id, authorName: c.author_name,
      authorAvatar: c.author_avatar_base64, content: c.content,
      time: new Date(c.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
    }))
  };
}

async function isMember(projectId, userId) {
  if (!userId) return false;
  const r = await pool.query('SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2', [projectId, userId]);
  return r.rows.length > 0;
}

async function isAdvisor(projectId, userId) {
  if (!userId) return false;
  const r = await pool.query(`SELECT 1 FROM project_advisors WHERE project_id=$1 AND prof_id=$2 AND status='Active'`, [projectId, userId]);
  return r.rows.length > 0;
}

async function canRead(projectId, userId) {
  if (!userId) return false;
  return (await isMember(projectId, userId)) || (await isAdvisor(projectId, userId));
}

async function logActivity(projectId, actorId, actorName, action, targetType, targetId, message) {
  try {
    await pool.query(
      `INSERT INTO project_activity (id, project_id, actor_id, actor_name, action, target_type, target_id, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [`act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, projectId, actorId, actorName, action, targetType, targetId, message]
    );
  } catch (e) { console.error('activity log failed:', e.message); }
}

async function buildProject(p, viewerId) {
  const member = await isMember(p.id, viewerId);
  const owner = viewerId === p.owner_id;
  const advisor = await isAdvisor(p.id, viewerId);
  const canSee = member || advisor;

  const membersRes = await pool.query(
    `SELECT pm.role, u.id, u.name, u.university_name, u.avatar_base64
     FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=$1`, [p.id]);

  const advisorRes = await pool.query(
    `SELECT pa.status, u.id, u.name, u.university_name, u.avatar_base64, u.title, u.faculty
     FROM project_advisors pa JOIN users u ON u.id = pa.prof_id
     WHERE pa.project_id = $1 AND pa.status='Active' LIMIT 1`, [p.id]);

  const base = {
    id: p.id, ownerId: p.owner_id,
    owner: { id: p.owner_id, name: p.owner_name, university: p.owner_university, avatar: p.owner_avatar_base64 },
    title: p.title, description: p.description, banner: p.banner_base64,
    openToUniversities: p.open_universities || [],
    open_universities: p.open_universities || [],
    skillsNeeded: p.skills_needed || [],
    skills_needed: p.skills_needed || [],
    seekingInvestment: p.seeking_investment,
    seeking_investment: p.seeking_investment,
    investmentGoal: p.investment_goal, investment_goal: p.investment_goal,
    tractionScore: p.traction_score, traction_score: p.traction_score,
    visibility: p.visibility || 'public',
    createdAt: p.created_at,
    isMember: member, isOwner: owner, isAdvisor: advisor,
    members: membersRes.rows.map(m => ({
      id: m.id, name: m.name, uni: m.university_name, role: m.role, avatar: m.avatar_base64
    })),
    advisor: advisorRes.rows[0] ? {
      id: advisorRes.rows[0].id, name: advisorRes.rows[0].name,
      university: advisorRes.rows[0].university_name,
      faculty: advisorRes.rows[0].faculty,
      title: advisorRes.rows[0].title,
      avatar: advisorRes.rows[0].avatar_base64
    } : null,
    incomingRequests: [], pendingInvites: [],
    chatMessages: [], repositories: [], documents: [],
    tasks: [], meetings: [], activity: []
  };

  if (canSee) {
    const [msgs, repos, docs, tasks, meetings, acts] = await Promise.all([
      pool.query('SELECT * FROM project_messages WHERE project_id=$1 ORDER BY created_at ASC', [p.id]),
      pool.query('SELECT * FROM project_repos WHERE project_id=$1', [p.id]),
      pool.query('SELECT * FROM project_docs WHERE project_id=$1 ORDER BY created_at DESC', [p.id]),
      pool.query('SELECT * FROM project_tasks WHERE project_id=$1 ORDER BY created_at DESC', [p.id]),
      pool.query('SELECT * FROM project_meetings WHERE project_id=$1 ORDER BY meeting_date ASC', [p.id]),
      pool.query('SELECT * FROM project_activity WHERE project_id=$1 ORDER BY created_at DESC LIMIT 50', [p.id])
    ]);

    const meetingIds = meetings.rows.map(m => m.id);
    let attendeesByMeeting = {};
    if (meetingIds.length) {
      const att = await pool.query(
        `SELECT pma.meeting_id, u.id, u.name, u.avatar_base64
         FROM project_meeting_attendees pma JOIN users u ON u.id = pma.user_id
         WHERE pma.meeting_id = ANY($1::varchar[])`, [meetingIds]);
      att.rows.forEach(r => {
        if (!attendeesByMeeting[r.meeting_id]) attendeesByMeeting[r.meeting_id] = [];
        attendeesByMeeting[r.meeting_id].push({ id: r.id, name: r.name, avatar: r.avatar_base64 });
      });
    }

    base.chatMessages = msgs.rows.map(m => ({
      id: m.id, senderId: m.sender_id, sender: m.sender, avatar: m.avatar_base64,
      text: m.text, messageType: m.message_type || 'chat',
      time: new Date(m.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
    }));
    base.repositories = repos.rows.map(r => ({ id: r.id, name: r.name, url: r.url, stars: r.stars }));
    base.documents = docs.rows.map(d => ({
      id: d.id, title: d.title, size: d.size, url: d.url,
      date: new Date(d.created_at).toLocaleDateString()
    }));
    base.tasks = tasks.rows.map(t => ({
      id: t.id, title: t.title, description: t.description,
      status: t.status, priority: t.priority,
      assigneeId: t.assignee_id, assigneeName: t.assignee_name,
      dueDate: t.due_date,
      createdById: t.created_by_id, createdByName: t.created_by_name,
      createdAt: t.created_at
    }));
    base.meetings = meetings.rows.map(m => ({
      id: m.id, title: m.title, description: m.description,
      date: m.meeting_date, time: m.meeting_time,
      durationMinutes: m.duration_minutes, link: m.link, status: m.status,
      createdById: m.created_by_id, createdByName: m.created_by_name,
      attendees: attendeesByMeeting[m.id] || []
    }));
    base.activity = acts.rows.map(a => ({
      id: a.id, actorId: a.actor_id, actorName: a.actor_name,
      action: a.action, targetType: a.target_type, targetId: a.target_id,
      message: a.message, createdAt: a.created_at
    }));
  }

  if (owner) {
    const [reqs, invs, advReq] = await Promise.all([
      pool.query(`SELECT * FROM project_requests WHERE project_id=$1 AND type='request' AND status='Pending' ORDER BY created_at DESC`, [p.id]),
      pool.query(`SELECT * FROM project_requests WHERE project_id=$1 AND type='invite' AND status='Pending' ORDER BY created_at DESC`, [p.id]),
      pool.query(`SELECT pa.status, u.id, u.name, u.university_name, u.title, u.avatar_base64, pa.pitch, pa.requested_at
                  FROM project_advisors pa JOIN users u ON u.id=pa.prof_id
                  WHERE pa.project_id=$1 AND pa.status='Pending'`, [p.id])
    ]);
    base.incomingRequests = reqs.rows.map(r => ({
      id: r.id, applicantId: r.applicant_id, applicantName: r.applicant_name,
      uni: r.university, skill: r.skill, pitch: r.pitch, status: r.status
    }));
    base.pendingInvites = invs.rows.map(r => ({
      id: r.id, invitedUserId: r.applicant_id, invitedName: r.applicant_name,
      invitedUni: r.university, status: r.status
    }));
    base.pendingAdvisorRequest = advReq.rows[0] ? {
      profId: advReq.rows[0].id, profName: advReq.rows[0].name,
      university: advReq.rows[0].university_name,
      title: advReq.rows[0].title, avatar: advReq.rows[0].avatar_base64,
      pitch: advReq.rows[0].pitch, requestedAt: advReq.rows[0].requested_at
    } : null;
  }

  if (!member && !advisor && viewerId) {
    const mine = await pool.query(
      `SELECT * FROM project_requests WHERE project_id=$1 AND applicant_id=$2 AND type='request' AND status='Pending'`,
      [p.id, viewerId]);
    base.myRequest = mine.rows[0] ? { id: mine.rows[0].id, status: mine.rows[0].status } : null;

    const inv = await pool.query(
      `SELECT * FROM project_requests WHERE project_id=$1 AND applicant_id=$2 AND type='invite' AND status='Pending'`,
      [p.id, viewerId]);
    base.myInvite = inv.rows[0] ? { id: inv.rows[0].id } : null;
  }

  return base;
}

// ---------- HEALTH ----------
app.get('/api/health', (_req, res) => res.json({ status: 'ok', engine: 'PostgreSQL', db: 'uniyo_db' }));

// ---------- UNIVERSITIES ----------
app.get('/api/universities', asyncRoute(async (_req, res) => {
  const r = await pool.query('SELECT * FROM universities ORDER BY category ASC, name ASC');
  res.json(r.rows);
}));
app.post('/api/universities', asyncRoute(async (req, res) => {
  const { name, category, code, domain, pattern } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = await pool.query(
    `INSERT INTO universities (name, category, code, domain, pattern) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, category || 'Non-State/Private', code || name.slice(0, 5).toUpperCase(), domain || 'edu.lk', pattern || `^${(code || 'UNI')}-\\d{6}$`]);
  res.status(201).json(r.rows[0]);
}));
app.put('/api/universities/:id', asyncRoute(async (req, res) => {
  const { name, category, code, domain, pattern } = req.body;
  const r = await pool.query(
    `UPDATE universities SET name=COALESCE($1,name), category=COALESCE($2,category), code=COALESCE($3,code), domain=COALESCE($4,domain), pattern=COALESCE($5,pattern) WHERE id=$6 RETURNING *`,
    [name, category, code, domain, pattern, req.params.id]);
  res.json(r.rows[0]);
}));
app.delete('/api/universities/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM universities WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

// ---------- USERS ----------
app.get('/api/users', asyncRoute(async (req, res) => {
  const { role } = req.query;
  const r = role
    ? await pool.query('SELECT * FROM users WHERE role=$1 ORDER BY created_at ASC', [role])
    : await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  res.json(await Promise.all(r.rows.map(buildUser)));
}));
app.get('/api/users/:id', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(await buildUser(r.rows[0]));
}));
app.get('/api/users/:id/posts', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM posts WHERE author_id=$1 ORDER BY created_at DESC', [req.params.id]);
  res.json(await Promise.all(r.rows.map(buildPost)));
}));
app.put('/api/users/:id', asyncRoute(async (req, res) => {
  const { name, bio, degree, faculty, avatarBase64, coverBase64, skills, company, industry, title, consultationFee } = req.body;
  const sets = []; const params = [];
  const push = (col, val) => { params.push(val); sets.push(`${col}=$${params.length}`); };
  if (name !== undefined) push('name', name);
  if (bio !== undefined) push('bio', bio);
  if (degree !== undefined) push('degree', degree);
  if (faculty !== undefined) push('faculty', faculty);
  if (company !== undefined) push('company', company);
  if (industry !== undefined) push('industry', industry);
  if (title !== undefined) push('title', title);
  if (consultationFee !== undefined) push('consultation_fee', consultationFee);
  if (skills !== undefined) push('skills', Array.isArray(skills) ? skills.join(', ') : skills);
  if (avatarBase64 !== undefined) push('avatar_base64', avatarBase64);
  if (coverBase64 !== undefined) push('cover_base64', coverBase64);
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  params.push(req.params.id);
  const r = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`, params);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(await buildUser(r.rows[0]));
}));
app.delete('/api/users/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));
app.get('/api/users/:id/connections', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT u.* FROM user_connections c JOIN users u ON u.id = c.connected_user_id WHERE c.user_id=$1`,
    [req.params.id]);
  res.json(await Promise.all(r.rows.map(buildUser)));
}));
app.post('/api/users/:id/connections', asyncRoute(async (req, res) => {
  const { targetId } = req.body;
  await pool.query(`INSERT INTO user_connections (user_id, connected_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.id, targetId]);
  await pool.query(`INSERT INTO user_connections (user_id, connected_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [targetId, req.params.id]);
  res.json({ message: 'Connected' });
}));
app.delete('/api/users/:id/connections/:targetId', asyncRoute(async (req, res) => {
  await pool.query(`DELETE FROM user_connections WHERE (user_id=$1 AND connected_user_id=$2) OR (user_id=$2 AND connected_user_id=$1)`, [req.params.id, req.params.targetId]);
  res.json({ message: 'Disconnected' });
}));
app.get('/api/users/:id/invites', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT pr.*, p.title AS project_title, p.owner_name, p.owner_avatar_base64, p.description AS project_description
     FROM project_requests pr JOIN projects p ON p.id = pr.project_id
     WHERE pr.applicant_id=$1 AND pr.type='invite' AND pr.status='Pending'
     ORDER BY pr.created_at DESC`, [req.params.id]);
  res.json(r.rows.map(x => ({
    id: x.id, projectId: x.project_id, projectTitle: x.project_title,
    ownerName: x.owner_name, ownerAvatar: x.owner_avatar_base64,
    projectDescription: x.project_description,
    skill: x.skill, pitch: x.pitch, createdAt: x.created_at
  })));
}));
app.get('/api/notifications/:id', asyncRoute(async (req, res) => {
  const user = await pool.query('SELECT role FROM users WHERE id=$1', [req.params.id]);
  if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
  const role = user.rows[0].role;
  const [sessions, questions, advisor, invites] = await Promise.all([
    pool.query(role === 'professor'
      ? `SELECT COUNT(*) FROM professor_sessions WHERE prof_id=$1 AND status='Pending'`
      : `SELECT COUNT(*) FROM professor_sessions WHERE student_id=$1 AND status IN ('Approved','Rejected')`, [req.params.id]),
    pool.query(role === 'professor'
      ? `SELECT COUNT(*) FROM professor_questions WHERE prof_id=$1 AND answer IS NULL`
      : `SELECT COUNT(*) FROM professor_questions WHERE student_id=$1 AND answer IS NOT NULL`, [req.params.id]),
    role === 'professor'
      ? pool.query(`SELECT COUNT(*) FROM project_advisors WHERE prof_id=$1 AND status='Pending'`, [req.params.id])
      : Promise.resolve({ rows: [{ count: 0 }] }),
    pool.query(`SELECT COUNT(*) FROM project_requests WHERE applicant_id=$1 AND type='invite' AND status='Pending'`, [req.params.id])
  ]);
  res.json({
    calendar: Number(sessions.rows[0].count),
    questions: Number(questions.rows[0].count),
    projects: Number(advisor.rows[0].count),
    invites: Number(invites.rows[0].count)
  });
}));
app.get('/api/users/:id/enrollments', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT ce.*, pv.title AS video_title, pv.thumbnail_url, pv.video_url, pv.duration_minutes,
            u.name AS prof_name, u.avatar_base64 AS prof_avatar
     FROM course_enrollments ce
     JOIN professor_videos pv ON pv.id = ce.video_id
     JOIN users u ON u.id = ce.prof_id
     WHERE ce.student_id = $1 ORDER BY ce.created_at DESC`, [req.params.id]);
  res.json(r.rows.map(e => ({
    id: e.id, videoId: e.video_id, videoTitle: e.video_title,
    thumbnailUrl: e.thumbnail_url, videoUrl: e.video_url,
    durationMinutes: e.duration_minutes,
    profId: e.prof_id, profName: e.prof_name, profAvatar: e.prof_avatar,
    status: e.status, isPaid: e.is_paid,
    amountPaid: e.amount_paid, transactionId: e.transaction_id, paidAt: e.paid_at
  })));
}));

// ---------- AUTH ----------
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password, role } = req.body;
  if ((email === 'admin@uniyo.lk' || role === 'admin') && password === '1234') {
    const a = await pool.query("SELECT * FROM users WHERE role='admin' LIMIT 1");
    if (a.rows.length) return res.json({ success: true, user: await buildUser(a.rows[0]) });
  }
  const r = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
  if (!r.rows.length) return res.status(401).json({ error: 'Invalid email' });
  const u = r.rows[0];
  if (u.password && password && u.password !== password) return res.status(401).json({ error: 'Invalid password' });
  res.json({ success: true, user: await buildUser(u) });
}));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { role, name, email, password, studentId, university, faculty, degree, company, industry, avatarBase64, idCardBase64, bio, title, skills, enterpriseProfile } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Name and email required' });
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

  let isVerified = false, status = 'pending';
  let reason = 'Submitted for verification. Manual review typically completes within 1–3 hours.';
  if (role === 'student' && university && studentId) {
    const uni = await pool.query('SELECT pattern FROM universities WHERE name=$1', [university]);
    if (uni.rows.length) {
      try {
        const re = new RegExp(uni.rows[0].pattern);
        if (re.test(studentId)) { isVerified = true; status = 'verified'; reason = `Auto-verified for ${university}.`; }
        else { reason = `Student ID pattern mismatch. Flagged for admin review.`; }
      } catch {}
    }
  } else if (role === 'business') {
    isVerified = false; status = 'pending'; reason = 'Enterprise submission received. Admin verification is expected within 24–48 hours.';
  } else { isVerified = true; status = 'verified'; reason = 'Account created.'; }

  const defaultAvatar = avatarBase64 || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230A66C2"/><circle cx="50" cy="40" r="20" fill="%23ffffff"/><path d="M20,85 C20,65 35,60 50,60 C65,60 80,65 80,85 Z" fill="%23ffffff"/></svg>';
  const userId = `usr_${role || 'student'}_${Date.now()}`;

  const r = await pool.query(
    `INSERT INTO users (id, role, name, email, password, student_id, university_name, faculty, degree, company, industry, title, bio, avatar_base64, skills, verified, verification_status, verification_reason, enterprise_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [userId, role || 'student', name, email, password || '1234', studentId || null,
     university || null, faculty || null, degree || null, company || null, industry || null,
     title || null, bio || 'Undergraduate student building tech solutions.', defaultAvatar,
    skills || null, isVerified, status, reason, enterpriseProfile || null]);

  if (!isVerified) {
    await pool.query(
      `INSERT INTO verification_queue (id, user_id, name, email, student_id, university, submitted_at, id_format_match, otp_verified, ai_confidence, flag_reason, id_card_base64, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [`ver_${Date.now()}`, userId, name, email, studentId, university, 'Just now', false, true, '84% - Ambiguous Format', reason, idCardBase64 || null, 'Pending']);
  }
  res.status(201).json(await buildUser(r.rows[0]));
}));

// ---------- POSTS ----------
app.get('/api/posts', asyncRoute(async (_req, res) => {
  const r = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
  res.json(await Promise.all(r.rows.map(buildPost)));
}));
app.post('/api/posts', asyncRoute(async (req, res) => {
  const { authorId, content, imageBase64, attachmentBase64, attachmentName, tags, taggedUserIds } = req.body;
  if (!content && !imageBase64 && !attachmentBase64) return res.status(400).json({ error: 'Content required' });
  const au = await pool.query('SELECT * FROM users WHERE id=$1', [authorId]);
  if (!au.rows.length) return res.status(400).json({ error: 'Invalid author' });
  const a = au.rows[0];
  const pid = `post_${Date.now()}`;
  await pool.query(
    `INSERT INTO posts (id, author_id, author_name, author_university, author_avatar_base64, author_role, author_verified, content, image_base64, attachment_base64, attachment_name, tags, tagged_user_ids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [pid, a.id, a.name, a.university_name, a.avatar_base64, a.role, a.verified,
     content || '', imageBase64 || null, attachmentBase64 || null, attachmentName || null,
     tags && tags.length ? tags : ['#UniYO'], taggedUserIds || []]);
  const created = await pool.query('SELECT * FROM posts WHERE id=$1', [pid]);
  res.status(201).json(await buildPost(created.rows[0]));
}));
app.put('/api/posts/:id', asyncRoute(async (req, res) => {
  const { content, tags } = req.body;
  await pool.query('UPDATE posts SET content=COALESCE($1,content), tags=COALESCE($2,tags) WHERE id=$3', [content, tags, req.params.id]);
  const r = await pool.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
  res.json(await buildPost(r.rows[0]));
}));
app.delete('/api/posts/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM posts WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));
app.post('/api/posts/:id/like', asyncRoute(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const ex = await pool.query('SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, userId]);
  if (ex.rows.length) await pool.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, userId]);
  else await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2)', [req.params.id, userId]);
  const r = await pool.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
  res.json(await buildPost(r.rows[0]));
}));
app.get('/api/posts/:id/comments', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM post_comments WHERE post_id=$1 ORDER BY created_at ASC', [req.params.id]);
  res.json(r.rows.map(c => ({ id: c.id, authorId: c.author_id, authorName: c.author_name, authorAvatar: c.author_avatar_base64, content: c.content, time: c.created_at })));
}));
app.post('/api/posts/:id/comments', asyncRoute(async (req, res) => {
  const { authorId, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [authorId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid author' });
  const a = u.rows[0];
  const cid = `cmt_${Date.now()}`;
  await pool.query(`INSERT INTO post_comments (id, post_id, author_id, author_name, author_avatar_base64, content) VALUES ($1,$2,$3,$4,$5,$6)`, [cid, req.params.id, a.id, a.name, a.avatar_base64, content]);
  await pool.query(`UPDATE posts SET comments_count=(SELECT COUNT(*) FROM post_comments WHERE post_id=$1) WHERE id=$1`, [req.params.id]);
  const c = await pool.query('SELECT * FROM post_comments WHERE id=$1', [cid]);
  res.status(201).json({ id: c.rows[0].id, authorId: c.rows[0].author_id, authorName: c.rows[0].author_name, authorAvatar: c.rows[0].author_avatar_base64, content: c.rows[0].content, time: new Date(c.rows[0].created_at).toLocaleString() });
}));
app.delete('/api/posts/:postId/comments/:commentId', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM post_comments WHERE id=$1 AND post_id=$2', [req.params.commentId, req.params.postId]);
  await pool.query(`UPDATE posts SET comments_count=(SELECT COUNT(*) FROM post_comments WHERE post_id=$1) WHERE id=$1`, [req.params.postId]);
  res.json({ message: 'Deleted' });
}));

// ---------- PROJECTS ----------
app.get('/api/projects', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId || null;
  const r = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  res.json(await Promise.all(r.rows.map(p => buildProject(p, viewerId))));
}));
app.get('/api/projects/:id', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId || null;
  const r = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(await buildProject(r.rows[0], viewerId));
}));
app.post('/api/projects', asyncRoute(async (req, res) => {
  const { ownerId, title, description, bannerBase64, openUniversities, skillsNeeded, seekingInvestment, investmentGoal, visibility } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [ownerId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid owner' });
  const o = u.rows[0];
  const pid = `proj_${Date.now()}`;
  await pool.query(
    `INSERT INTO projects (id, owner_id, owner_name, owner_university, owner_avatar_base64, title, description, banner_base64, open_universities, skills_needed, seeking_investment, investment_goal, traction_score, visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [pid, o.id, o.name, o.university_name, o.avatar_base64, title, description,
     bannerBase64 || null, openUniversities || [], skillsNeeded || [],
     seekingInvestment || false, investmentGoal || 'LKR 1,000,000', 85, visibility || 'public']);
  await pool.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,'Lead Founder')`, [pid, o.id]);
  await pool.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type) VALUES ($1,$2,$3,$4,$5,$6,'system')`,
    [`msg_${Date.now()}`, pid, o.id, o.name, o.avatar_base64, 'Welcome to the project workspace!']);
  await logActivity(pid, o.id, o.name, 'created_project', null, null, `Created project ${title}`);
  const created = await pool.query('SELECT * FROM projects WHERE id=$1', [pid]);
  res.status(201).json(await buildProject(created.rows[0], ownerId));
}));
app.put('/api/projects/:id', asyncRoute(async (req, res) => {
  const { title, description, skillsNeeded, seekingInvestment, investmentGoal, visibility, userId } = req.body;
  await pool.query(
    `UPDATE projects SET title=COALESCE($1,title), description=COALESCE($2,description), skills_needed=COALESCE($3,skills_needed), seeking_investment=COALESCE($4,seeking_investment), investment_goal=COALESCE($5,investment_goal), visibility=COALESCE($6,visibility), updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
    [title, description, skillsNeeded, seekingInvestment, investmentGoal, visibility, req.params.id]);
  if (userId) {
    const u = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
    if (u.rows.length) await logActivity(req.params.id, userId, u.rows[0].name, 'updated_project', null, null, 'Updated project settings');
  }
  const r = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  res.json(await buildProject(r.rows[0], userId));
}));
app.delete('/api/projects/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

// Requests
app.post('/api/projects/:id/requests', asyncRoute(async (req, res) => {
  const { applicantId, skill, pitch } = req.body;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });
  if (proj.rows[0].visibility === 'private') return res.status(403).json({ error: 'Private project — invitation only' });
  if (await isMember(req.params.id, applicantId)) return res.status(400).json({ error: 'Already a member' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [applicantId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid applicant' });
  const a = u.rows[0];
  const dup = await pool.query(
    `SELECT id FROM project_requests WHERE project_id=$1 AND applicant_id=$2 AND type='request' AND status='Pending'`,
    [req.params.id, applicantId]);
  if (dup.rows.length) return res.status(409).json({ error: 'Request already pending' });
  const rid = `req_${Date.now()}`;
  await pool.query(
    `INSERT INTO project_requests (id, project_id, applicant_id, applicant_name, university, skill, pitch, status, type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending','request')`,
    [rid, req.params.id, a.id, a.name, a.university_name, skill || 'General', pitch || '']);
  await logActivity(req.params.id, a.id, a.name, 'requested_join', 'request', rid, `${a.name} requested to join`);
  res.status(201).json({ id: rid, status: 'Pending' });
}));

app.post('/api/projects/:id/invites', asyncRoute(async (req, res) => {
  const { invitedUserId, ownerId, skill, pitch } = req.body;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });
  if (proj.rows[0].owner_id !== ownerId) return res.status(403).json({ error: 'Only owner can invite' });
  if (await isMember(req.params.id, invitedUserId)) return res.status(400).json({ error: 'Already a member' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [invitedUserId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid user' });
  const a = u.rows[0];
  const dup = await pool.query(
    `SELECT id FROM project_requests WHERE project_id=$1 AND applicant_id=$2 AND type='invite' AND status='Pending'`,
    [req.params.id, invitedUserId]);
  if (dup.rows.length) return res.status(409).json({ error: 'Invite already pending' });
  const rid = `inv_${Date.now()}`;
  await pool.query(
    `INSERT INTO project_requests (id, project_id, applicant_id, applicant_name, university, skill, pitch, status, type, invited_by_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending','invite',$8)`,
    [rid, req.params.id, a.id, a.name, a.university_name, skill || 'General', pitch || '', ownerId]);
  await logActivity(req.params.id, ownerId, proj.rows[0].owner_name, 'invited_user', 'invite', rid, `Invited ${a.name} to join`);
  res.status(201).json({ id: rid, status: 'Pending' });
}));

app.put('/api/projects/:projectId/requests/:requestId', asyncRoute(async (req, res) => {
  const { status, ownerId } = req.body;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.projectId]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });
  if (proj.rows[0].owner_id !== ownerId) return res.status(403).json({ error: 'Only owner' });
  const rq = await pool.query(`SELECT * FROM project_requests WHERE id=$1 AND project_id=$2 AND type='request'`, [req.params.requestId, req.params.projectId]);
  if (!rq.rows.length) return res.status(404).json({ error: 'Request not found' });
  const r = rq.rows[0];
  await pool.query(`UPDATE project_requests SET status=$1, responded_at=CURRENT_TIMESTAMP WHERE id=$2`, [status, req.params.requestId]);
  if (status === 'Accepted') {
    await pool.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,'Collaborator') ON CONFLICT DO NOTHING`, [req.params.projectId, r.applicant_id]);
    await pool.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type) VALUES ($1,$2,$3,$4,$5,$6,'system')`,
      [`sys_${Date.now()}`, req.params.projectId, null, 'System', null, `${r.applicant_name} joined the project`]);
    await logActivity(req.params.projectId, ownerId, proj.rows[0].owner_name, 'accepted_request', 'request', req.params.requestId, `Accepted ${r.applicant_name}'s request`);
  }
  res.json({ message: 'Updated' });
}));

app.put('/api/projects/:projectId/invites/:inviteId', asyncRoute(async (req, res) => {
  const { status, userId } = req.body;
  const rq = await pool.query(`SELECT * FROM project_requests WHERE id=$1 AND project_id=$2 AND type='invite'`, [req.params.inviteId, req.params.projectId]);
  if (!rq.rows.length) return res.status(404).json({ error: 'Invite not found' });
  const r = rq.rows[0];
  if (r.applicant_id !== userId) return res.status(403).json({ error: 'Not your invite' });
  await pool.query(`UPDATE project_requests SET status=$1, responded_at=CURRENT_TIMESTAMP WHERE id=$2`, [status, req.params.inviteId]);
  if (status === 'Accepted') {
    await pool.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,'Collaborator') ON CONFLICT DO NOTHING`, [req.params.projectId, userId]);
    await pool.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type) VALUES ($1,$2,$3,$4,$5,$6,'system')`,
      [`sys_${Date.now()}`, req.params.projectId, null, 'System', null, `${r.applicant_name} joined the project`]);
    await logActivity(req.params.projectId, userId, r.applicant_name, 'accepted_invite', 'invite', req.params.inviteId, `${r.applicant_name} accepted the invite`);
  }
  res.json({ message: 'Updated' });
}));

app.delete('/api/projects/:projectId/requests/:requestId', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM project_requests WHERE id=$1', [req.params.requestId]);
  res.json({ message: 'Deleted' });
}));

app.delete('/api/projects/:projectId/members/:userId', asyncRoute(async (req, res) => {
  const { actorId } = req.query;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.projectId]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });
  const isOwner = proj.rows[0].owner_id === actorId;
  const isSelf = actorId === req.params.userId;
  if (!isOwner && !isSelf) return res.status(403).json({ error: 'Not allowed' });
  if (req.params.userId === proj.rows[0].owner_id) return res.status(400).json({ error: 'Cannot remove owner' });
  const u = await pool.query('SELECT name FROM users WHERE id=$1', [req.params.userId]);
  const memberName = u.rows[0]?.name || 'Member';
  await pool.query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.projectId, req.params.userId]);
  await pool.query(`UPDATE project_tasks SET assignee_id=NULL, assignee_name=NULL WHERE project_id=$1 AND assignee_id=$2`, [req.params.projectId, req.params.userId]);
  await logActivity(req.params.projectId, actorId, memberName, isSelf ? 'left_project' : 'removed_member', 'member', req.params.userId, isSelf ? `${memberName} left the project` : `Removed ${memberName}`);
  res.json({ message: 'Done' });
}));

app.get('/api/projects/:id/available-invitees', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT * FROM users WHERE role='student'
     AND id NOT IN (SELECT user_id FROM project_members WHERE project_id=$1)
     AND id NOT IN (SELECT applicant_id FROM project_requests WHERE project_id=$1 AND type='invite' AND status='Pending')
     ORDER BY name ASC`, [req.params.id]);
  res.json(await Promise.all(r.rows.map(buildUser)));
}));

// Advisor
app.post('/api/projects/:id/advisor-request', asyncRoute(async (req, res) => {
  const { profId, ownerId, pitch } = req.body;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });
  if (proj.rows[0].owner_id !== ownerId) return res.status(403).json({ error: 'Only owner' });
  const prof = await pool.query("SELECT * FROM users WHERE id=$1 AND role='professor'", [profId]);
  if (!prof.rows.length) return res.status(400).json({ error: 'Invalid professor' });
  const existing = await pool.query(`SELECT status FROM project_advisors WHERE project_id=$1 AND prof_id=$2`, [req.params.id, profId]);
  if (existing.rows.length && existing.rows[0].status === 'Active') {
    return res.status(409).json({ error: 'Already advising this project' });
  }
  await pool.query(
    `INSERT INTO project_advisors (project_id, prof_id, status, pitch, requested_by, requested_at)
     VALUES ($1,$2,'Pending',$3,$4,CURRENT_TIMESTAMP)
     ON CONFLICT (project_id, prof_id) DO UPDATE SET status='Pending', pitch=EXCLUDED.pitch, requested_by=EXCLUDED.requested_by, requested_at=CURRENT_TIMESTAMP`,
    [req.params.id, profId, pitch || '', ownerId]);
  await logActivity(req.params.id, ownerId, proj.rows[0].owner_name, 'requested_advisor', 'advisor', profId, `Requested Prof. ${prof.rows[0].name} to advise`);
  res.json({ message: 'Advisor request sent' });
}));

app.put('/api/projects/:projectId/advisor/:profId', asyncRoute(async (req, res) => {
  const { status, profId } = req.body;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.projectId]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });
  await pool.query(
    `UPDATE project_advisors SET status=$1, responded_at=CURRENT_TIMESTAMP WHERE project_id=$2 AND prof_id=$3`,
    [status, req.params.projectId, profId]);
  const prof = await pool.query('SELECT * FROM users WHERE id=$1', [profId]);
  const profName = prof.rows[0]?.name || 'Professor';
  if (status === 'Active') {
    await pool.query(`INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type) VALUES ($1,$2,$3,$4,$5,$6,'system')`,
      [`sys_${Date.now()}`, req.params.projectId, null, 'System', null, `${profName} joined as Faculty Advisor`]);
    await logActivity(req.params.projectId, profId, profName, 'advisor_accepted', 'advisor', profId, `${profName} accepted advisor role`);
  } else {
    await logActivity(req.params.projectId, profId, profName, 'advisor_declined', 'advisor', profId, `${profName} declined advisor request`);
  }
  res.json({ message: 'Updated' });
}));

app.delete('/api/projects/:projectId/advisor/:profId', asyncRoute(async (req, res) => {
  const { actorId } = req.query;
  const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.projectId]);
  if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });
  if (proj.rows[0].owner_id !== actorId) return res.status(403).json({ error: 'Only owner' });
  await pool.query(`DELETE FROM project_advisors WHERE project_id=$1 AND prof_id=$2`, [req.params.projectId, req.params.profId]);
  res.json({ message: 'Advisor removed' });
}));

app.get('/api/professors/:id/advisor-requests', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT pa.*, p.title AS project_title, p.description AS project_description,
            p.owner_name, p.owner_avatar_base64, p.traction_score
     FROM project_advisors pa JOIN projects p ON p.id = pa.project_id
     WHERE pa.prof_id=$1 AND pa.status='Pending' ORDER BY pa.requested_at DESC`, [req.params.id]);
  res.json(r.rows.map(x => ({
    projectId: x.project_id, projectTitle: x.project_title,
    projectDescription: x.project_description,
    ownerName: x.owner_name, ownerAvatar: x.owner_avatar_base64,
    tractionScore: x.traction_score,
    pitch: x.pitch, requestedAt: x.requested_at
  })));
}));

app.get('/api/professors/:id/advised-projects', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT p.*, pa.status AS advisor_status, pa.requested_at
     FROM project_advisors pa JOIN projects p ON p.id = pa.project_id
     WHERE pa.prof_id=$1 AND pa.status='Active'
     ORDER BY pa.requested_at DESC`, [req.params.id]);
  const projects = [];
  for (const p of r.rows) {
    const members = await pool.query(`SELECT COUNT(*) FROM project_members WHERE project_id=$1`, [p.id]);
    projects.push({
      id: p.id, title: p.title, description: p.description,
      ownerName: p.owner_name, ownerAvatar: p.owner_avatar_base64,
      memberCount: parseInt(members.rows[0].count, 10),
      tractionScore: p.traction_score,
      visibility: p.visibility,
      requestedAt: p.requested_at
    });
  }
  res.json(projects);
}));

// Messages
app.post('/api/projects/:id/messages', asyncRoute(async (req, res) => {
  const { senderId, text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (!(await canRead(req.params.id, senderId))) return res.status(403).json({ error: 'Only members and advisors can post' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [senderId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid sender' });
  const a = u.rows[0];
  const mid = `msg_${Date.now()}`;
  await pool.query(
    `INSERT INTO project_messages (id, project_id, sender_id, sender, avatar_base64, text, message_type) VALUES ($1,$2,$3,$4,$5,$6,'chat')`,
    [mid, req.params.id, a.id, a.name, a.avatar_base64, text]);
  const m = await pool.query('SELECT * FROM project_messages WHERE id=$1', [mid]);
  res.status(201).json({
    id: m.rows[0].id, senderId: m.rows[0].sender_id, sender: m.rows[0].sender,
    avatar: m.rows[0].avatar_base64, text: m.rows[0].text, messageType: 'chat',
    time: new Date(m.rows[0].created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
  });
}));

// Repos
app.post('/api/projects/:id/repos', asyncRoute(async (req, res) => {
  const { name, url, stars, userId } = req.body;
  const proj = await pool.query('SELECT owner_id, owner_name FROM projects WHERE id=$1', [req.params.id]);
  if (!proj.rows.length || proj.rows[0].owner_id !== userId) return res.status(403).json({ error: 'Only owner' });
  const rid = `repo_${Date.now()}`;
  await pool.query(`INSERT INTO project_repos (id, project_id, name, url, stars) VALUES ($1,$2,$3,$4,$5)`, [rid, req.params.id, name, url, stars || 0]);
  await logActivity(req.params.id, userId, proj.rows[0].owner_name, 'added_repo', 'repo', rid, `Added repo ${name}`);
  res.status(201).json({ id: rid, name, url, stars: stars || 0 });
}));
app.delete('/api/projects/:pid/repos/:rid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM project_repos WHERE id=$1 AND project_id=$2', [req.params.rid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

// Docs
app.post('/api/projects/:id/docs', asyncRoute(async (req, res) => {
  const { title, size, url, userId } = req.body;
  const proj = await pool.query('SELECT owner_id, owner_name FROM projects WHERE id=$1', [req.params.id]);
  if (!proj.rows.length || proj.rows[0].owner_id !== userId) return res.status(403).json({ error: 'Only owner' });
  const did = `doc_${Date.now()}`;
  await pool.query(`INSERT INTO project_docs (id, project_id, title, size, url) VALUES ($1,$2,$3,$4,$5)`, [did, req.params.id, title, size || 'N/A', url || '#']);
  await logActivity(req.params.id, userId, proj.rows[0].owner_name, 'added_doc', 'doc', did, `Added document ${title}`);
  res.status(201).json({ id: did, title, size: size || 'N/A', url: url || '#' });
}));
app.delete('/api/projects/:pid/docs/:did', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM project_docs WHERE id=$1 AND project_id=$2', [req.params.did, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

// Tasks
app.get('/api/projects/:id/tasks', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId;
  if (!(await canRead(req.params.id, viewerId))) return res.status(403).json({ error: 'Members only' });
  const r = await pool.query('SELECT * FROM project_tasks WHERE project_id=$1 ORDER BY created_at DESC', [req.params.id]);
  res.json(r.rows);
}));
app.post('/api/projects/:id/tasks', asyncRoute(async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate, userId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  if (!(await isMember(req.params.id, userId))) return res.status(403).json({ error: 'Members only' });
  const u = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
  let assigneeName = null;
  if (assigneeId) {
    const an = await pool.query('SELECT name FROM users WHERE id=$1', [assigneeId]);
    assigneeName = an.rows[0]?.name || null;
  }
  const tid = `task_${Date.now()}`;
  await pool.query(
    `INSERT INTO project_tasks (id, project_id, title, description, status, priority, assignee_id, assignee_name, due_date, created_by_id, created_by_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [tid, req.params.id, title, description || '', status || 'todo', priority || 'medium',
     assigneeId || null, assigneeName, dueDate || null, userId, u.rows[0].name]);
  await logActivity(req.params.id, userId, u.rows[0].name, 'created_task', 'task', tid, `Created task "${title}"`);
  res.status(201).json({ id: tid, title, description, status: status || 'todo', priority: priority || 'medium', assigneeId, assigneeName, dueDate });
}));
app.put('/api/projects/:pid/tasks/:tid', asyncRoute(async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate, userId } = req.body;
  if (!(await isMember(req.params.pid, userId))) return res.status(403).json({ error: 'Members only' });
  const sets = []; const params = [];
  const push = (col, val) => { params.push(val); sets.push(`${col}=$${params.length}`); };
  if (title !== undefined) push('title', title);
  if (description !== undefined) push('description', description);
  if (status !== undefined) push('status', status);
  if (priority !== undefined) push('priority', priority);
  if (dueDate !== undefined) push('due_date', dueDate);
  if (assigneeId !== undefined) {
    push('assignee_id', assigneeId || null);
    if (assigneeId) {
      const an = await pool.query('SELECT name FROM users WHERE id=$1', [assigneeId]);
      push('assignee_name', an.rows[0]?.name || null);
    } else push('assignee_name', null);
  }
  sets.push('updated_at=CURRENT_TIMESTAMP');
  params.push(req.params.tid, req.params.pid);
  await pool.query(`UPDATE project_tasks SET ${sets.join(', ')} WHERE id=$${params.length - 1} AND project_id=$${params.length}`, params);
  if (status === 'done') {
    const u = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
    await logActivity(req.params.pid, userId, u.rows[0]?.name || 'User', 'completed_task', 'task', req.params.tid, `Completed a task`);
  }
  const r = await pool.query('SELECT * FROM project_tasks WHERE id=$1', [req.params.tid]);
  res.json(r.rows[0]);
}));
app.delete('/api/projects/:pid/tasks/:tid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM project_tasks WHERE id=$1 AND project_id=$2', [req.params.tid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

// Meetings
app.get('/api/projects/:id/meetings', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId;
  if (!(await canRead(req.params.id, viewerId))) return res.status(403).json({ error: 'Members only' });
  const r = await pool.query('SELECT * FROM project_meetings WHERE project_id=$1 ORDER BY meeting_date ASC', [req.params.id]);
  res.json(r.rows);
}));
app.post('/api/projects/:id/meetings', asyncRoute(async (req, res) => {
  const { title, description, date, time, durationMinutes, link, attendeeIds, userId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  if (!(await isMember(req.params.id, userId))) return res.status(403).json({ error: 'Members only' });
  const u = await pool.query('SELECT name FROM users WHERE id=$1', [userId]);
  const mid = `meet_${Date.now()}`;
  await pool.query(
    `INSERT INTO project_meetings (id, project_id, title, description, meeting_date, meeting_time, duration_minutes, link, status, created_by_id, created_by_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Scheduled',$9,$10)`,
    [mid, req.params.id, title, description || '', date || null, time || null, durationMinutes || 60, link || null, userId, u.rows[0].name]);
  if (Array.isArray(attendeeIds)) {
    for (const aid of attendeeIds) {
      await pool.query(`INSERT INTO project_meeting_attendees (meeting_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [mid, aid]);
    }
  }
  await logActivity(req.params.id, userId, u.rows[0].name, 'scheduled_meeting', 'meeting', mid, `Scheduled meeting "${title}"`);
  res.status(201).json({ id: mid, title, description, date, time, durationMinutes, link, status: 'Scheduled' });
}));
app.put('/api/projects/:pid/meetings/:mid', asyncRoute(async (req, res) => {
  const { title, description, date, time, durationMinutes, link, status, userId } = req.body;
  if (!(await isMember(req.params.pid, userId))) return res.status(403).json({ error: 'Members only' });
  await pool.query(
    `UPDATE project_meetings SET title=COALESCE($1,title), description=COALESCE($2,description), meeting_date=COALESCE($3,meeting_date), meeting_time=COALESCE($4,meeting_time), duration_minutes=COALESCE($5,duration_minutes), link=COALESCE($6,link), status=COALESCE($7,status) WHERE id=$8 AND project_id=$9`,
    [title, description, date, time, durationMinutes, link, status, req.params.mid, req.params.pid]);
  const r = await pool.query('SELECT * FROM project_meetings WHERE id=$1', [req.params.mid]);
  res.json(r.rows[0]);
}));
app.delete('/api/projects/:pid/meetings/:mid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM project_meetings WHERE id=$1 AND project_id=$2', [req.params.mid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

app.get('/api/projects/:id/activity', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId;
  if (!(await canRead(req.params.id, viewerId))) return res.status(403).json({ error: 'Members only' });
  const r = await pool.query('SELECT * FROM project_activity WHERE project_id=$1 ORDER BY created_at DESC LIMIT 100', [req.params.id]);
  res.json(r.rows);
}));

// ---------- PROFESSORS ----------
app.get('/api/professors', asyncRoute(async (_req, res) => {
  const r = await pool.query("SELECT * FROM users WHERE role='professor'");
  res.json(await Promise.all(r.rows.map(buildUser)));
}));

app.get('/api/professors/sessions', asyncRoute(async (req, res) => {
  const { profId, studentId } = req.query;
  let q = 'SELECT * FROM professor_sessions';
  const params = []; const conds = [];
  if (profId) { conds.push(`prof_id=$${params.length + 1}`); params.push(profId); }
  if (studentId) { conds.push(`student_id=$${params.length + 1}`); params.push(studentId); }
  if (conds.length) q += ' WHERE ' + conds.join(' AND ');
  q += ' ORDER BY created_at DESC';
  const r = await pool.query(q, params);
  res.json(r.rows.map(s => ({
    id: s.id, profId: s.prof_id, profName: s.prof_name, university: s.university,
    studentId: s.student_id, studentName: s.student_name, date: s.date, time: s.time,
    type: s.type, topic: s.topic, status: s.status, notes: s.notes,
    meetingLink: s.meeting_link, responseMessage: s.response_message, rejectionReason: s.rejection_reason,
    completedAt: s.completed_at, rating: s.rating, ratingComment: s.rating_comment
  })));
}));

app.get('/api/professors/:id', asyncRoute(async (req, res) => {
  const r = await pool.query("SELECT * FROM users WHERE id=$1 AND role='professor'", [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });

  const prof = await buildUser(r.rows[0]);
  prof.consultationFee = r.rows[0].consultation_fee || 0;
  prof.consultationCurrency = r.rows[0].consultation_currency || 'LKR';

  const [vids, sess, advised, reviews, avgSession] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM professor_videos WHERE prof_id=$1', [req.params.id]),
    pool.query('SELECT COUNT(*) FROM professor_sessions WHERE prof_id=$1', [req.params.id]),
    pool.query(`SELECT COUNT(*) FROM project_advisors WHERE prof_id=$1 AND status='Active'`, [req.params.id]),
    pool.query('SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as count FROM session_reviews WHERE prof_id=$1', [req.params.id]),
    pool.query('SELECT AVG(rating)::numeric(3,2) as avg FROM professor_sessions WHERE prof_id=$1 AND rating IS NOT NULL', [req.params.id])
  ]);

  prof.profStats = {
    videos: parseInt(vids.rows[0].count, 10),
    sessions: parseInt(sess.rows[0].count, 10),
    advisedProjects: parseInt(advised.rows[0].count, 10),
    reviewCount: parseInt(reviews.rows[0].count, 10),
    avgRating: reviews.rows[0].avg
      ? parseFloat(reviews.rows[0].avg)
      : (avgSession.rows[0].avg ? parseFloat(avgSession.rows[0].avg) : 0)
  };
  res.json(prof);
}));

app.get('/api/professors/:id/overview', asyncRoute(async (req, res) => {
  const profId = req.params.id;
  const [pending, upcoming, completedCount, videos, questions, advised, avgRating] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM professor_sessions WHERE prof_id=$1 AND status='Confirmed'`, [profId]),
    pool.query(`SELECT COUNT(*) FROM professor_sessions WHERE prof_id=$1 AND status='Confirmed' AND date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')`, [profId]),
    pool.query(`SELECT COUNT(*) FROM professor_sessions WHERE prof_id=$1 AND status='Completed'`, [profId]),
    pool.query(`SELECT COUNT(*) FROM professor_videos WHERE prof_id=$1`, [profId]),
    pool.query(`SELECT COUNT(*) FROM professor_questions WHERE prof_id=$1 AND answer IS NULL`, [profId]),
    pool.query(`SELECT COUNT(*) FROM project_advisors WHERE prof_id=$1 AND status='Active'`, [profId]),
    pool.query(`SELECT AVG(rating)::numeric(3,2) as avg FROM professor_sessions WHERE prof_id=$1 AND rating IS NOT NULL`, [profId])
  ]);
  const advisorReqs = await pool.query(`SELECT COUNT(*) FROM project_advisors WHERE prof_id=$1 AND status='Pending'`, [profId]);
  res.json({
    confirmedSessions: parseInt(pending.rows[0].count, 10),
    upcomingSessions: parseInt(upcoming.rows[0].count, 10),
    completedSessions: parseInt(completedCount.rows[0].count, 10),
    videos: parseInt(videos.rows[0].count, 10),
    unansweredQuestions: parseInt(questions.rows[0].count, 10),
    advisedProjects: parseInt(advised.rows[0].count, 10),
    pendingAdvisorRequests: parseInt(advisorReqs.rows[0].count, 10),
    avgRating: avgRating.rows[0].avg ? parseFloat(avgRating.rows[0].avg) : 0
  });
}));

app.get('/api/professors/:id/availability', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM professor_availability WHERE prof_id=$1 ORDER BY id', [req.params.id]);
  res.json(r.rows);
}));
app.post('/api/professors/:id/availability', asyncRoute(async (req, res) => {
  const { day, time } = req.body;
  if (!day || !time) return res.status(400).json({ error: 'Day and time required' });
  const id = `av_${Date.now()}`;
  await pool.query('INSERT INTO professor_availability (id, prof_id, day, time) VALUES ($1,$2,$3,$4)', [id, req.params.id, day, time]);
  res.status(201).json({ id, prof_id: req.params.id, day, time });
}));
app.delete('/api/professors/:pid/availability/:aid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM professor_availability WHERE id=$1 AND prof_id=$2', [req.params.aid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

app.post('/api/professors/sessions', asyncRoute(async (req, res) => {
  const { profId, studentId, date, time, type, topic } = req.body;
  const p = await pool.query('SELECT * FROM users WHERE id=$1', [profId]);
  const s = await pool.query('SELECT * FROM users WHERE id=$1', [studentId]);
  if (!p.rows.length || !s.rows.length) return res.status(400).json({ error: 'Invalid' });
  const id = `sess_${Date.now()}`;
  await pool.query(
    `INSERT INTO professor_sessions (id, prof_id, prof_name, university, student_id, student_name, date, time, type, topic, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending')`,
    [id, p.rows[0].id, p.rows[0].name, p.rows[0].university_name, s.rows[0].id, s.rows[0].name, date, time, type || 'Consultation', topic || '']);
  res.status(201).json({ id, profId, profName: p.rows[0].name, studentId, studentName: s.rows[0].name, date, time, type, topic, status: 'Pending' });
}));
app.put('/api/professors/sessions/:id', asyncRoute(async (req, res) => {
  const { actorId, topic, status, date, time, notes, rating, ratingComment, meetingLink, responseMessage, rejectionReason } = req.body;
  const existing = await pool.query('SELECT * FROM professor_sessions WHERE id=$1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Session not found' });
  const session = existing.rows[0];
  const isProfessor = actorId === session.prof_id;
  const isStudent = actorId === session.student_id;
  if (!isProfessor && !isStudent) return res.status(403).json({ error: 'Not allowed' });
  if (isStudent && ['status', 'meetingLink', 'responseMessage', 'rejectionReason'].some(key => req.body[key] !== undefined)) {
    return res.status(403).json({ error: 'Students cannot approve, reject, or set meeting details' });
  }
  if (isProfessor && status && !['Approved', 'Rejected', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid session status' });
  }
  await pool.query(
    `UPDATE professor_sessions SET topic=COALESCE($1,topic), status=COALESCE($2,status), date=CASE WHEN $10 THEN COALESCE($3,date) ELSE date END, time=CASE WHEN $10 THEN COALESCE($4,time) ELSE time END, notes=COALESCE($5,notes), rating=COALESCE($6,rating), rating_comment=COALESCE($7,rating_comment), meeting_link=COALESCE($8,meeting_link), response_message=COALESCE($9,response_message), rejection_reason=COALESCE($11,rejection_reason), completed_at=CASE WHEN $2='Completed' THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=$12`,
    [isProfessor ? topic : undefined, isProfessor ? status : undefined, date, time, notes, rating, ratingComment, meetingLink, responseMessage, isStudent, rejectionReason, req.params.id]);
  const r = await pool.query('SELECT * FROM professor_sessions WHERE id=$1', [req.params.id]);
  res.json(r.rows[0]);
}));
app.delete('/api/professors/sessions/:id', asyncRoute(async (req, res) => {
  const { actorId } = req.body || {};
  const existing = await pool.query('SELECT prof_id, student_id, status FROM professor_sessions WHERE id=$1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Session not found' });
  if (actorId !== existing.rows[0].prof_id) return res.status(403).json({ error: 'Only the professor can delete a booking' });
  await pool.query('DELETE FROM professor_sessions WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

// Reviews
app.get('/api/professors/:id/reviews', asyncRoute(async (req, res) => {
  const r = await pool.query(
    `SELECT * FROM session_reviews WHERE prof_id=$1 ORDER BY created_at DESC`, [req.params.id]);
  const avg = await pool.query(
    `SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as count FROM session_reviews WHERE prof_id=$1`,
    [req.params.id]);
  res.json({
    reviews: r.rows.map(x => ({
      id: x.id, sessionId: x.session_id, studentId: x.student_id,
      studentName: x.student_name, studentAvatar: x.student_avatar,
      rating: x.rating, comment: x.comment, createdAt: x.created_at
    })),
    avgRating: avg.rows[0].avg ? parseFloat(avg.rows[0].avg) : 0,
    count: parseInt(avg.rows[0].count, 10)
  });
}));

app.post('/api/professors/:id/reviews', asyncRoute(async (req, res) => {
  const { studentId, rating, comment } = req.body;
  if (!studentId || !rating || rating < 1 || rating > 5 || !comment?.trim()) return res.status(400).json({ error: 'Rating and review are required' });
  const professor = await pool.query("SELECT id FROM users WHERE id=$1 AND role='professor'", [req.params.id]);
  if (!professor.rows.length) return res.status(404).json({ error: 'Professor not found' });
  const student = await pool.query("SELECT id, name, avatar_base64 FROM users WHERE id=$1 AND role='student'", [studentId]);
  if (!student.rows.length) return res.status(403).json({ error: 'Only students can review professors' });
  const existing = await pool.query('SELECT id FROM session_reviews WHERE prof_id=$1 AND student_id=$2 AND session_id IS NULL', [req.params.id, studentId]);
  const id = existing.rows[0]?.id || `review_${Date.now()}`;
  if (existing.rows.length) {
    await pool.query('UPDATE session_reviews SET rating=$1, comment=$2, created_at=CURRENT_TIMESTAMP WHERE id=$3', [rating, comment.trim(), id]);
  } else {
    await pool.query(`INSERT INTO session_reviews (id, session_id, prof_id, student_id, student_name, student_avatar, rating, comment) VALUES ($1,NULL,$2,$3,$4,$5,$6,$7)`, [id, req.params.id, studentId, student.rows[0].name, student.rows[0].avatar_base64, rating, comment.trim()]);
  }
  res.status(201).json({ id, profId: req.params.id, studentId, rating, comment: comment.trim() });
}));

app.put('/api/professors/reviews/:reviewId', asyncRoute(async (req, res) => {
  const { studentId, rating, comment } = req.body;
  const r = await pool.query('UPDATE session_reviews SET rating=$1, comment=$2, created_at=CURRENT_TIMESTAMP WHERE id=$3 AND student_id=$4 AND session_id IS NULL RETURNING id, prof_id, student_id, rating, comment', [rating, comment?.trim(), req.params.reviewId, studentId]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your professor review' });
  res.json(r.rows[0]);
}));

app.delete('/api/professors/reviews/:reviewId', asyncRoute(async (req, res) => {
  const r = await pool.query('DELETE FROM session_reviews WHERE id=$1 AND student_id=$2 AND session_id IS NULL RETURNING id', [req.params.reviewId, req.body?.studentId]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your professor review' });
  res.json({ message: 'Deleted' });
}));

app.post('/api/professors/sessions/:sid/review', asyncRoute(async (req, res) => {
  const { studentId, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5' });
  const s = await pool.query('SELECT * FROM professor_sessions WHERE id=$1', [req.params.sid]);
  if (!s.rows.length) return res.status(404).json({ error: 'Session not found' });
  if (s.rows[0].student_id !== studentId) return res.status(403).json({ error: 'Not your session' });
  if (s.rows[0].status !== 'Completed') return res.status(400).json({ error: 'Session not completed yet' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [studentId]);
  const existing = await pool.query('SELECT * FROM session_reviews WHERE session_id=$1', [req.params.sid]);
  const id = existing.rows.length ? existing.rows[0].id : `rev_${Date.now()}`;
  if (existing.rows.length) {
    await pool.query(
      `UPDATE session_reviews SET rating=$1, comment=$2, created_at=CURRENT_TIMESTAMP WHERE id=$3`,
      [rating, comment || '', id]);
  } else {
    await pool.query(
      `INSERT INTO session_reviews (id, session_id, prof_id, student_id, student_name, student_avatar, rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.params.sid, s.rows[0].prof_id, studentId, u.rows[0].name, u.rows[0].avatar_base64, rating, comment || '']);
  }
  await pool.query(
    `UPDATE professor_sessions SET rating=$1, rating_comment=$2 WHERE id=$3`,
    [rating, comment || '', req.params.sid]);
  res.json({ id, rating, comment });
}));

app.delete('/api/professors/sessions/:sid/review', asyncRoute(async (req, res) => {
  const { studentId } = req.body || {};
  const review = await pool.query('SELECT student_id FROM session_reviews WHERE session_id=$1', [req.params.sid]);
  if (!review.rows.length || review.rows[0].student_id !== studentId) return res.status(403).json({ error: 'Only the reviewer can delete this review' });
  await pool.query('DELETE FROM session_reviews WHERE session_id=$1', [req.params.sid]);
  await pool.query('UPDATE professor_sessions SET rating=NULL, rating_comment=NULL WHERE id=$1', [req.params.sid]);
  res.json({ message: 'Deleted' });
}));

app.post('/api/admin/complaints', asyncRoute(async (req, res) => {
  const { reporterId, targetType, targetId, reason } = req.body;
  if (!reporterId || !targetType || !targetId || !reason?.trim()) return res.status(400).json({ error: 'Complaint details required' });
  const id = `complaint_${Date.now()}`;
  await pool.query(`INSERT INTO admin_complaints (id, reporter_id, target_type, target_id, reason) VALUES ($1,$2,$3,$4,$5)`, [id, reporterId, targetType, targetId, reason.trim()]);
  res.status(201).json({ id, status: 'Pending' });
}));

app.put('/api/investment-meetings/:id', asyncRoute(async (req, res) => {
  const { actorId, action, changeRequest, date, time, link, message } = req.body;
  const current = await pool.query('SELECT * FROM investment_meetings WHERE id=$1', [req.params.id]);
  if (!current.rows.length) return res.status(404).json({ error: 'Meeting not found' });
  const meeting = current.rows[0];

  if (actorId !== meeting.student_id && actorId !== meeting.investor_id) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  if (actorId === meeting.student_id && action === 'change_request') {
    await pool.query(
      "UPDATE investment_meetings SET status='Change requested', change_request=$1 WHERE id=$2",
      [changeRequest, req.params.id]
    );
  } else if (actorId === meeting.student_id && action === 'accept') {
    await pool.query(
      "UPDATE investment_meetings SET status='Accepted' WHERE id=$1",
      [req.params.id]
    );
  } else if (actorId === meeting.investor_id) {
    await pool.query(
      "UPDATE investment_meetings SET date=COALESCE($1,date), time=COALESCE($2,time), link=COALESCE($3,link), message=COALESCE($4,message), status='Proposed' WHERE id=$5",
      [date, time, link, message, req.params.id]
    );
  } else {
    return res.status(403).json({ error: 'Invalid meeting action' });
  }

  const r = await pool.query('SELECT * FROM investment_meetings WHERE id=$1', [req.params.id]);
  res.json(r.rows[0]);
}));

// Videos
app.get('/api/professors/:id/videos', asyncRoute(async (req, res) => {
  const viewerId = req.query.viewerId || null;
  const r = await pool.query('SELECT * FROM professor_videos WHERE prof_id=$1 ORDER BY created_at DESC', [req.params.id]);
  const out = [];
  for (const v of r.rows) {
    const [imps, avg, enrollment, enrollCount] = await Promise.all([
      pool.query('SELECT * FROM professor_video_impressions WHERE video_id=$1 ORDER BY created_at DESC', [v.id]),
      pool.query('SELECT AVG(rating)::numeric(3,2) as avg FROM professor_video_impressions WHERE video_id=$1 AND rating IS NOT NULL', [v.id]),
      viewerId
        ? pool.query('SELECT * FROM course_enrollments WHERE video_id=$1 AND student_id=$2', [v.id, viewerId])
        : Promise.resolve({ rows: [] }),
      pool.query('SELECT COUNT(*) FROM course_enrollments WHERE video_id=$1', [v.id])
    ]);
    out.push({
      id: v.id, profId: v.prof_id, title: v.title, description: v.description,
      videoUrl: v.video_url, thumbnailUrl: v.thumbnail_url,
      durationMinutes: v.duration_minutes, tags: v.tags || [], views: v.views,
      price: v.price || 0, currency: v.currency || 'LKR',
      createdAt: v.created_at,
      avgRating: avg.rows[0].avg ? parseFloat(avg.rows[0].avg) : 0,
      enrolledCount: parseInt(enrollCount.rows[0].count, 10),
      isEnrolled: enrollment.rows.length > 0,
      enrollment: enrollment.rows[0] ? {
        id: enrollment.rows[0].id,
        status: enrollment.rows[0].status,
        isPaid: enrollment.rows[0].is_paid,
        transactionId: enrollment.rows[0].transaction_id,
        paidAt: enrollment.rows[0].paid_at
      } : null,
      impressions: imps.rows.map(i => ({
        id: i.id, studentId: i.student_id, studentName: i.student_name,
        studentAvatar: i.student_avatar, rating: i.rating, comment: i.comment,
        createdAt: i.created_at
      }))
    });
  }
  res.json(out);
}));

app.post('/api/professors/:id/videos', asyncRoute(async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, durationMinutes, tags, price } = req.body;
  if (!title || !videoUrl) return res.status(400).json({ error: 'Title and video URL required' });
  const id = `vid_${Date.now()}`;
  await pool.query(
    `INSERT INTO professor_videos (id, prof_id, title, description, video_url, thumbnail_url, duration_minutes, tags, price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, req.params.id, title, description || '', videoUrl, thumbnailUrl || null,
     durationMinutes || null, tags || [], price || 0]);
  res.status(201).json({ id, profId: req.params.id, title, description, videoUrl, thumbnailUrl, durationMinutes, tags: tags || [], views: 0, price: price || 0 });
}));

app.put('/api/professors/:pid/videos/:vid', asyncRoute(async (req, res) => {
  const { title, description, videoUrl, thumbnailUrl, durationMinutes, tags, price } = req.body;
  await pool.query(
    `UPDATE professor_videos SET title=COALESCE($1,title), description=COALESCE($2,description), video_url=COALESCE($3,video_url), thumbnail_url=COALESCE($4,thumbnail_url), duration_minutes=COALESCE($5,duration_minutes), tags=COALESCE($6,tags), price=COALESCE($7,price) WHERE id=$8 AND prof_id=$9`,
    [title, description, videoUrl, thumbnailUrl, durationMinutes, tags, price, req.params.vid, req.params.pid]);
  const r = await pool.query('SELECT * FROM professor_videos WHERE id=$1', [req.params.vid]);
  res.json(r.rows[0]);
}));

app.delete('/api/professors/:pid/videos/:vid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM professor_videos WHERE id=$1 AND prof_id=$2', [req.params.vid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

app.post('/api/professors/videos/:vid/view', asyncRoute(async (req, res) => {
  await pool.query('UPDATE professor_videos SET views = views + 1 WHERE id=$1', [req.params.vid]);
  res.json({ message: 'OK' });
}));

app.post('/api/professors/videos/:vid/impressions', asyncRoute(async (req, res) => {
  const { studentId, rating, comment } = req.body;
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [studentId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid student' });
  const a = u.rows[0];
  const id = `imp_${Date.now()}`;
  await pool.query(
    `INSERT INTO professor_video_impressions (id, video_id, student_id, student_name, student_avatar, rating, comment)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, req.params.vid, a.id, a.name, a.avatar_base64, rating || null, comment || '']);
  res.status(201).json({ id });
}));

// Enrollments
app.post('/api/professors/videos/:vid/enroll', asyncRoute(async (req, res) => {
  const { studentId } = req.body;
  const v = await pool.query('SELECT * FROM professor_videos WHERE id=$1', [req.params.vid]);
  if (!v.rows.length) return res.status(404).json({ error: 'Video not found' });
  if ((v.rows[0].price || 0) > 0) return res.status(400).json({ error: 'This is a paid course — payment required' });
  const existing = await pool.query('SELECT * FROM course_enrollments WHERE student_id=$1 AND video_id=$2', [studentId, req.params.vid]);
  if (existing.rows.length) return res.json({ message: 'Already enrolled', enrollment: existing.rows[0] });
  const id = `enr_${Date.now()}`;
  await pool.query(
    `INSERT INTO course_enrollments (id, student_id, video_id, prof_id, status, is_paid)
     VALUES ($1,$2,$3,$4,'Enrolled',FALSE)`,
    [id, studentId, req.params.vid, v.rows[0].prof_id]);
  res.status(201).json({ id, status: 'Enrolled', isPaid: false });
}));

app.post('/api/professors/videos/:vid/pay', asyncRoute(async (req, res) => {
  const { studentId, cardName, cardNumber, cardExpiry, cardCvv } = req.body;
  if (!studentId || !cardNumber) return res.status(400).json({ error: 'Card details required' });
  const digits = String(cardNumber).replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return res.status(400).json({ error: 'Invalid card number' });
  if (!/^\d{2}\/\d{2}$/.test(cardExpiry || '')) return res.status(400).json({ error: 'Invalid expiry (MM/YY)' });
  if (!/^\d{3,4}$/.test(String(cardCvv || ''))) return res.status(400).json({ error: 'Invalid CVV' });

  const v = await pool.query('SELECT * FROM professor_videos WHERE id=$1', [req.params.vid]);
  if (!v.rows.length) return res.status(404).json({ error: 'Video not found' });

  const existing = await pool.query('SELECT * FROM course_enrollments WHERE student_id=$1 AND video_id=$2', [studentId, req.params.vid]);
  if (existing.rows.length && existing.rows[0].is_paid) {
    return res.json({ message: 'Already paid', enrollment: existing.rows[0] });
  }

  const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const id = `enr_${Date.now()}`;

  if (existing.rows.length) {
    await pool.query(
      `UPDATE course_enrollments SET is_paid=TRUE, amount_paid=$1, transaction_id=$2, paid_at=CURRENT_TIMESTAMP, status='Paid' WHERE id=$3`,
      [String(v.rows[0].price), txnId, existing.rows[0].id]);
    return res.json({
      id: existing.rows[0].id, transactionId: txnId, amount: v.rows[0].price,
      currency: v.rows[0].currency || 'LKR', paidAt: new Date().toISOString()
    });
  }

  await pool.query(
    `INSERT INTO course_enrollments (id, student_id, video_id, prof_id, status, is_paid, amount_paid, transaction_id, paid_at)
     VALUES ($1,$2,$3,$4,'Paid',TRUE,$5,$6,CURRENT_TIMESTAMP)`,
    [id, studentId, req.params.vid, v.rows[0].prof_id, String(v.rows[0].price), txnId]);
  res.status(201).json({
    id, transactionId: txnId, amount: v.rows[0].price,
    currency: v.rows[0].currency || 'LKR', paidAt: new Date().toISOString()
  });
}));

// Q&A
app.get('/api/professors/:id/questions', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM professor_questions WHERE prof_id=$1 ORDER BY created_at DESC', [req.params.id]);
  res.json(r.rows.map(q => ({
    id: q.id, profId: q.prof_id, studentId: q.student_id,
    studentName: q.student_name, studentAvatar: q.student_avatar,
    question: q.question, answer: q.answer, answeredAt: q.answered_at,
    createdAt: q.created_at
  })));
}));
app.post('/api/professors/:id/questions', asyncRoute(async (req, res) => {
  const { studentId, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });
  const u = await pool.query('SELECT * FROM users WHERE id=$1', [studentId]);
  if (!u.rows.length) return res.status(400).json({ error: 'Invalid student' });
  const a = u.rows[0];
  const id = `q_${Date.now()}`;
  await pool.query(
    `INSERT INTO professor_questions (id, prof_id, student_id, student_name, student_avatar, question)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, req.params.id, a.id, a.name, a.avatar_base64, question]);
  res.status(201).json({ id, question, studentName: a.name });
}));
app.put('/api/professors/:pid/questions/:qid', asyncRoute(async (req, res) => {
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'Answer required' });
  await pool.query(
    `UPDATE professor_questions SET answer=$1, answered_at=CURRENT_TIMESTAMP WHERE id=$2 AND prof_id=$3`,
    [answer, req.params.qid, req.params.pid]);
  const r = await pool.query('SELECT * FROM professor_questions WHERE id=$1', [req.params.qid]);
  res.json(r.rows[0]);
}));
app.put('/api/professors/questions/:qid', asyncRoute(async (req, res) => {
  const { studentId, question } = req.body;
  if (!studentId || !question?.trim()) return res.status(400).json({ error: 'Question required' });
  const r = await pool.query('UPDATE professor_questions SET question=$1 WHERE id=$2 AND student_id=$3 RETURNING *', [question.trim(), req.params.qid, studentId]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your question' });
  res.json(r.rows[0]);
}));
app.delete('/api/professors/questions/:qid', asyncRoute(async (req, res) => {
  const r = await pool.query('DELETE FROM professor_questions WHERE id=$1 AND student_id=$2 RETURNING id', [req.params.qid, req.body?.studentId]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your question' });
  res.json({ message: 'Deleted' });
}));
app.put('/api/professors/:pid/questions/:qid/answer', asyncRoute(async (req, res) => {
  const { answer } = req.body;
  if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });
  const r = await pool.query('UPDATE professor_questions SET answer=$1, answered_at=CURRENT_TIMESTAMP WHERE id=$2 AND prof_id=$3 RETURNING *', [answer.trim(), req.params.qid, req.params.pid]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your question' });
  res.json(r.rows[0]);
}));
app.delete('/api/professors/:pid/questions/:qid/answer', asyncRoute(async (req, res) => {
  const r = await pool.query('UPDATE professor_questions SET answer=NULL, answered_at=NULL WHERE id=$1 AND prof_id=$2 RETURNING id', [req.params.qid, req.params.pid]);
  if (!r.rows.length) return res.status(403).json({ error: 'Not your question' });
  res.json({ message: 'Answer deleted' });
}));
app.delete('/api/professors/:pid/questions/:qid', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM professor_questions WHERE id=$1 AND prof_id=$2', [req.params.qid, req.params.pid]);
  res.json({ message: 'Deleted' });
}));

// ---------- INTERNSHIPS ----------
app.get('/api/internships', asyncRoute(async (req, res) => {
  const r = await pool.query(req.query.ownerId ? 'SELECT * FROM internships WHERE owner_id=$1 ORDER BY created_at DESC' : 'SELECT * FROM internships ORDER BY created_at DESC', req.query.ownerId ? [req.query.ownerId] : []);
  const jobs = r.rows;
  for (const j of jobs) {
    const apps = await pool.query('SELECT * FROM internship_applications WHERE internship_id=$1', [j.id]);
    j.applicants = apps.rows;
  }
  res.json(jobs);
}));
app.post('/api/internships', asyncRoute(async (req, res) => {
  const { title, company, location, stipend, type, description, ownerId } = req.body;
  const id = `job_${Date.now()}`;
  await pool.query(
    `INSERT INTO internships (id, owner_id, title, company, location, stipend, type, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, ownerId || null, title, company, location || 'Colombo', stipend || 'LKR 50,000', type || 'Internship', description]);
  const r = await pool.query('SELECT * FROM internships WHERE id=$1', [id]);
  res.status(201).json(r.rows[0]);
}));
app.put('/api/internships/:id', asyncRoute(async (req, res) => {
  const { title, location, stipend, description } = req.body;
  await pool.query(
    `UPDATE internships SET title=COALESCE($1,title), location=COALESCE($2,location), stipend=COALESCE($3,stipend), description=COALESCE($4,description) WHERE id=$5`,
    [title, location, stipend, description, req.params.id]);
  const r = await pool.query('SELECT * FROM internships WHERE id=$1', [req.params.id]);
  res.json(r.rows[0]);
}));
app.delete('/api/internships/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM internships WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));
app.put('/api/internships/:jobId/applicants/:appId', asyncRoute(async (req, res) => {
  await pool.query('UPDATE internship_applications SET status=$1 WHERE id=$2', [req.body.status, req.params.appId]);
  const r = await pool.query('SELECT * FROM internship_applications WHERE id=$1', [req.params.appId]);
  res.json(r.rows[0]);
}));

// ---------- APPLY (HARDENED) ----------
app.post('/api/internships/:jobId/apply', asyncRoute(async (req, res) => {
  try {
    const {
      userId, name, email, phone, university, degree, faculty, gpa,
      experience, cvBase64, cvName
    } = req.body;

    if (!userId || !name || !email || !phone || !degree || !experience || !cvBase64 || !cvName) {
      return res.status(400).json({ error: 'Personal details, education, experience, contact, and CV are required' });
    }

    const job = await pool.query('SELECT id FROM internships WHERE id=$1', [req.params.jobId]);
    if (!job.rows.length) {
      return res.status(404).json({ error: 'Internship posting not found' });
    }

    const user = await pool.query('SELECT id FROM users WHERE id=$1', [userId]);
    if (!user.rows.length) {
      return res.status(404).json({ error: 'User account not found. Please log out and log in again.' });
    }

    const existing = await pool.query(
      'SELECT id FROM internship_applications WHERE internship_id=$1 AND user_id=$2',
      [req.params.jobId, userId]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Already applied' });
    }

    const id = `app_${Date.now()}`;

    await pool.query(
      `INSERT INTO internship_applications
        (id, internship_id, user_id, name, email, phone, university, degree,
         faculty, gpa, experience, cv_base64, cv_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id,
        req.params.jobId,
        userId,
        String(name).slice(0, 255),
        String(email).slice(0, 255),
        String(phone || '').slice(0, 100),
        String(university || '').slice(0, 255),
        String(degree).slice(0, 255),
        String(faculty || '').slice(0, 255),
        String(gpa || '').slice(0, 50),
        String(experience || '').slice(0, 5000),
        String(cvBase64),
        String(cvName).slice(0, 255)
      ]
    );

    return res.status(201).json({ id, status: 'Applied' });
  } catch (err) {
    console.error('❌ apply route failed:', err.message);
    return res.status(500).json({ error: err.message || 'Application failed' });
  }
}));

// ---------- INVESTMENTS ----------
app.get('/api/investments', asyncRoute(async (req, res) => {
  const { investorId, studentId } = req.query;
  const r = investorId
    ? await pool.query('SELECT * FROM investment_interests WHERE investor_id=$1 ORDER BY created_at DESC', [investorId])
    : studentId
      ? await pool.query(`SELECT ii.* FROM investment_interests ii JOIN projects p ON p.id=ii.project_id WHERE p.owner_id=$1 OR ii.student_lead ILIKE (SELECT name FROM users WHERE id=$1) || '%' ORDER BY ii.created_at DESC`, [studentId])
      : await pool.query('SELECT * FROM investment_interests ORDER BY created_at DESC');
  res.json(r.rows.map(i => ({
    id: i.id, projectId: i.project_id, projectTitle: i.project_title, studentLead: i.student_lead,
    investorId: i.investor_id, investorName: i.investor_name, targetAmount: i.target_amount,
    status: i.status, aiSummary: i.ai_summary, meetingSlot: i.meeting_slot, createdAt: i.created_at
  })));
}));
app.post('/api/investments', asyncRoute(async (req, res) => {
  const { projectId, projectTitle, studentLead, investorId, investorName, targetAmount, aiSummary, meetingSlot } = req.body;
  const id = `inv_${Date.now()}`;
  await pool.query(
    `INSERT INTO investment_interests (id, project_id, project_title, student_lead, investor_id, investor_name, target_amount, status, ai_summary, meeting_slot)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8,$9)`,
    [id, projectId, projectTitle, studentLead, investorId, investorName, targetAmount, aiSummary, meetingSlot]);
  res.status(201).json({ id, projectId, projectTitle, studentLead, investorId, investorName, targetAmount, status: 'Pending', aiSummary, meetingSlot });
}));
app.put('/api/investments/:id', asyncRoute(async (req, res) => {
  const { status, meetingSlot, aiSummary } = req.body;
  await pool.query(
    `UPDATE investment_interests SET status=COALESCE($1,status), meeting_slot=COALESCE($2,meeting_slot), ai_summary=COALESCE($3,ai_summary) WHERE id=$4`,
    [status, meetingSlot, aiSummary, req.params.id]);
  const r = await pool.query('SELECT * FROM investment_interests WHERE id=$1', [req.params.id]);
  res.json(r.rows[0]);
}));
app.delete('/api/investments/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM investment_interests WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
}));
app.get('/api/investments/:id/meetings', asyncRoute(async (req, res) => {
  const r = await pool.query('SELECT * FROM investment_meetings WHERE investment_id=$1 ORDER BY created_at DESC', [req.params.id]);
  res.json(r.rows.map(m => ({ id: m.id, investmentId: m.investment_id, date: m.date, time: m.time, link: m.link, message: m.message, status: m.status, changeRequest: m.change_request })));
}));
app.post('/api/investments/:id/meetings', asyncRoute(async (req, res) => {
  const { investorId, studentId, date, time, link, message } = req.body;

  const inv = await pool.query(
    "SELECT * FROM investment_interests WHERE id=$1 AND investor_id=$2 AND status='Approved'",
    [req.params.id, investorId]
  );
  if (!inv.rows.length) {
    return res.status(403).json({ error: 'Investment must be admin-approved and owned by investor' });
  }

  // Resolve student id: prefer explicit, else look up the project owner
  let resolvedStudentId = studentId || null;
  if (!resolvedStudentId && inv.rows[0].project_id) {
    const owner = await pool.query('SELECT owner_id FROM projects WHERE id=$1', [inv.rows[0].project_id]);
    resolvedStudentId = owner.rows[0]?.owner_id || null;
  }

  if (!resolvedStudentId) {
    return res.status(400).json({ error: 'Unable to determine which student this investment belongs to' });
  }

  const id = `invmeet_${Date.now()}`;
  await pool.query(
    'INSERT INTO investment_meetings (id, investment_id, investor_id, student_id, date, time, link, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, req.params.id, investorId, resolvedStudentId, date, time, link, message || '']
  );
  res.status(201).json({ id, status: 'Proposed', date, time, link, message, studentId: resolvedStudentId });
}));

// ---------- ADMIN ----------
app.get('/api/admin/verification-queue', asyncRoute(async (_req, res) => {
  const r = await pool.query(`SELECT q.*, u.role, u.company, u.industry, u.enterprise_profile
    FROM verification_queue q LEFT JOIN users u ON u.id=q.user_id ORDER BY q.id DESC`);
  const direct = await pool.query(`SELECT id, name, email, role, company, industry, verified, verification_status, verification_reason, enterprise_profile
    FROM users WHERE role IN ('professor','business') AND verification_status='pending' ORDER BY id DESC`);
  res.json([...r.rows, ...direct.rows.map(u => ({ ...u, user_id: u.id, status: 'Pending', submitted_at: null }))]);
}));
app.post('/api/admin/verify/:id', asyncRoute(async (req, res) => {
  const { action } = req.body;
  const q = await pool.query('SELECT * FROM verification_queue WHERE id=$1', [req.params.id]);
  if (!q.rows.length) return res.status(404).json({ error: 'Not found' });
  const status = action === 'approve' ? 'Approved' : 'Rejected';
  await pool.query('UPDATE verification_queue SET status=$1 WHERE id=$2', [status, req.params.id]);
  if (action === 'approve') {
    await pool.query("UPDATE users SET verified=TRUE, verification_status='verified', verification_reason='Approved by admin' WHERE email=$1", [q.rows[0].email]);
  } else {
    await pool.query('DELETE FROM users WHERE email=$1', [q.rows[0].email]);
  }
  res.json({ message: status });
}));
app.post('/api/admin/verify-user/:id', asyncRoute(async (req, res) => {
  const { action } = req.body;
  const user = await pool.query("SELECT id FROM users WHERE id=$1 AND role IN ('professor','business')", [req.params.id]);
  if (!user.rows.length) return res.status(404).json({ error: 'Account not found' });
  if (action === 'approve') {
    await pool.query("UPDATE users SET verified=TRUE, verification_status='verified', verification_reason='Approved by admin' WHERE id=$1", [req.params.id]);
    await pool.query("UPDATE verification_queue SET status='Approved' WHERE user_id=$1", [req.params.id]);
  } else {
    await pool.query("UPDATE verification_queue SET status='Rejected' WHERE user_id=$1", [req.params.id]);
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  }
  res.json({ message: action === 'approve' ? 'Approved' : 'Deleted' });
}));
app.get('/api/admin/investments', asyncRoute(async (_req, res) => {
  const r = await pool.query('SELECT * FROM investment_interests ORDER BY created_at DESC');
  res.json(r.rows);
}));
app.put('/api/admin/investments/:id', asyncRoute(async (req, res) => {
  const status = req.body.action === 'approve' ? 'Approved' : 'Passed';
  const r = await pool.query('UPDATE investment_interests SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Investment not found' });
  res.json(r.rows[0]);
}));
app.get('/api/admin/content', asyncRoute(async (_req, res) => {
  const [posts, projects, videos, complaints] = await Promise.all([
    pool.query('SELECT id, author_id, author_name, author_role, content, created_at FROM posts ORDER BY created_at DESC'),
    pool.query('SELECT id, owner_id, owner_name, title, description, created_at FROM projects ORDER BY created_at DESC'),
    pool.query('SELECT id, prof_id, title, description, created_at FROM professor_videos ORDER BY created_at DESC'),
    pool.query('SELECT * FROM admin_complaints ORDER BY created_at DESC')
  ]);
  res.json({ posts: posts.rows, projects: projects.rows, videos: videos.rows, complaints: complaints.rows });
}));
app.delete('/api/admin/content/:type/:id', asyncRoute(async (req, res) => {
  const table = { posts: 'posts', projects: 'projects', videos: 'professor_videos' }[req.params.type];
  if (!table) return res.status(400).json({ error: 'Invalid content type' });
  await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
  res.json({ message: 'Deleted' });
}));
app.put('/api/admin/complaints/:id', asyncRoute(async (req, res) => {
  const action = req.body.action === 'remove' ? 'Removed' : 'Reviewed';
  const c = await pool.query('UPDATE admin_complaints SET status=$1 WHERE id=$2 RETURNING *', [action, req.params.id]);
  if (!c.rows.length) return res.status(404).json({ error: 'Complaint not found' });
  if (action === 'Removed') {
    const target = c.rows[0];
    if (target.target_type === 'professor_review') await pool.query('DELETE FROM session_reviews WHERE id=$1', [target.target_id]);
    if (target.target_type === 'video_review') await pool.query('DELETE FROM professor_video_impressions WHERE id=$1', [target.target_id]);
  }
  res.json(c.rows[0]);
}));

app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ error: err.message });
});

// ---------- BOOT ----------
Promise.all([ensureSchema(), initRagSchema()])
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 UniYO backend on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Boot failed:', err.message);
    process.exit(1);
  });