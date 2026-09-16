export const UNIVERSITIES = [
  { id: 'stanford', name: 'Stanford University', domain: 'stanford.edu', pattern: /^SU-\d{6}$/, code: 'SU' },
  { id: 'mit', name: 'Massachusetts Institute of Technology', domain: 'mit.edu', pattern: /^MIT-\d{5}$/, code: 'MIT' },
  { id: 'harvard', name: 'Harvard University', domain: 'harvard.edu', pattern: /^HU-\d{6}$/, code: 'HU' },
  { id: 'oxford', name: 'University of Oxford', domain: 'oxford.ac.uk', pattern: /^OX-\d{5}$/, code: 'OX' },
  { id: 'cambridge', name: 'University of Cambridge', domain: 'cam.ac.uk', pattern: /^CAM-\d{5}$/, code: 'CAM' },
  { id: 'nus', name: 'National University of Singapore', domain: 'nus.edu.sg', pattern: /^NUS-\d{6}$/, code: 'NUS' }
];

export const INITIAL_USERS = [
  {
    id: 'usr_std_1',
    role: 'student',
    name: 'Alex Rivera',
    email: 'arivera@stanford.edu',
    studentId: 'SU-849201',
    university: 'Stanford University',
    faculty: 'Computer Science',
    degree: 'B.S. Software Engineering (3rd Year)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    bio: 'AI Researcher & Full-Stack Architect passionate about cross-university collaborative tech. Currently building Autonomous Swarm UI.',
    skills: ['React', 'Node.js', 'Python', 'Agentic AI', 'PostgreSQL', 'Flutter'],
    verified: true,
    verificationStatus: 'verified', // 'verified', 'pending', 'rejected'
    stats: { connections: 342, projects: 4, posts: 18 }
  },
  {
    id: 'usr_std_2',
    role: 'student',
    name: 'Sophia Chen',
    email: 'schen@mit.edu',
    studentId: 'MIT-55201',
    university: 'Massachusetts Institute of Technology',
    faculty: 'Electrical Engineering & CS',
    degree: 'M.S. Robotics',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    bio: 'Hardware-Software co-design, drone navigation algorithms, and computer vision. Looking for co-founders.',
    skills: ['C++', 'ROS 2', 'PyTorch', 'Embedded Systems', 'OpenCV'],
    verified: true,
    verificationStatus: 'verified',
    stats: { connections: 512, projects: 6, posts: 29 }
  },
  {
    id: 'usr_std_3',
    role: 'student',
    name: 'Marcus Vance',
    email: 'mvance@harvard.edu',
    studentId: 'HU-992104',
    university: 'Harvard University',
    faculty: 'Business & BioTech',
    degree: 'MBA & Bio-Tech Dual Degree',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    bio: 'Bridging biomedical breakthroughs with scalable software products. Seeking machine learning collaborators.',
    skills: ['Biotech', 'Product Strategy', 'Python', 'Financial Modeling'],
    verified: false,
    verificationStatus: 'pending',
    verificationReason: 'ID card image resolution low. Pending manual admin review.',
    stats: { connections: 88, projects: 1, posts: 3 }
  },
  {
    id: 'usr_prof_1',
    role: 'professor',
    name: 'Dr. Aris Thorne',
    email: 'athorne@stanford.edu',
    university: 'Stanford University',
    faculty: 'Computer Science',
    title: 'Associate Professor of Artificial Intelligence',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    bio: 'Directing the Distributed Intelligence Lab. Open for student office hours & research advisement.',
    consultationType: 'both', // 'volunteer', 'paid', 'both'
    hourlyRate: '$45/hr (Paid consult) / Free (Volunteer Q&A)',
    verified: true,
    rating: 4.9,
    reviewsCount: 48,
    availability: ['Mon 10:00 - 12:00', 'Wed 14:00 - 16:00', 'Fri 11:00 - 13:00']
  },
  {
    id: 'usr_prof_2',
    role: 'professor',
    name: 'Prof. Elena Rostova',
    email: 'erostova@mit.edu',
    university: 'Massachusetts Institute of Technology',
    faculty: 'Data Science & FinTech',
    title: 'Chair of Financial Technologies',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    bio: 'Specialist in decentralized consensus and algorithmic risk management. Consulting for top academic startups.',
    consultationType: 'paid',
    hourlyRate: '$60/hr',
    verified: true,
    rating: 4.8,
    reviewsCount: 32,
    availability: ['Tue 13:00 - 17:00', 'Thu 09:00 - 12:00']
  },
  {
    id: 'usr_biz_1',
    role: 'business',
    name: 'Sarah Jenkins',
    company: 'Apex Venture Capital & Labs',
    email: 's.jenkins@apexventures.io',
    industry: 'Early Stage DeepTech & AI',
    title: 'Partner & Chief Talent Officer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
    bio: 'Investing $50K-$500K in high-potential student-led startups and sponsoring university hackathons.',
    interestTags: ['AI/ML', 'Robotics', 'SaaS', 'BioTech'],
    verified: true,
    sponsoredEventsCount: 8,
    investmentsCount: 14
  },
  {
    id: 'usr_admin_1',
    role: 'admin',
    name: 'System Admin (UniYO HQ)',
    email: 'admin@uniyo.edu',
    university: 'Platform Wide',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    verified: true
  }
];

