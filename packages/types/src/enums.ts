export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RolePriority: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.INSTITUTION_ADMIN,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
] as const;

export const InstitutionType = {
  SCHOOL: 'SCHOOL',
  COACHING_CENTRE: 'COACHING_CENTRE',
} as const;
export type InstitutionType = (typeof InstitutionType)[keyof typeof InstitutionType];

export const InstitutionStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
  PENDING: 'PENDING',
} as const;
export type InstitutionStatus = (typeof InstitutionStatus)[keyof typeof InstitutionStatus];

export const MembershipStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const AcademicYearStatus = {
  ACTIVE: 'ACTIVE',
  PREPARING: 'PREPARING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type AcademicYearStatus = (typeof AcademicYearStatus)[keyof typeof AcademicYearStatus];

export const GroupType = {
  CLASS: 'CLASS',
  DIVISION: 'DIVISION',
  BATCH: 'BATCH',
} as const;
export type GroupType = (typeof GroupType)[keyof typeof GroupType];

export const GroupStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type GroupStatus = (typeof GroupStatus)[keyof typeof GroupStatus];

export const StudentStatus = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const ContentType = {
  VIDEO: 'VIDEO',
  NOTES: 'NOTES',
  PDF: 'PDF',
  QUIZ: 'QUIZ',
  MODEL_3D: 'MODEL_3D',
  GAME: 'GAME',
  PRACTICE_SET: 'PRACTICE_SET',
  ARTICLE: 'ARTICLE',
  IMAGE: 'IMAGE',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const ContentStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const Visibility = {
  PUBLIC: 'PUBLIC',
  INSTITUTION_ONLY: 'INSTITUTION_ONLY',
  PRIVATE: 'PRIVATE',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const QuestionType = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE',
  MULTI_SELECT: 'MULTI_SELECT',
  FILL_BLANK: 'FILL_BLANK',
  VERY_SHORT_ANSWER: 'VERY_SHORT_ANSWER',
  SHORT_ANSWER: 'SHORT_ANSWER',
  LONG_ANSWER: 'LONG_ANSWER',
  NUMERICAL: 'NUMERICAL',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const QuestionCategory = {
  OBJECTIVE: 'OBJECTIVE',
  SUBJECTIVE: 'SUBJECTIVE',
} as const;
export type QuestionCategory = (typeof QuestionCategory)[keyof typeof QuestionCategory];

export function getQuestionCategory(type: QuestionType): QuestionCategory {
  switch (type) {
    case QuestionType.MCQ:
    case QuestionType.TRUE_FALSE:
    case QuestionType.MULTI_SELECT:
    case QuestionType.FILL_BLANK:
    case QuestionType.NUMERICAL:
      return QuestionCategory.OBJECTIVE;
    default:
      return QuestionCategory.SUBJECTIVE;
  }
}

export const QuestionStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type QuestionStatus = (typeof QuestionStatus)[keyof typeof QuestionStatus];

export const QuestionSource = {
  MANUAL: 'MANUAL',
  AI: 'AI',
  IMPORT: 'IMPORT',
  SEED: 'SEED',
} as const;
export type QuestionSource = (typeof QuestionSource)[keyof typeof QuestionSource];

export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const PaperStatus = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  EXPORTED: 'EXPORTED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type PaperStatus = (typeof PaperStatus)[keyof typeof PaperStatus];

export const PaperExportKind = {
  STUDENT: 'STUDENT',
  ANSWER_KEY: 'ANSWER_KEY',
} as const;
export type PaperExportKind = (typeof PaperExportKind)[keyof typeof PaperExportKind];

export const AssessmentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type AssessmentStatus = (typeof AssessmentStatus)[keyof typeof AssessmentStatus];

export const AssessmentMode = {
  DIGITAL: 'DIGITAL',
  PRINT: 'PRINT',
  BOTH: 'BOTH',
} as const;
export type AssessmentMode = (typeof AssessmentMode)[keyof typeof AssessmentMode];

export const AttemptStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  AUTO_SUBMITTED: 'AUTO_SUBMITTED',
  EXPIRED: 'EXPIRED',
} as const;
export type AttemptStatus = (typeof AttemptStatus)[keyof typeof AttemptStatus];

export const MasteryLevel = {
  NEEDS_INTERVENTION: 'NEEDS_INTERVENTION',
  WEAK: 'WEAK',
  DEVELOPING: 'DEVELOPING',
  GOOD: 'GOOD',
  MASTERED: 'MASTERED',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
} as const;
export type MasteryLevel = (typeof MasteryLevel)[keyof typeof MasteryLevel];

export const MasteryThresholds = {
  NEEDS_INTERVENTION_MAX: 39,
  WEAK_MAX: 59,
  DEVELOPING_MAX: 74,
  GOOD_MAX: 89,
  MASTERED_MIN: 90,
  MIN_EVIDENCE_THRESHOLD: 0.6,
} as const;

export const ImportStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  VALIDATED: 'VALIDATED',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export const ImportRowStatus = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  DUPLICATE: 'DUPLICATE',
  EXISTING: 'EXISTING',
  SKIPPED: 'SKIPPED',
  IMPORTED: 'IMPORTED',
} as const;
export type ImportRowStatus = (typeof ImportRowStatus)[keyof typeof ImportRowStatus];

export const ImportEntityType = {
  STUDENTS: 'STUDENTS',
  TEACHERS: 'TEACHERS',
} as const;
export type ImportEntityType = (typeof ImportEntityType)[keyof typeof ImportEntityType];

export const RemediationItemStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;
export type RemediationItemStatus = (typeof RemediationItemStatus)[keyof typeof RemediationItemStatus];

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
  WHATSAPP: 'WHATSAPP',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationEvent = {
  ASSESSMENT_ASSIGNED: 'ASSESSMENT_ASSIGNED',
  ASSESSMENT_DUE: 'ASSESSMENT_DUE',
  ASSESSMENT_RESULT: 'ASSESSMENT_RESULT',
  WEAK_CONCEPT_DETECTED: 'WEAK_CONCEPT_DETECTED',
  REMEDIATION_ASSIGNED: 'REMEDIATION_ASSIGNED',
  PRACTICE_ASSIGNED: 'PRACTICE_ASSIGNED',
  RETEST_AVAILABLE: 'RETEST_AVAILABLE',
  RETEST_RESULT: 'RETEST_RESULT',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
} as const;
export type NotificationEvent = (typeof NotificationEvent)[keyof typeof NotificationEvent];

export const SubscriptionPlan = {
  STUDENT_MONTHLY: 'STUDENT_MONTHLY',
  STUDENT_YEARLY: 'STUDENT_YEARLY',
  INSTITUTION: 'INSTITUTION',
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  TRIAL: 'TRIAL',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  PAST_DUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const ReportType = {
  STUDENT: 'STUDENT',
  CLASS: 'CLASS',
  TEACHER: 'TEACHER',
  INSTITUTION: 'INSTITUTION',
  ASSESSMENT: 'ASSESSMENT',
  CONCEPT: 'CONCEPT',
  IMPROVEMENT: 'IMPROVEMENT',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const AuditAction = {
  STUDENT_IMPORTED: 'STUDENT_IMPORTED',
  STUDENT_CREATED: 'STUDENT_CREATED',
  STUDENT_MOVED: 'STUDENT_MOVED',
  TEACHER_ADDED: 'TEACHER_ADDED',
  QUESTION_GENERATED: 'QUESTION_GENERATED',
  QUESTION_APPROVED: 'QUESTION_APPROVED',
  PAPER_CREATED: 'PAPER_CREATED',
  PAPER_EXPORTED: 'PAPER_EXPORTED',
  ASSESSMENT_PUBLISHED: 'ASSESSMENT_PUBLISHED',
  RESULT_MODIFIED: 'RESULT_MODIFIED',
  REMEDIATION_ASSIGNED: 'REMEDIATION_ASSIGNED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const SupportTicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

export const Language = {
  EN: 'EN',
  MR: 'MR',
  HI: 'HI',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const ContentProgressState = {
  NOT_STARTED: 'NOT_STARTED',
  STARTED: 'STARTED',
  QUARTER: 'QUARTER',
  HALF: 'HALF',
  THREE_QUARTER: 'THREE_QUARTER',
  COMPLETED: 'COMPLETED',
} as const;
export type ContentProgressState = (typeof ContentProgressState)[keyof typeof ContentProgressState];