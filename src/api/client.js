const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  checkHealth: () => request('/health'),

  getUniversities: () => request('/universities'),
  addUniversity: (d) => request('/universities', { method: 'POST', body: d }),
  updateUniversity: (id, d) => request(`/universities/${id}`, { method: 'PUT', body: d }),
  deleteUniversity: (id) => request(`/universities/${id}`, { method: 'DELETE' }),

  getUsers: (role) => request(role ? `/users?role=${role}` : '/users'),
  getUser: (id) => request(`/users/${id}`),
  getUserPosts: (id) => request(`/users/${id}/posts`),
  updateUser: (id, d) => request(`/users/${id}`, { method: 'PUT', body: d }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getConnections: (id) => request(`/users/${id}/connections`),
  connectUser: (id, t) => request(`/users/${id}/connections`, { method: 'POST', body: { targetId: t } }),
  disconnectUser: (id, t) => request(`/users/${id}/connections/${t}`, { method: 'DELETE' }),
  getMyInvites: (id) => request(`/users/${id}/invites`),
  getNotifications: (id) => request(`/notifications/${id}`),

  login: (c) => request('/auth/login', { method: 'POST', body: c }),
  registerUser: (d) => request('/auth/register', { method: 'POST', body: d }),

  getPosts: () => request('/posts'),
  createPost: (d) => request('/posts', { method: 'POST', body: d }),
  updatePost: (id, d) => request(`/posts/${id}`, { method: 'PUT', body: d }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  likePost: (id, userId) => request(`/posts/${id}/like`, { method: 'POST', body: { userId } }),
  getComments: (id) => request(`/posts/${id}/comments`),
  addComment: (id, d) => request(`/posts/${id}/comments`, { method: 'POST', body: d }),
  deleteComment: (pid, cid) => request(`/posts/${pid}/comments/${cid}`, { method: 'DELETE' }),

  // Projects
  getProjects: (viewerId) => request(viewerId ? `/projects?viewerId=${viewerId}` : '/projects'),
  getProject: (id, viewerId) => request(`/projects/${id}${viewerId ? `?viewerId=${viewerId}` : ''}`),
  createProject: (d) => request('/projects', { method: 'POST', body: d }),
  updateProject: (id, d) => request(`/projects/${id}`, { method: 'PUT', body: d }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  requestJoin: (id, d) => request(`/projects/${id}/requests`, { method: 'POST', body: d }),
  inviteUser: (id, d) => request(`/projects/${id}/invites`, { method: 'POST', body: d }),
  respondRequest: (pid, rid, status, ownerId) => request(`/projects/${pid}/requests/${rid}`, { method: 'PUT', body: { status, ownerId } }),
  respondInvite: (pid, iid, status, userId) => request(`/projects/${pid}/invites/${iid}`, { method: 'PUT', body: { status, userId } }),
  deleteRequest: (pid, rid) => request(`/projects/${pid}/requests/${rid}`, { method: 'DELETE' }),
  removeMember: (pid, uid, actorId) => request(`/projects/${pid}/members/${uid}?actorId=${actorId}`, { method: 'DELETE' }),
  getAvailableInvitees: (id) => request(`/projects/${id}/available-invitees`),

  // Advisors
  requestAdvisor: (projectId, d) => request(`/projects/${projectId}/advisor-request`, { method: 'POST', body: d }),
  respondAdvisor: (projectId, profId, status) => request(`/projects/${projectId}/advisor/${profId}`, { method: 'PUT', body: { status, profId } }),
  removeAdvisor: (projectId, profId, actorId) => request(`/projects/${projectId}/advisor/${profId}?actorId=${actorId}`, { method: 'DELETE' }),
  getAdvisorRequests: (profId) => request(`/professors/${profId}/advisor-requests`),
  getAdvisedProjects: (profId) => request(`/professors/${profId}/advised-projects`),

  sendProjectMessage: (id, d) => request(`/projects/${id}/messages`, { method: 'POST', body: d }),

  addRepo: (id, d) => request(`/projects/${id}/repos`, { method: 'POST', body: d }),
  deleteRepo: (pid, rid) => request(`/projects/${pid}/repos/${rid}`, { method: 'DELETE' }),
  addDoc: (id, d) => request(`/projects/${id}/docs`, { method: 'POST', body: d }),
  deleteDoc: (pid, did) => request(`/projects/${pid}/docs/${did}`, { method: 'DELETE' }),

  getTasks: (id, viewerId) => request(`/projects/${id}/tasks?viewerId=${viewerId}`),
  createTask: (id, d) => request(`/projects/${id}/tasks`, { method: 'POST', body: d }),
  updateTask: (pid, tid, d) => request(`/projects/${pid}/tasks/${tid}`, { method: 'PUT', body: d }),
  deleteTask: (pid, tid) => request(`/projects/${pid}/tasks/${tid}`, { method: 'DELETE' }),

  getMeetings: (id, viewerId) => request(`/projects/${id}/meetings?viewerId=${viewerId}`),
  createMeeting: (id, d) => request(`/projects/${id}/meetings`, { method: 'POST', body: d }),
  updateMeeting: (pid, mid, d) => request(`/projects/${pid}/meetings/${mid}`, { method: 'PUT', body: d }),
  deleteMeeting: (pid, mid) => request(`/projects/${pid}/meetings/${mid}`, { method: 'DELETE' }),

  getActivity: (id, viewerId) => request(`/projects/${id}/activity?viewerId=${viewerId}`),

  // Professors
  getProfessors: () => request('/professors'),
  getProfessor: (id) => request(`/professors/${id}`),
  getProfessorOverview: (id) => request(`/professors/${id}/overview`),
  getAvailability: (id) => request(`/professors/${id}/availability`),
  addAvailability: (id, d) => request(`/professors/${id}/availability`, { method: 'POST', body: d }),
  deleteAvailability: (pid, aid) => request(`/professors/${pid}/availability/${aid}`, { method: 'DELETE' }),
  getSessions: (p = {}) => {
    const qs = new URLSearchParams(p).toString();
    return request(`/professors/sessions${qs ? '?' + qs : ''}`);
  },
  bookSession: (d) => request('/professors/sessions', { method: 'POST', body: d }),
  updateSession: (id, d) => request(`/professors/sessions/${id}`, { method: 'PUT', body: d }),
  deleteSession: (id, actorId) => request(`/professors/sessions/${id}`, { method: 'DELETE', body: { actorId } }),

  // Professor videos
  getProfessorVideos: (profId, viewerId) => request(`/professors/${profId}/videos${viewerId ? `?viewerId=${viewerId}` : ''}`),
  createProfessorVideo: (profId, d) => request(`/professors/${profId}/videos`, { method: 'POST', body: d }),
  updateProfessorVideo: (profId, vid, d) => request(`/professors/${profId}/videos/${vid}`, { method: 'PUT', body: d }),
  deleteProfessorVideo: (profId, vid) => request(`/professors/${profId}/videos/${vid}`, { method: 'DELETE' }),
  recordVideoView: (vid) => request(`/professors/videos/${vid}/view`, { method: 'POST' }),
  addVideoImpression: (vid, d) => request(`/professors/videos/${vid}/impressions`, { method: 'POST', body: d }),
  enrollVideo: (vid, studentId) => request(`/professors/videos/${vid}/enroll`, { method: 'POST', body: { studentId } }),
  payForVideo: (vid, d) => request(`/professors/videos/${vid}/pay`, { method: 'POST', body: d }),
  getMyEnrollments: (studentId) => request(`/users/${studentId}/enrollments`),
  getProfessorReviews: (profId) => request(`/professors/${profId}/reviews`),
  createProfessorReview: (profId, d) => request(`/professors/${profId}/reviews`, { method: 'POST', body: d }),
  updateProfessorReview: (reviewId, d) => request(`/professors/reviews/${reviewId}`, { method: 'PUT', body: d }),
  deleteProfessorReview: (reviewId, studentId) => request(`/professors/reviews/${reviewId}`, { method: 'DELETE', body: { studentId } }),
  reviewSession: (sessionId, d) => request(`/professors/sessions/${sessionId}/review`, { method: 'POST', body: d }),
  deleteReview: (sessionId, studentId) => request(`/professors/sessions/${sessionId}/review`, { method: 'DELETE', body: { studentId } }),
  submitComplaint: (d) => request('/admin/complaints', { method: 'POST', body: d }),

  // Professor Q&A
  getProfessorQuestions: (profId) => request(`/professors/${profId}/questions`),
  askProfessorQuestion: (profId, d) => request(`/professors/${profId}/questions`, { method: 'POST', body: d }),
  answerProfessorQuestion: (profId, qid, answer) => request(`/professors/${profId}/questions/${qid}`, { method: 'PUT', body: { answer } }),
  deleteProfessorQuestion: (profId, qid) => request(`/professors/${profId}/questions/${qid}`, { method: 'DELETE' }),
  updateStudentQuestion: (qid, d) => request(`/professors/questions/${qid}`, { method: 'PUT', body: d }),
  deleteStudentQuestion: (qid, studentId) => request(`/professors/questions/${qid}`, { method: 'DELETE', body: { studentId } }),
  updateProfessorAnswer: (profId, qid, answer) => request(`/professors/${profId}/questions/${qid}/answer`, { method: 'PUT', body: { answer } }),
  deleteProfessorAnswer: (profId, qid) => request(`/professors/${profId}/questions/${qid}/answer`, { method: 'DELETE' }),

  // Internships
  getInternships: (p = {}) => {
    const qs = new URLSearchParams(p).toString();
    return request(`/internships${qs ? '?' + qs : ''}`);
  },
  createInternship: (d) => request('/internships', { method: 'POST', body: d }),
  updateInternship: (id, d) => request(`/internships/${id}`, { method: 'PUT', body: d }),
  deleteInternship: (id) => request(`/internships/${id}`, { method: 'DELETE' }),
  updateApplicantStatus: (jid, aid, s) => request(`/internships/${jid}/applicants/${aid}`, { method: 'PUT', body: { status: s } }),
  applyToInternship: (jobId, d) => request(`/internships/${jobId}/apply`, { method: 'POST', body: d }),

  // Investments
  getInvestments: (investorId) => request(investorId ? `/investments?investorId=${investorId}` : '/investments'),
  getStudentInvestments: (studentId) => request(`/investments?studentId=${studentId}`),
  createInvestment: (d) => request('/investments', { method: 'POST', body: d }),
  updateInvestment: (id, d) => request(`/investments/${id}`, { method: 'PUT', body: d }),
  deleteInvestment: (id) => request(`/investments/${id}`, { method: 'DELETE' }),
  getInvestmentMeetings: (id) => request(`/investments/${id}/meetings`),
  createInvestmentMeeting: (id, d) => request(`/investments/${id}/meetings`, { method: 'POST', body: d }),
  updateInvestmentMeeting: (id, d) => request(`/investment-meetings/${id}`, { method: 'PUT', body: d }),

  // Admin
  // AI Chat (RAG)
  aiChat: (role, message) => request('/ai/chat', { method: 'POST', body: { role, message } }),

  // Admin
  getVerificationQueue: () => request('/admin/verification-queue'),
    verifyStudent: (id, action) => request(`/admin/verify/${id}`, { method: 'POST', body: { action } })
  ,getAdminQueue: () => request('/admin/verification-queue')
  ,verifyUser: (id, action) => request(`/admin/verify-user/${id}`, { method: 'POST', body: { action } })
  ,getAdminInvestments: () => request('/admin/investments')
  ,moderateInvestment: (id, action) => request(`/admin/investments/${id}`, { method: 'PUT', body: { action } })
  ,getAdminContent: () => request('/admin/content')
  ,deleteAdminContent: (type, id) => request(`/admin/content/${type}/${id}`, { method: 'DELETE' })
  ,moderateComplaint: (id, action) => request(`/admin/complaints/${id}`, { method: 'PUT', body: { action } })
};