export const INITIAL_POSTS = [
  {
    id: 'post_1',
    author: {
      id: 'usr_std_1',
      name: 'Alex Rivera',
      university: 'Stanford University',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      role: 'Student',
      verified: true
    },
    timestamp: '2 hours ago',
    content: '🚀 Super excited to announce our cross-university project "EcoChain" is opening 2 slots for backend & ML developers! We are bridging Stanford and MIT engineering labs to measure carbon footprints automatically. Check out the Collaborate tab or comment below!',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
    likes: 42,
    commentsCount: 12,
    tags: ['#Collaborate', '#AI', '#Sustainability', '#Stanford'],
    isLiked: false,
    comments: [
      { id: 'c1', name: 'Sophia Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', text: 'This looks fantastic Alex! Would love to bring MIT Robotics sensors into this.', time: '1 hr ago' }
    ]
  },
  {
    id: 'post_2',
    author: {
      id: 'usr_prof_1',
      name: 'Dr. Aris Thorne',
      university: 'Stanford University',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      role: 'Professor',
      verified: true
    },
    timestamp: '5 hours ago',
    content: '📚 Published a new mini-course module on "Multi-Agent System Orchestration with LLMs". Free access for all UniYO verified students! Book a volunteer office hour session if you want guidance on your final year thesis.',
    image: null,
    likes: 89,
    commentsCount: 19,
    tags: ['#AgenticAI', '#Research', '#OfficeHours'],
    isLiked: true,
    comments: []
  },
  {
    id: 'post_3',
    author: {
      id: 'usr_biz_1',
      name: 'Sarah Jenkins',
      company: 'Apex Venture Capital',
      university: 'Industry Partner',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      role: 'Investor',
      verified: true
    },
    timestamp: '1 day ago',
    content: '💡 Apex Ventures is pledging $25,000 in seed grants for top student projects listed on the UniYO Collaborate hub this month. We are actively reviewing student ideas seeking seed capital!',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80',
    likes: 134,
    commentsCount: 31,
    tags: ['#StudentFunding', '#VentureCapital', '#UniYOInvest'],
    isLiked: false,
    comments: []
  }
];

