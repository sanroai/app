import {
  Role,
  InstitutionType,
  InstitutionStatus,
  MembershipStatus,
  AcademicYearStatus,
  GroupType,
  GroupStatus,
  StudentStatus,
  ContentType,
  ContentStatus,
  Visibility,
  QuestionType,
  QuestionStatus,
  QuestionSource,
  Difficulty,
  PaperStatus,
  AssessmentStatus,
  AssessmentMode,
  AttemptStatus,
  MasteryLevel,
  ImportStatus,
  ImportRowStatus,
  ImportEntityType,
  RemediationItemStatus,
  NotificationEvent,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionHistoryAction,
  AccountBlockState,
  ReportType,
  SupportTicketStatus,
  Language,
  ContentProgressState,
} from './enums';

export type UUID = string;
export type ISODate = string;

// ---- Auth -------------------------------------------------------------------

export interface JwtPayload {
  sub: UUID;
  role: Role;
  institutionId?: UUID;
  name?: string;
  email?: string;
}

export interface AuthUser {
  id: UUID;
  email: string;
  phone?: string | null;
  name: string;
  role: Role;
  institutionId?: UUID | null;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Returned by /auth/login, /auth/refresh and /auth/switch-context when the
 * authenticated account is blocked (expired / suspended / archived / disabled).
 * No tokens are issued in this state, so the client renders a dedicated screen.
 */
export interface BlockedAccountResponse {
  state: AccountBlockState;
  message: string;
  institution?: {
    id: UUID;
    name: string;
    type: InstitutionType;
    status: InstitutionStatus;
    expiresAt?: ISODate | null;
    supportContact?: string | null;
  } | null;
}

export interface AuthProfile extends AuthUser {
  avatarUrl?: string | null;
  language: Language;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ---- Multi-tenancy ----------------------------------------------------------

export interface Institution {
  id: UUID;
  name: string;
  type: InstitutionType;
  status: InstitutionStatus;
  code: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  createdAt: ISODate;
  seatLimit?: number | null;
  gracePeriodDays?: number;
  archivedAt?: ISODate | null;
  suspendedAt?: ISODate | null;
  expiredAt?: ISODate | null;
  lastActivityAt?: ISODate;
  subscription: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan | null;
}

export interface InstitutionMember {
  id: UUID;
  institutionId: UUID;
  userId: UUID;
  role: Role;
  status: MembershipStatus;
}

export interface AcademicYear {
  id: UUID;
  institutionId: UUID;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  status: AcademicYearStatus;
}

export interface Group {
  id: UUID;
  institutionId: UUID;
  academicYearId: UUID;
  name: string;
  type: GroupType;
  grade?: string | null;
  status: GroupStatus;
  studentCount?: number;
}

export interface GroupMembership {
  id: UUID;
  groupId: UUID;
  studentId: UUID;
  academicYearId: UUID;
}

// ---- People -----------------------------------------------------------------

export interface Student {
  id: UUID;
  institutionId: UUID;
  academicYearId: UUID;
  userId?: UUID | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: ISODate | null;
  rollNumber?: string | null;
  grade?: string | null;
  status: StudentStatus;
  groups: Group[];
  parent?: Parent | null;
  createdAt: ISODate;
}

export interface Teacher {
  id: UUID;
  institutionId: UUID;
  userId: UUID;
  name: string;
  email: string;
  phone?: string | null;
  employeeId?: string | null;
  status: MembershipStatus;
  groups: Group[];
  subjects: Subject[];
  createdAt: ISODate;
}

export interface Parent {
  id: UUID;
  userId?: UUID | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  children: Student[];
}

export interface ParentStudentLink {
  id: UUID;
  parentId: UUID;
  studentId: UUID;
}

// ---- Curriculum -------------------------------------------------------------

export interface Board {
  id: UUID;
  name: string;
  code: string;
  active: boolean;
}

export interface Grade {
  id: UUID;
  boardId: UUID;
  name: string;
  order: number;
}

export interface Subject {
  id: UUID;
  boardId: UUID;
  name: string;
  code: string;
  grades: string[];
  icon?: string | null;
  color?: string | null;
  order?: number;
  description?: string | null;
}

export interface Chapter {
  id: UUID;
  subjectId: UUID;
  name: string;
  code: string;
  grade: string;
  order: number;
  description?: string | null;
}

export interface Topic {
  id: UUID;
  chapterId: UUID;
  name: string;
  order: number;
}

export interface Concept {
  id: UUID;
  topicId: UUID;
  name: string;
  order: number;
  description?: string | null;
}

export interface CurriculumMapping {
  boardId?: UUID;
  grade?: string;
  subjectId?: UUID;
  chapterId?: UUID;
  topicId?: UUID;
  conceptId?: UUID;
}

// ---- Content ----------------------------------------------------------------

export interface ContentItem {
  id: UUID;
  type: ContentType;
  status: ContentStatus;
  visibility: Visibility;
  title: string;
  description?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  url?: string | null;
  language: Language;
  institutionId?: UUID | null;
  subjectId?: UUID | null;
  chapterId?: UUID | null;
  topicId?: UUID | null;
  conceptId?: UUID | null;
}

export interface ContentProgress {
  id: UUID;
  contentId: UUID;
  studentId: UUID;
  state: ContentProgressState;
  secondsWatched?: number | null;
  completedAt?: ISODate | null;
}

// ---- Questions --------------------------------------------------------------

export interface QuestionOption {
  id: UUID;
  questionId: UUID;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: UUID;
  type: QuestionType;
  status: QuestionStatus;
  source: QuestionSource;
  institutionId?: UUID | null;
  boardId: UUID;
  grade: string;
  subjectId: UUID;
  chapterId: UUID;
  topicId?: UUID | null;
  conceptId?: UUID | null;
  difficulty: Difficulty;
  marks?: number | null;
  text: string;
  hint?: string | null;
  explanation?: string | null;
  answer: string;
  language: Language;
  options: QuestionOption[];
  createdAt: ISODate;
}

// ---- Question papers --------------------------------------------------------

export interface PaperSection {
  id: UUID;
  name: string;
  order: number;
}

export interface PaperConfig {
  title?: string;
  examName?: string;
  boardId: UUID;
  grade: string;
  subjectId: UUID;
  chapterIds?: UUID[];
  topicIds?: UUID[];
  conceptIds?: UUID[];
  totalMarks: number;
  durationMinutes: number;
  date?: ISODate;
  instructions?: string;
  language: Language;
  difficulty: Difficulty;
  distribution: Record<string, { count: number; marks: number }>;
  versions?: number;
}

export interface PaperValidationResult {
  valid: boolean;
  totalMarks: number;
  expectedMarks: number;
  errors: string[];
  warnings: string[];
}

export interface QuestionPaper {
  id: UUID;
  institutionId: UUID;
  title: string;
  examName: string;
  boardId: UUID;
  grade: string;
  subjectId: UUID;
  totalMarks: number;
  durationMinutes: number;
  date?: ISODate | null;
  instructions?: string | null;
  language: Language;
  version?: string | null;
  status: PaperStatus;
  createdAt: ISODate;
}

export interface QuestionPaperDetail extends QuestionPaper {
  sections: PaperPaperSection[];
  questions: PaperQuestion[];
}

export interface PaperPaperSection {
  id: UUID;
  name: string;
  order: number;
  questions: PaperQuestion[];
}

export interface PaperQuestion {
  id: UUID;
  questionId: UUID;
  order: number;
  sectionName: string;
  type: QuestionType;
  marks: number;
  text: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string | null;
  conceptId?: UUID | null;
}

// ---- Assessments ------------------------------------------------------------

export interface Assessment {
  id: UUID;
  institutionId: UUID;
  title: string;
  subjectId: UUID;
  chapterId?: UUID | null;
  totalMarks: number;
  durationMinutes: number;
  status: AssessmentStatus;
  mode: AssessmentMode;
  attemptsAllowed: number;
  dueAt?: ISODate | null;
  startsAt?: ISODate | null;
  autoSubmitOnExpiry: boolean;
}

export interface AssessmentSnapshot {
  id: UUID;
  assessmentId: UUID;
  questionId: UUID;
  text: string;
  type: QuestionType;
  marks: number;
  answer: string;
  options: QuestionOption[];
  conceptId?: UUID | null;
  order: number;
}

export interface AssessmentAttempt {
  id: UUID;
  assessmentId: UUID;
  studentId: UUID;
  status: AttemptStatus;
  startedAt?: ISODate | null;
  submittedAt?: ISODate | null;
  score?: number | null;
  maxScore?: number | null;
  accuracy?: number | null;
  answers: StudentAnswer[];
}

export interface StudentAnswer {
  id: UUID;
  attemptId: UUID;
  snapshotQuestionId: UUID;
  answer?: string | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  maxMarks?: number | null;
  gradedByTeacher?: boolean;
  updatedAt: ISODate;
}

export interface AssessmentResult {
  attempt: AssessmentAttempt;
  score: number;
  maxScore: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  conceptResults: ConceptDiagnosis[];
}

// ---- Diagnosis / mastery ----------------------------------------------------

export interface ConceptDiagnosis {
  conceptId: UUID;
  conceptName: string;
  score: number;
  level: MasteryLevel;
  attempts: number;
  correct: number;
  evidence: 'SUFFICIENT' | 'INSUFFICIENT';
}

export interface WeakConcept extends ConceptDiagnosis {
  subjectId: UUID;
  subjectName: string;
  chapterId: UUID;
  chapterName: string;
}

export interface MasteryBreakdown {
  subjectId: UUID;
  subjectName: string;
  mastery: number;
  level: MasteryLevel;
}

export interface ImprovementSummary {
  beforeScore: number;
  afterScore: number;
  improvement: number;
  conceptScores: Record<string, number>;
}

// ---- Remediation ------------------------------------------------------------

export interface RemediationPlan {
  id: UUID;
  studentId: UUID;
  conceptId: UUID;
  conceptName: string;
  status: 'ACTIVE' | 'COMPLETED';
  items: RemediationItem[];
  createdAt: ISODate;
}

export interface RemediationItem {
  id: UUID;
  planId: UUID;
  order: number;
  contentType: ContentType;
  contentId?: UUID | null;
  title: string;
  status: RemediationItemStatus;
  completedAt?: ISODate | null;
}

// ---- Practice ---------------------------------------------------------------

export interface PracticeSet {
  id: UUID;
  studentId: UUID;
  conceptIds: UUID[];
  questions: Question[];
  createdAt: ISODate;
}

// ---- Imports ----------------------------------------------------------------

export interface ImportJob {
  id: UUID;
  institutionId: UUID;
  academicYearId: UUID;
  entityType: ImportEntityType;
  fileName: string;
  originalName: string;
  status: ImportStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  existingRows: number;
  importedRows: number;
  createdBy: UUID;
  createdAt: ISODate;
  errorReportUrl?: string | null;
}

export interface ImportRowResult {
  rowNumber: number;
  name?: string;
  status: ImportRowStatus;
  errors: string[];
  data: Record<string, unknown>;
}

export interface ImportPreview {
  job: ImportJob;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
    existing: number;
  };
  rows: ImportRowResult[];
}

// ---- Students upload template ----------------------------------------------

export interface StudentUploadRow {
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  gender?: string;
  date_of_birth?: string;
  grade?: string;
  division?: string;
  batch?: string;
  roll_number?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
}

export interface TeacherUploadRow {
  name?: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  subjects?: string;
  groups?: string;
}

// ---- Notifications ----------------------------------------------------------

export interface Notification {
  id: UUID;
  recipientId: UUID;
  type: NotificationEvent;
  channel: 'IN_APP';
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: UUID | null;
  readAt?: ISODate | null;
  createdAt: ISODate;
}

// ---- Reports ----------------------------------------------------------------

export interface ReportSpec {
  id: UUID;
  institutionId: UUID;
  type: ReportType;
  params: Record<string, unknown>;
  pdfUrl?: string | null;
  createdAt: ISODate;
}

// ---- Subscriptions ----------------------------------------------------------

export interface Plan {
  id: UUID;
  key: SubscriptionPlan;
  name: string;
  priceMonthly?: number | null;
  priceYearly?: number | null;
  perSeat: number;
  active: boolean;
}

export interface Subscription {
  id: UUID;
  institutionId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  startedAt: ISODate;
  endsAt?: ISODate | null;
  seatLimit?: number | null;
}

export interface SubscriptionView extends Subscription {
  plan: Plan;
  daysRemaining?: number | null;
  expiringSoon: boolean;
  expired: boolean;
}

export interface SubscriptionHistoryEntry {
  id: UUID;
  action: SubscriptionHistoryAction;
  institutionId: UUID;
  subscriptionId?: UUID | null;
  changedById: UUID;
  changedBy?: { name: string; email: string } | null;
  oldPlan?: Plan | null;
  newPlan?: Plan | null;
  oldStatus?: SubscriptionStatus | null;
  newStatus?: SubscriptionStatus | null;
  oldSeatLimit?: number | null;
  newSeatLimit?: number | null;
  oldStartsAt?: ISODate | null;
  oldEndsAt?: ISODate | null;
  newStartsAt?: ISODate | null;
  newEndsAt?: ISODate | null;
  reason?: string | null;
  createdAt: ISODate;
}

// ---- Super admin institution management ------------------------------------

export interface InstitutionListItem {
  id: UUID;
  name: string;
  type: InstitutionType;
  status: InstitutionStatus;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  seatLimit?: number | null;
  billableUsers: number;
  usagePct: number;
  limitExceeded: boolean;
  createdAt: ISODate;
  lastActivityAt?: ISODate;
  archivedAt?: ISODate | null;
  suspendedAt?: ISODate | null;
  expiredAt?: ISODate | null;
  primaryAdmin?: { id: UUID; name: string; email: string } | null;
  subscription?: SubscriptionView | null;
}

export interface InstitutionListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: InstitutionListItem[];
}

