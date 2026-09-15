export const Sanro = {
  productName: 'Sanro AI',
  domain: 'sanroai.com',
  appDomain: 'app.sanroai.com',
  apiDomain: 'api.sanroai.com',
  tagline: 'TEST. FIND THE GAP. FIX IT.',
  hero: 'TURN EVERY TEST INTO MEASURABLE IMPROVEMENT.',
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