export const INITIAL_PROJECTS = [
  {
    id: 'proj_1',
    title: 'EcoChain: AI-Driven Carbon Tracking Ledger',
    owner: {
      id: 'usr_std_1',
      name: 'Alex Rivera',
      university: 'Stanford University',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    },
    description: 'Developing a zero-knowledge proof blockchain + IoT computer vision system that tracks real-time carbon offsets for campus supply chains.',
    banner: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1000&q=80',
    openToUniversities: ['Stanford University', 'Massachusetts Institute of Technology', 'Harvard University'],
    skillsNeeded: ['React Native / Flutter', 'PyTorch ML', 'Solidity', 'Go / Node.js'],
    seekingInvestment: true,
    investmentGoal: '$15,000 Seed Grant',
    tractionScore: 94,
    members: [
      { id: 'usr_std_1', name: 'Alex Rivera', uni: 'Stanford', role: 'Project Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
      { id: 'usr_std_2', name: 'Sophia Chen', uni: 'MIT', role: 'Robotics & Hardware', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80' }
    ],
    incomingRequests: [
      { id: 'req_1', applicantName: 'David Zhang', uni: 'Harvard University', skill: 'PyTorch ML', pitch: 'Hey Alex! I lead the Harvard ML lab group. Excited to contribute our transformer models for carbon output prediction.' }
    ],
    repositories: [
      { name: 'ecochain-core-api', url: 'https://github.com/uniyo-projects/ecochain-core', stars: 28 },
      { name: 'ecochain-mobile-app', url: 'https://github.com/uniyo-projects/ecochain-flutter', stars: 19 }
    ],
    documents: [
      { title: 'EcoChain_Architecture_v2.pdf', size: '4.2 MB', date: 'Yesterday' },
      { title: 'Pitch_Deck_ApexVentures.pptx', size: '12.8 MB', date: '3 days ago' }
    ],
    chatMessages: [
      { id: 'm1', sender: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', text: 'Welcome to the team workspace! I pushed the initial DB schemas.', time: '10:14 AM' },
      { id: 'm2', sender: 'Sophia Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', text: 'Great! I am connecting the drone telemetry endpoints now.', time: '10:18 AM' }
    ]
  },
  {
    id: 'proj_2',
    title: 'MedAssist AI: Clinical Decision Support for Rural Clinics',
    owner: {
      id: 'usr_std_3',
      name: 'Marcus Vance',
      university: 'Harvard University',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    },
    description: 'An offline-first multimodal AI assistant designed for medical students and rural clinicians to diagnose uncommon symptoms.',
    banner: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
    openToUniversities: ['Harvard University', 'Stanford University', 'University of Oxford'],
    skillsNeeded: ['Flutter / Mobile', 'HIPAA Security', 'LLM Fine-tuning'],
    seekingInvestment: true,
    investmentGoal: '$30,000 Seed Pitch',
    tractionScore: 88,
    members: [
      { id: 'usr_std_3', name: 'Marcus Vance', uni: 'Harvard', role: 'BioTech Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' }
    ],
    incomingRequests: [],
    repositories: [
      { name: 'medassist-llm-quant', url: 'https://github.com/uniyo-projects/medassist-llm', stars: 45 }
    ],
    documents: [
      { title: 'Clinical_Trial_Ethics_Approval.pdf', size: '2.1 MB', date: 'Last week' }
    ],
    chatMessages: []
  }
];

export const INITIAL_PROFESSOR_SESSIONS = [
  {
    id: 'sess_1',
    profId: 'usr_prof_1',
    profName: 'Dr. Aris Thorne',
    university: 'Stanford University',
    studentName: 'Alex Rivera',
    date: '2026-09-20',
    time: '11:00 AM - 11:45 AM',
    type: 'Volunteer Q&A',
    topic: 'Reviewing Multi-Agent System Architecture for EcoChain',
    status: 'Confirmed'
  }
];

export const INITIAL_TEACHING_VIDEOS = [
  {
    id: 'vid_1',
    title: 'Building Agentic AI Systems with Tool-Calling Orchestrations',
    professor: 'Dr. Aris Thorne (Stanford)',
    duration: '42 mins',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    views: 1240,
    rating: 4.9,
    impressions: [
      { student: 'Sophia C. (MIT)', rating: 5, comment: 'Incredible breakdown of subagent state management!' },
      { student: 'David Z. (Harvard)', rating: 5, comment: 'Extremely clear explanation of human-in-the-loop triggers.' }
    ]
  },
  {
    id: 'vid_2',
    title: 'Financial Risk & Tokenomics for Student Founders',
    professor: 'Prof. Elena Rostova (MIT)',
    duration: '35 mins',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    views: 890,
    rating: 4.8,
    impressions: [
      { student: 'Marcus V. (Harvard)', rating: 5, comment: 'Must-watch before pitching to VCs.' }
    ]
  }
];

export const INITIAL_INTERNSHIPS = [
  {
    id: 'job_1',
    title: 'AI Systems Engineering Intern',
    company: 'Apex Venture Labs',
    location: 'Palo Alto, CA (Hybrid)',
    stipend: '$45 - $55 / hour',
    type: 'Summer Internship',
    description: 'Looking for top-tier computer science students proficient in React, Node, and Agentic AI workflow orchestration.',
    applicants: [
      { id: 'app_1', name: 'Alex Rivera', uni: 'Stanford', gpa: '3.92', status: 'Shortlisted' },
      { id: 'app_2', name: 'Sophia Chen', uni: 'MIT', gpa: '4.00', status: 'Applied' }
    ]
  },
  {
    id: 'job_2',
    title: 'BioTech Product Management Co-op',
    company: 'Apex BioVentures',
    location: 'Boston, MA (Remote)',
    stipend: '$40 / hour',
    type: 'Co-op (Fall 2026)',
    description: 'Work directly with clinical founders to scale digital health platforms across top university medical centers.',
    applicants: [
      { id: 'app_3', name: 'Marcus Vance', uni: 'Harvard', gpa: '3.88', status: 'Shortlisted' }
    ]
  }
];

export const INITIAL_INVESTMENT_INTERESTS = [
  {
    id: 'inv_1',
    projectTitle: 'EcoChain: AI-Driven Carbon Tracking Ledger',
    studentLead: 'Alex Rivera (Stanford)',
    investorName: 'Sarah Jenkins (Apex Ventures)',
    targetAmount: '$15,000 Seed Grant',
    status: 'Human Approval Pending', // 'Human Approval Pending', 'Approved', 'Meeting Scheduled'
    aiSummary: 'High technical traction (94/100). Verified Stanford & MIT team. Clear ESG alignment.',
    meetingSlot: 'Fri, Sep 25 @ 2:00 PM PST'
  }
];

export const INITIAL_VERIFICATION_QUEUE = [
  {
    id: 'ver_101',
    name: 'Marcus Vance',
    email: 'mvance@harvard.edu',
    studentId: 'HU-992104',
    university: 'Harvard University',
    submittedAt: '10 minutes ago',
    idFormatMatch: true,
    otpVerified: true,
    aiConfidence: '88% - Ambiguous Photo',
    flagReason: 'ID badge photo lighting is low contrast. Triggered human admin verification queue.',
    status: 'Pending'
  },
  {
    id: 'ver_102',
    name: 'Jessica Taylor',
    email: 'jtaylor@oxford.ac.uk',
    studentId: 'OX-88123',
    university: 'University of Oxford',
    submittedAt: '25 minutes ago',
    idFormatMatch: true,
    otpVerified: true,
    aiConfidence: '99% - High Confidence Pass',
    flagReason: 'Auto-verification rule triggered. Ready for 1-click batch approval.',
    status: 'Pending'
  }
];

export const INITIAL_AGENT_WORKFLOW_LOGS = [
  {
    id: 'wf_1001',
    agentName: 'Verification & Moderation Agent',
    trigger: 'New Student Registration (Marcus Vance)',
    steps: [
      { step: 1, action: 'validate_student_id_format', input: 'HU-992104', result: 'REGEX_PASS (Pattern: /^HU-\\d{6}$/)' },
      { step: 2, action: 'check_otp_delivery', input: 'mvance@harvard.edu', result: 'OTP_MATCH_CONFIRMED' },
      { step: 3, action: 'analyze_id_card_clarity', input: 'student_id_card.jpg', result: 'LOW_CONTRAST_FLAG' }
    ],
    status: 'FLAGGED_FOR_HUMAN_APPROVAL',
    timestamp: '10 mins ago'
  },
  {
    id: 'wf_1002',
    agentName: 'Cross-University Collaborator Agent',
    trigger: 'Project Search: EcoChain (Stanford)',
    steps: [
      { step: 1, action: 'query_student_skills', input: '["PyTorch", "Robotics", "Flutter"]', result: 'FOUND 14 CANDIDATES' },
      { step: 2, action: 'filter_verified_status', input: 'active_verified_only', result: 'FILTERED TO 8 MATCHES' },
      { step: 3, action: 'rank_similarity_score', input: 'project_embeddings', result: 'Top match: Sophia Chen (MIT, Fit: 96%)' }
    ],
    status: 'SUCCESS',
    timestamp: '1 hour ago'
  },
  {
    id: 'wf_1003',
    agentName: 'Investment Recommendation Agent',
    trigger: 'Investment Pitch Review: EcoChain',
    steps: [
      { step: 1, action: 'calculate_traction_score', input: 'proj_1_metrics', result: 'TRACTION: 94/100 (Code commits + 2 uni team)' },
      { step: 2, action: 'match_investor_thesis', input: 'Apex Ventures (Tags: AI/ML, SaaS)', result: 'HIGH_MATCH_CONFIDENCE' },
      { step: 3, action: 'pause_for_human_approval', input: 'Request Pitch Meeting', result: 'PAUSED_WAITING_FOR_INVESTOR_CLICK' }
    ],
    status: 'AWAITING_HUMAN_CHECKPOINT',
    timestamp: '2 hours ago'
  }
];
