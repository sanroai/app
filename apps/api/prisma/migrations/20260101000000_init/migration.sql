-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'COACHING_CENTRE');

-- CreateEnum
CREATE TYPE "InstitutionStatusEnum" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('ACTIVE', 'PREPARING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('CLASS', 'DIVISION', 'BATCH');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'NOTES', 'PDF', 'QUIZ', 'MODEL_3D', 'GAME', 'PRACTICE_SET', 'ARTICLE', 'IMAGE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'INSTITUTION_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'FILL_BLANK', 'VERY_SHORT_ANSWER', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('MANUAL', 'AI', 'IMPORT', 'SEED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "PaperStatus" AS ENUM ('DRAFT', 'READY', 'EXPORTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('DIGITAL', 'PRINT', 'BOTH');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NEEDS_INTERVENTION', 'WEAK', 'DEVELOPING', 'GOOD', 'MASTERED', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'VALIDATED', 'COMMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('VALID', 'INVALID', 'DUPLICATE', 'EXISTING', 'SKIPPED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ImportEntityType" AS ENUM ('STUDENTS', 'TEACHERS');

-- CreateEnum
CREATE TYPE "RemediationPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RemediationItemStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('ASSESSMENT_ASSIGNED', 'ASSESSMENT_DUE', 'ASSESSMENT_RESULT', 'WEAK_CONCEPT_DETECTED', 'REMEDIATION_ASSIGNED', 'PRACTICE_ASSIGNED', 'RETEST_AVAILABLE', 'RETEST_RESULT', 'ACHIEVEMENT_UNLOCKED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PAST_DUE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlanKey" AS ENUM ('STUDENT_MONTHLY', 'STUDENT_YEARLY', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('STUDENT', 'CLASS', 'TEACHER', 'INSTITUTION', 'ASSESSMENT', 'CONCEPT', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('STUDENT_IMPORTED', 'STUDENT_CREATED', 'STUDENT_MOVED', 'TEACHER_ADDED', 'QUESTION_GENERATED', 'QUESTION_APPROVED', 'PAPER_CREATED', 'PAPER_EXPORTED', 'ASSESSMENT_PUBLISHED', 'RESULT_MODIFIED', 'REMEDIATION_ASSIGNED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'MR', 'HI');

-- CreateEnum
CREATE TYPE "ContentProgressState" AS ENUM ('NOT_STARTED', 'STARTED', 'QUARTER', 'HALF', 'THREE_QUARTER', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UploadEntity" AS ENUM ('DOCUMENT', 'VIDEO', 'IMAGE', 'MODEL_3D', 'IMPORT_FILE', 'LOGO', 'CONFIGURED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshJti" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "status" "InstitutionStatusEnum" NOT NULL DEFAULT 'PENDING',
    "code" TEXT,
    "logoUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "primaryPhone" TEXT,
    "primaryEmail" TEXT,
    "seatLimit" INTEGER,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionMember" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'PREPARING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "parentGroupId" UUID,
    "name" TEXT NOT NULL,
    "type" "GroupType" NOT NULL,
    "grade" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherGroup" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,

    CONSTRAINT "TeacherGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "rollNumber" TEXT,
    "grade" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentStudentLink" (
    "id" UUID NOT NULL,
    "parentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,

    CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'INSTITUTION_ONLY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationSeconds" INTEGER,
    "thumbnailUrl" TEXT,
    "url" TEXT,
    "institutionId" UUID,
    "boardId" UUID,
    "subjectId" UUID,
    "chapterId" UUID,
    "topicId" UUID,
    "conceptId" UUID,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentProgress" (
    "id" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "state" "ContentProgressState" NOT NULL DEFAULT 'NOT_STARTED',
    "secondsWatched" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ContentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "boardId" UUID NOT NULL,
    "grade" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "topicId" UUID,
    "conceptId" UUID,
    "type" "QuestionType" NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "QuestionSource" NOT NULL DEFAULT 'MANUAL',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "marks" INTEGER,
    "text" TEXT NOT NULL,
    "hint" TEXT,
    "explanation" TEXT,
    "answer" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "createdById" UUID,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionConcept" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,

    CONSTRAINT "QuestionConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaper" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "sourcePaperId" UUID,
    "title" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "boardId" UUID NOT NULL,
    "grade" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "instructions" TEXT,
    "language" "Language" NOT NULL DEFAULT 'EN',
    "distribution" JSONB NOT NULL,
    "versionName" TEXT,
    "status" "PaperStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaperQuestion" (
    "id" UUID NOT NULL,
    "paperId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,

    CONSTRAINT "QuestionPaperQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "sourcePaperId" UUID,
    "title" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "chapterId" UUID,
    "totalMarks" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "AssessmentMode" NOT NULL DEFAULT 'DIGITAL',
    "attemptsAllowed" INTEGER NOT NULL DEFAULT 1,
    "teacherId" UUID,
    "dueAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "autoSubmitOnExpiry" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "questionId" UUID,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "marks" INTEGER NOT NULL,
    "answer" TEXT,
    "explanation" TEXT,
    "conceptId" UUID,
    "options" JSONB NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAssignment" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "groupId" UUID,
    "studentId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "attemptIndex" INTEGER NOT NULL DEFAULT 1,
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER,
    "correctCount" INTEGER,
    "wrongCount" INTEGER,
    "skippedCount" INTEGER,
    "accuracy" DECIMAL(5,2),
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnswer" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "assessmentQuestionId" UUID NOT NULL,
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "marksAwarded" INTEGER,
    "maxMarks" INTEGER,
    "gradedByTeacher" BOOLEAN NOT NULL DEFAULT false,
    "gradedById" UUID,
    "gradedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptMastery" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "level" "MasteryLevel" NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticResult" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "attemptId" UUID,
    "score" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "level" "MasteryLevel" NOT NULL,
    "evidence" TEXT NOT NULL DEFAULT 'SUFFICIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationPlan" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "status" "RemediationPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RemediationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationItem" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" UUID,
    "title" TEXT NOT NULL,
    "status" "RemediationItemStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RemediationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSet" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "conceptId" UUID,
    "conceptIds" JSONB NOT NULL,
    "questionIds" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "total" INTEGER,
    "correctCount" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAnswer" (
    "id" UUID NOT NULL,
    "practiceSetId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationProfile" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAchievement" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "entityType" "ImportEntityType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "existingRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID NOT NULL,
    "errorReportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "name" TEXT,
    "status" "ImportRowStatus" NOT NULL,
    "errors" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "importedEntityId" UUID,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" UUID,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "key" "SubscriptionPlanKey" NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER,
    "priceYearly" INTEGER,
    "perSeat" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "seatLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "params" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "generatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" UUID NOT NULL,
    "entity" "UploadEntity" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "userId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" UUID,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "userId" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "cost" DECIMAL(10,6),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshJti_key" ON "Session"("refreshJti");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE INDEX "Institution_status_idx" ON "Institution"("status");

-- CreateIndex
CREATE INDEX "Institution_createdById_idx" ON "Institution"("createdById");

-- CreateIndex
CREATE INDEX "InstitutionMember_userId_idx" ON "InstitutionMember"("userId");

-- CreateIndex
CREATE INDEX "InstitutionMember_institutionId_role_idx" ON "InstitutionMember"("institutionId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionMember_institutionId_userId_key" ON "InstitutionMember"("institutionId", "userId");

-- CreateIndex
CREATE INDEX "AcademicYear_institutionId_status_idx" ON "AcademicYear"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_institutionId_name_key" ON "AcademicYear"("institutionId", "name");

-- CreateIndex
CREATE INDEX "Group_institutionId_idx" ON "Group"("institutionId");

-- CreateIndex
CREATE INDEX "Group_academicYearId_idx" ON "Group"("academicYearId");

-- CreateIndex
CREATE INDEX "Group_parentGroupId_idx" ON "Group"("parentGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_academicYearId_name_key" ON "Group"("academicYearId", "name");

-- CreateIndex
CREATE INDEX "GroupMembership_studentId_idx" ON "GroupMembership"("studentId");

-- CreateIndex
CREATE INDEX "GroupMembership_academicYearId_idx" ON "GroupMembership"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_groupId_studentId_academicYearId_key" ON "GroupMembership"("groupId", "studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_institutionId_idx" ON "Teacher"("institutionId");

-- CreateIndex
CREATE INDEX "Teacher_userId_idx" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_institutionId_employeeId_key" ON "Teacher"("institutionId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_key" ON "TeacherSubject"("teacherId", "subjectId");

-- CreateIndex
CREATE INDEX "TeacherGroup_groupId_idx" ON "TeacherGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherGroup_teacherId_groupId_academicYearId_key" ON "TeacherGroup"("teacherId", "groupId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_institutionId_idx" ON "Student"("institutionId");

-- CreateIndex
CREATE INDEX "Student_academicYearId_idx" ON "Student"("academicYearId");

-- CreateIndex
CREATE INDEX "Student_grade_idx" ON "Student"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "Student_institutionId_email_key" ON "Student"("institutionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_institutionId_idx" ON "Parent"("institutionId");

-- CreateIndex
CREATE INDEX "Parent_email_idx" ON "Parent"("email");

-- CreateIndex
CREATE INDEX "ParentStudentLink_studentId_idx" ON "ParentStudentLink"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_parentId_studentId_key" ON "ParentStudentLink"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Board_code_key" ON "Board"("code");

-- CreateIndex
CREATE INDEX "Board_active_idx" ON "Board"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_boardId_name_key" ON "Grade"("boardId", "name");

-- CreateIndex
CREATE INDEX "Subject_boardId_idx" ON "Subject"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_boardId_code_key" ON "Subject"("boardId", "code");

-- CreateIndex
CREATE INDEX "Chapter_subjectId_grade_idx" ON "Chapter"("subjectId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subjectId_code_key" ON "Chapter"("subjectId", "code");

-- CreateIndex
CREATE INDEX "Topic_chapterId_idx" ON "Topic"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_chapterId_name_key" ON "Topic"("chapterId", "name");

-- CreateIndex
CREATE INDEX "Concept_topicId_idx" ON "Concept"("topicId");

-- CreateIndex
CREATE INDEX "Concept_name_idx" ON "Concept"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_topicId_name_key" ON "Concept"("topicId", "name");

-- CreateIndex
CREATE INDEX "ContentItem_institutionId_idx" ON "ContentItem"("institutionId");

-- CreateIndex
CREATE INDEX "ContentItem_conceptId_idx" ON "ContentItem"("conceptId");

-- CreateIndex
CREATE INDEX "ContentItem_type_status_idx" ON "ContentItem"("type", "status");

-- CreateIndex
CREATE INDEX "ContentProgress_studentId_idx" ON "ContentProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentProgress_contentId_studentId_key" ON "ContentProgress"("contentId", "studentId");

-- CreateIndex
CREATE INDEX "Question_institutionId_idx" ON "Question"("institutionId");

-- CreateIndex
CREATE INDEX "Question_boardId_grade_subjectId_chapterId_idx" ON "Question"("boardId", "grade", "subjectId", "chapterId");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_conceptId_idx" ON "Question"("conceptId");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "QuestionConcept_conceptId_idx" ON "QuestionConcept"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionConcept_questionId_conceptId_key" ON "QuestionConcept"("questionId", "conceptId");

-- CreateIndex
CREATE INDEX "QuestionPaper_institutionId_idx" ON "QuestionPaper"("institutionId");

-- CreateIndex
CREATE INDEX "QuestionPaper_status_idx" ON "QuestionPaper"("status");

-- CreateIndex
CREATE INDEX "QuestionPaper_subjectId_idx" ON "QuestionPaper"("subjectId");

-- CreateIndex
CREATE INDEX "QuestionPaperQuestion_paperId_sectionOrder_order_idx" ON "QuestionPaperQuestion"("paperId", "sectionOrder", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestion_paperId_questionId_key" ON "QuestionPaperQuestion"("paperId", "questionId");

-- CreateIndex
CREATE INDEX "Assessment_institutionId_idx" ON "Assessment"("institutionId");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_order_idx" ON "AssessmentQuestion"("assessmentId", "order");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_conceptId_idx" ON "AssessmentQuestion"("conceptId");

-- CreateIndex
CREATE INDEX "AssessmentAssignment_studentId_idx" ON "AssessmentAssignment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAssignment_assessmentId_studentId_key" ON "AssessmentAssignment"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_studentId_idx" ON "AssessmentAttempt"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_assessmentId_studentId_attemptIndex_key" ON "AssessmentAttempt"("assessmentId", "studentId", "attemptIndex");

-- CreateIndex
CREATE INDEX "StudentAnswer_attemptId_idx" ON "StudentAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnswer_attemptId_assessmentQuestionId_key" ON "StudentAnswer"("attemptId", "assessmentQuestionId");

-- CreateIndex
CREATE INDEX "ConceptMastery_studentId_level_idx" ON "ConceptMastery"("studentId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMastery_studentId_conceptId_key" ON "ConceptMastery"("studentId", "conceptId");

-- CreateIndex
CREATE INDEX "DiagnosticResult_studentId_idx" ON "DiagnosticResult"("studentId");

-- CreateIndex
CREATE INDEX "DiagnosticResult_conceptId_level_idx" ON "DiagnosticResult"("conceptId", "level");

-- CreateIndex
CREATE INDEX "DiagnosticResult_attemptId_idx" ON "DiagnosticResult"("attemptId");

-- CreateIndex
CREATE INDEX "RemediationPlan_studentId_idx" ON "RemediationPlan"("studentId");

-- CreateIndex
CREATE INDEX "RemediationPlan_conceptId_idx" ON "RemediationPlan"("conceptId");

-- CreateIndex
CREATE INDEX "RemediationItem_planId_idx" ON "RemediationItem"("planId");

-- CreateIndex
CREATE INDEX "PracticeSet_studentId_idx" ON "PracticeSet"("studentId");

-- CreateIndex
CREATE INDEX "PracticeSet_conceptId_idx" ON "PracticeSet"("conceptId");

-- CreateIndex
CREATE INDEX "PracticeAnswer_practiceSetId_idx" ON "PracticeAnswer"("practiceSetId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAnswer_practiceSetId_questionId_key" ON "PracticeAnswer"("practiceSetId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationProfile_studentId_key" ON "GamificationProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAchievement_studentId_achievementId_key" ON "StudentAchievement"("studentId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "ImportJob_institutionId_idx" ON "ImportJob"("institutionId");

-- CreateIndex
CREATE INDEX "ImportRow_jobId_idx" ON "ImportRow"("jobId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE INDEX "Subscription_institutionId_idx" ON "Subscription"("institutionId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Report_institutionId_idx" ON "Report"("institutionId");

-- CreateIndex
CREATE INDEX "SupportTicket_institutionId_idx" ON "SupportTicket"("institutionId");

-- CreateIndex
CREATE INDEX "UploadedFile_createdById_idx" ON "UploadedFile"("createdById");

-- CreateIndex
CREATE INDEX "AuditLog_institutionId_createdAt_idx" ON "AuditLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AiUsageLog_institutionId_createdAt_idx" ON "AiUsageLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_userId_idx" ON "AiUsageLog"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionMember" ADD CONSTRAINT "InstitutionMember_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionMember" ADD CONSTRAINT "InstitutionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGroup" ADD CONSTRAINT "TeacherGroup_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProgress" ADD CONSTRAINT "ContentProgress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProgress" ADD CONSTRAINT "ContentProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionConcept" ADD CONSTRAINT "QuestionConcept_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionConcept" ADD CONSTRAINT "QuestionConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_sourcePaperId_fkey" FOREIGN KEY ("sourcePaperId") REFERENCES "QuestionPaper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestion" ADD CONSTRAINT "QuestionPaperQuestion_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "QuestionPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestion" ADD CONSTRAINT "QuestionPaperQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_sourcePaperId_fkey" FOREIGN KEY ("sourcePaperId") REFERENCES "QuestionPaper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_assessmentQuestionId_fkey" FOREIGN KEY ("assessmentQuestionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMastery" ADD CONSTRAINT "ConceptMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationItem" ADD CONSTRAINT "RemediationItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RemediationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationItem" ADD CONSTRAINT "RemediationItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSet" ADD CONSTRAINT "PracticeSet_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationProfile" ADD CONSTRAINT "GamificationProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

