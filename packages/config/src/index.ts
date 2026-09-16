export const Sanro = {
  productName: 'Sanro AI',
  domain: 'sanroai.com',
  appDomain: 'app.sanroai.com',
  apiDomain: 'api.sanroai.com',
  tagline: 'Every test should tell you what to do next.',
  hero: 'From test scores to real learning improvement.',
  valueProposition: 'Assess. Understand. Improve.',
  mission: 'SANRO turns assessment data into specific learning actions and measurable improvement.',
} as const;

export const PLANS = {
  STUDENT_MONTHLY_PRICE_INR: 249,
  STUDENT_YEARLY_PRICE_INR: 2499,
  PARENT_PRICE_INR: 0,
  TEACHER_PRICE_INR: 0,
} as const;

export const MASTERY_EVIDENCE_MIN_QUESTIONS = 3;
export const MASTERY_CONFIDENCE_WEIGHT = 0.2;

export const IMPORT_LIMITS = {
  MAX_FILE_BYTES: 15 * 1024 * 1024,
  MAX_ROWS: 10000,
  SYNC_PROCESS_MAX_ROWS: 500,
} as const;

export const SUPPORTED_IMPORT_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

export const DEFAULT_PAPER_DISTRIBUTION = {
  MCQ: { count: 10, marks: 1 },
  SHORT_ANSWER: { count: 5, marks: 2 },
  LONG_ANSWER: { count: 3, marks: 5 },
} as const;

export const SEED_DEMO_INSTITUTION = {
  name: 'Sanro Demo Academy',
  code: 'DEMO',
  type: 'SCHOOL',
} as const;

export const ROLE_HOME_PATHS = {
  SUPER_ADMIN: '/super-admin',
  INSTITUTION_ADMIN: '/institution',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
} as const;

export type RoleKey = 'STUDENT' | 'TEACHER' | 'PARENT' | 'INSTITUTION_ADMIN' | 'SUPER_ADMIN';

export interface RoleTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  gradient: string;
  navBg: string;
  navActive: string;
  cardBorder: string;
  badge: string;
  badgeText: string;
}

export const ROLE_THEMES: Record<RoleKey, RoleTheme> = {
  STUDENT: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    accent: '#8b5cf6',
    accentLight: '#ede9fe',
    gradient: 'from-violet-600 to-purple-600',
    navBg: 'bg-violet-50',
    navActive: 'text-violet-600 bg-violet-50',
    cardBorder: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    badgeText: 'text-violet-700',
  },
  TEACHER: {
    primary: '#4f46e5',
    primaryLight: '#818cf8',
    primaryDark: '#3730a3',
    accent: '#6366f1',
    accentLight: '#e0e7ff',
    gradient: 'from-indigo-600 to-blue-600',
    navBg: 'bg-indigo-50',
    navActive: 'text-indigo-600 bg-indigo-50',
    cardBorder: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    badgeText: 'text-indigo-700',
  },
  PARENT: {
    primary: '#0d9488',
    primaryLight: '#5eead4',
    primaryDark: '#115e59',
    accent: '#14b8a6',
    accentLight: '#ccfbf1',
    gradient: 'from-teal-600 to-emerald-600',
    navBg: 'bg-teal-50',
    navActive: 'text-teal-600 bg-teal-50',
    cardBorder: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    badgeText: 'text-teal-700',
  },
  INSTITUTION_ADMIN: {
    primary: '#1e40af',
    primaryLight: '#60a5fa',
    primaryDark: '#1e3a8a',
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    gradient: 'from-blue-700 to-indigo-700',
    navBg: 'bg-blue-50',
    navActive: 'text-blue-700 bg-blue-50',
    cardBorder: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    badgeText: 'text-blue-700',
  },
  SUPER_ADMIN: {
    primary: '#475569',
    primaryLight: '#94a3b8',
    primaryDark: '#334155',
    accent: '#6366f1',
    accentLight: '#e0e7ff',
    gradient: 'from-slate-600 to-indigo-600',
    navBg: 'bg-slate-50',
    navActive: 'text-slate-700 bg-slate-50',
    cardBorder: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700',
    badgeText: 'text-slate-700',
  },
};

export const SEMANTIC_COLORS = {
  learning: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  practice: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  assessment: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  diagnosis: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  remediation: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  mastery: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  improvement: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  streak: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  xp: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  analytics: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  content: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  admin: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
} as const;

export const MASTERY_LEVELS = {
  MASTERED: { label: 'Mastered', color: 'emerald', emoji: '✅' },
  DEVELOPING: { label: 'Developing', color: 'blue', emoji: '📘' },
  NEEDS_ATTENTION: { label: 'Needs Attention', color: 'amber', emoji: '⚠️' },
  NOT_STARTED: { label: 'Not Started', color: 'slate', emoji: '⬜' },
} as const;