export interface InstitutionDetail extends InstitutionListItem {
  description?: string | null;
  country?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  gracePeriodDays: number;
  address?: string | null;
  counts: {
    students: number;
    teachers: number;
    parents: number;
    groups: number;
    assessments: number;
    papers: number;
    questions: number;
    members: number;
    admins: number;
  };
  admins: Array<{
    id: UUID;
    userId: UUID;
    name: string;
    email: string;
    phone?: string | null;
    status: MembershipStatus;
    lastLoginAt?: ISODate | null;
  }>;
  subscriptionHistory: SubscriptionHistoryEntry[];
  recentAudit: Array<{
    id: UUID;
    action: string;
    entityType?: string | null;
    metadata: Record<string, unknown>;
    createdAt: ISODate;
    user?: { name: string; email: string } | null;
  }>;
}

export interface InstitutionQuery {
  search?: string;
  type?: InstitutionType;
  status?: InstitutionStatus;
  subscriptionStatus?: SubscriptionStatus;
  plan?: string;
  limitExceeded?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface UserLimitStatus {
  limit?: number | null;
  current: number;
  available: number | null;
  exceeded: boolean;
}

export interface SuperAdminDashboard {
  institutions: {
    total: number;
    active: number;
    pending: number;
    expiringSoon: number;
    expired: number;
    suspended: number;
    archived: number;
    limitExceeded: number;
  };
  users: { total: number; students: number; teachers: number; parents: number };
}

// ---- Account state (auth + entitlements) ------------------------------------

export interface SubscriptionInfo {
  id: UUID;
  planKey: SubscriptionPlan;
  planName: string;
  status: SubscriptionStatus;
  startedAt?: ISODate | null;
  endsAt?: ISODate | null;
  seatLimit?: number | null;
  daysRemaining?: number | null;
  expiringSoon: boolean;
  expired: boolean;
}

export interface AccountStateResponse {
  access: boolean;
  state?: AccountBlockState | null;
  message?: string | null;
  institution?: {
    id: UUID;
    name: string;
    type: InstitutionType;
    status: InstitutionStatus;
    subscription?: SubscriptionInfo | null;
    expiresAt?: ISODate | null;
    seatLimit?: number | null;
    billableUsers?: number | null;
    limitExceeded: boolean;
  } | null;
}

// ---- Support ----------------------------------------------------------------

export interface SupportTicket {
  id: UUID;
  institutionId: UUID;
  createdBy: UUID;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  createdAt: ISODate;
}

// ---- AI Chat ----------------------------------------------------------------

export interface ChatMessage {
  id?: UUID;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: ISODate;
}

export interface ChatRequest {
  message: string;
  context?: {
    conceptId?: UUID;
    questionId?: UUID;
    assessmentId?: UUID;
  };
}

export interface ChatResponse {
  reply: string;
  grounded: boolean;
  sources: string[];
}

// ---- Dashboard aggregates ---------------------------------------------------

export interface ConceptStat {
  conceptId: UUID;
  conceptName: string;
  mastery: number;
  weakStudentCount: number;
}

export interface ClassStats {
  groupId: UUID;
  groupName: string;
  studentCount: number;
  averageScore: number;
  averageMastery: number;
  weakConceptStats: ConceptStat[];
}

export interface TeacherStudentView {
  studentId: UUID;
  name: string;
  overall: number;
  weakConcepts: WeakConcept[];
  developingConcepts: ConceptDiagnosis[];
  strongConcepts: ConceptDiagnosis[];
}

export interface StudentHome {
  firstName: string;
  todayFocus?: WeakConcept | null;
  upcomingTests: Assessment[];
  continueLearning: ContentItem[];
  progress: MasteryBreakdown[];
  gamification: {
    xp: number;
    streakDays: number;
    badges: string[];
  };
}

export interface ParentChildView {
  child: Student;
  overall: number;
  subjectProgress: MasteryBreakdown[];
  recentTests: AssessmentResult[];
  weakConcepts: WeakConcept[];
  improvement: ImprovementSummary;
}

export interface DashboardStats {
  activeStudents: number;
  activeTeachers: number;
  totalAssessments: number;
  avgScore: number;
  avgMastery: number;
  dueAssessments: number;
}

// ---- Score / judgment helpers ----------------------------------------------

export const EVIDENCE_THRESHOLD = 3;

export interface ImportedResultByRow {
  [rowNumber: number]: 'valid' | 'invalid' | 'duplicate' | 'existing';
}