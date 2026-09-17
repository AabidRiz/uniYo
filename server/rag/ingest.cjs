require('dotenv').config();
const { Client } = require('pg');
const { pool, initRagSchema } = require('./db.cjs');
const { embedText } = require('./embeddings.cjs');

const SOURCE_DB = { host: 'localhost', port: 5432, user: 'postgres', password: '1234', database: 'uniyo_db' };

function chunkStudent(u) { if (u.role !== 'student') return null; return { source_type: 'student_profile', source_id: u.id, content: `Student: ${u.name}. University: ${u.university_name || 'unknown'}. Faculty: ${u.faculty || 'unknown'}. Degree: ${u.degree || 'unknown'}. Skills: ${u.skills || 'none'}. Bio: ${u.bio || 'no bio'}.`, metadata: { name: u.name } }; }
function chunkFounder(u) { if (u.role !== 'student') return null; return { source_type: 'founder_profile', source_id: u.id, content: `Founder: ${u.name}. University: ${u.university_name || 'unknown'}. Skills: ${u.skills || 'none'}. Bio: ${u.bio || 'no bio'}.`, metadata: { name: u.name } }; }
function chunkProject(p) { return { source_type: 'project', source_id: p.id, content: `Project: ${p.title}. Owner: ${p.owner_name}. Description: ${p.description}. Skills needed: ${(p.skills_needed || []).join(', ') || 'none'}. Seeking investment: ${p.seeking_investment ? 'yes, goal ' + (p.investment_goal || 'TBD') : 'no'}. Traction: ${p.traction_score}/100.`, metadata: { title: p.title } }; }
function chunkPost(p) { return { source_type: 'post', source_id: p.id, content: `Post by ${p.author_name}: ${p.content}`.slice(0, 1500), metadata: { author: p.author_name } }; }
function chunkVideo(v) { return { source_type: 'video', source_id: v.id, content: `Video: ${v.title}. ${v.description || ''}. Duration: ${v.duration_minutes || '?'} min.`, metadata: { title: v.title } }; }
function chunkInternship(j) { return { source_type: 'internship', source_id: j.id, content: `Internship: ${j.title} at ${j.company}. Location: ${j.location || 'N/A'}. Stipend: ${j.stipend || 'N/A'}. ${j.description || ''}`, metadata: { title: j.title } }; }
function chunkSession(s) { return { source_type: 'professor_session', source_id: s.id, content: `Session with ${s.student_name} on ${s.date} at ${s.time}. Topic: ${s.topic || 'N/A'}. Status: ${s.status}.`, metadata: { student: s.student_name } }; }
function chunkQuestion(q) { return { source_type: 'professor_question', source_id: q.id, content: `Question from ${q.student_name}: ${q.question}` + (q.answer ? ` - Answer: ${q.answer}` : ' - Not yet answered.'), metadata: { student: q.student_name } }; }
function chunkAdvisor(a) { return { source_type: 'project_advisor', source_id: `${a.project_id}:${a.prof_id}`, content: `Advisor: professor ${a.prof_id} advising project ${a.project_id}. Status: ${a.status}.`, metadata: { project_id: a.project_id } }; }
function chunkInvestment(i) { return { source_type: 'investment', source_id: i.id, content: `Investment for project "${i.project_title}". Lead: ${i.student_lead}. Investor: ${i.investor_name}. Target: ${i.target_amount || 'TBD'}. Status: ${i.status}.`, metadata: { project_title: i.project_title } }; }
function chunkVerification(v) { return { source_type: 'verification', source_id: v.id, content: `Verification: ${v.name} (${v.email}). Student ID: ${v.student_id || 'N/A'}. University: ${v.university || 'N/A'}. Status: ${v.status}. Reason: ${v.flag_reason || 'none'}.`, metadata: { name: v.name } }; }
function chunkComplaint(c) { return { source_type: 'complaint', source_id: c.id, content: `Complaint about ${c.target_type} (${c.target_id}). Reason: ${c.reason}. Status: ${c.status}.`, metadata: { target_type: c.target_type } }; }

async function ingestAll() {
  console.log('Starting RAG ingest...');
  await initRagSchema();

  const src = new Client(SOURCE_DB);
  await src.connect();
  console.log('Connected to uniyo_db');

  const jobs = [];
  for (const u of (await src.query('SELECT * FROM users')).rows) { const s = chunkStudent(u); if (s) jobs.push(s); const f = chunkFounder(u); if (f) jobs.push(f); }
  for (const p of (await src.query('SELECT * FROM projects')).rows) jobs.push(chunkProject(p));
  for (const p of (await src.query('SELECT * FROM posts')).rows) jobs.push(chunkPost(p));
  for (const v of (await src.query('SELECT * FROM professor_videos')).rows) jobs.push(chunkVideo(v));
  for (const j of (await src.query('SELECT * FROM internships')).rows) jobs.push(chunkInternship(j));
  for (const s of (await src.query('SELECT * FROM professor_sessions')).rows) jobs.push(chunkSession(s));
  for (const q of (await src.query('SELECT * FROM professor_questions')).rows) jobs.push(chunkQuestion(q));
  for (const a of (await src.query('SELECT * FROM project_advisors')).rows) jobs.push(chunkAdvisor(a));
  for (const i of (await src.query('SELECT * FROM investment_interests')).rows) jobs.push(chunkInvestment(i));
  for (const v of (await src.query('SELECT * FROM verification_queue')).rows) jobs.push(chunkVerification(v));
  for (const c of (await src.query('SELECT * FROM admin_complaints')).rows) jobs.push(chunkComplaint(c));
  await src.end();

  console.log(`Prepared ${jobs.length} chunks. Embedding locally...`);

  let done = 0;
  for (let i = 0; i < jobs.length; i += 10) {
    const batch = jobs.slice(i, i + 10);
    await Promise.all(batch.map(async (job) => {
      try {
        const embedding = await embedText(job.content);
        await pool.query(
          `INSERT INTO rag_documents (source_type, source_id, content, metadata, embedding, updated_at)
           VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
           ON CONFLICT (source_type, source_id) DO UPDATE SET
             content=EXCLUDED.content, metadata=EXCLUDED.metadata,
             embedding=EXCLUDED.embedding, updated_at=CURRENT_TIMESTAMP`,
          [job.source_type, job.source_id, job.content, job.metadata, JSON.stringify(embedding)]
        );
        done++;
      } catch (e) { console.warn(`embed failed for ${job.source_type}: ${e.message}`); }
    }));
    console.log(`  ... ${Math.min(done, jobs.length)}/${jobs.length}`);
  }

  console.log(`Done. ${done} documents in rag_documents.`);
  await pool.end();
}

ingestAll().catch(e => { console.error('Ingest failed:', e.message); process.exit(1); });
