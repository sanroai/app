-- CreateEnum
CREATE TYPE "ContentOwnerType" AS ENUM ('PLATFORM', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "ContentProcessingStage" AS ENUM ('UPLOADED', 'VALIDATING', 'EXTRACTING', 'OCR', 'PARSING', 'MAPPING', 'CHUNKING', 'EMBEDDING', 'GENERATING', 'REVIEW', 'COMPLETED', 'FAILED', 'PARTIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_VERSION_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_UNASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE 'BOOK_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'BOOK_PROCESSING_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'BOOK_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'CURRICULUM_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CURRICULUM_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CURRICULUM_IMPORTED';
ALTER TYPE "AuditAction" ADD VALUE 'CURRICULUM_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'CURRICULUM_UNASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'KNOWLEDGE_BASE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'KNOWLEDGE_BASE_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'YOUTUBE_ADDED';

-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'PUBLISHED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'WORKSHEET';
ALTER TYPE "ContentType" ADD VALUE 'REVISION';
ALTER TYPE "ContentType" ADD VALUE 'FLASHCARDS';
ALTER TYPE "ContentType" ADD VALUE 'INTERACTIVE';
ALTER TYPE "ContentType" ADD VALUE 'EXAMPLE';
ALTER TYPE "ContentType" ADD VALUE 'READING';
ALTER TYPE "ContentType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "directSanroAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownerType" "ContentOwnerType" NOT NULL DEFAULT 'INSTITUTION',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedById" UUID,
ADD COLUMN     "sourceType" "ContentSourceType",
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "KnowledgeBase" ADD COLUMN     "ownerType" "ContentOwnerType" NOT NULL DEFAULT 'INSTITUTION',
ADD COLUMN     "stage" "ContentProcessingStage" NOT NULL DEFAULT 'UPLOADED';

-- AlterTable
ALTER TABLE "KnowledgeChunk" ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "sourcePage" INTEGER;

-- AlterTable
ALTER TABLE "ProcessingJob" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "stage" "ContentProcessingStage";

-- CreateTable
CREATE TABLE "ContentAssignment" (
    "id" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "assignedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionCurriculumAccess" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "grade" TEXT,
    "subjectId" UUID,
    "grantedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionCurriculumAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentAssignment_contentId_idx" ON "ContentAssignment"("contentId");

-- CreateIndex
CREATE INDEX "ContentAssignment_institutionId_idx" ON "ContentAssignment"("institutionId");

-- CreateIndex
CREATE INDEX "ContentAssignment_institutionId_createdAt_idx" ON "ContentAssignment"("institutionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAssignment_contentId_institutionId_key" ON "ContentAssignment"("contentId", "institutionId");

-- CreateIndex
CREATE INDEX "InstitutionCurriculumAccess_institutionId_idx" ON "InstitutionCurriculumAccess"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionCurriculumAccess_boardId_idx" ON "InstitutionCurriculumAccess"("boardId");

-- CreateIndex
CREATE INDEX "InstitutionCurriculumAccess_subjectId_idx" ON "InstitutionCurriculumAccess"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionCurriculumAccess_institutionId_boardId_grade_sub_key" ON "InstitutionCurriculumAccess"("institutionId", "boardId", "grade", "subjectId");

-- CreateIndex
CREATE INDEX "ContentItem_ownerType_status_idx" ON "ContentItem"("ownerType", "status");

-- CreateIndex
CREATE INDEX "ContentItem_ownerType_status_institutionId_idx" ON "ContentItem"("ownerType", "status", "institutionId");

-- CreateIndex
CREATE INDEX "ContentItem_grade_subjectId_status_idx" ON "ContentItem"("grade", "subjectId", "status");

-- CreateIndex
CREATE INDEX "ContentItem_conceptId_order_idx" ON "ContentItem"("conceptId", "order");

-- CreateIndex
CREATE INDEX "ContentItem_directSanroAvailable_status_idx" ON "ContentItem"("directSanroAvailable", "status");

-- CreateIndex
CREATE INDEX "KnowledgeBase_ownerType_status_idx" ON "KnowledgeBase"("ownerType", "status");

-- CreateIndex
CREATE INDEX "ProcessingJob_stage_idx" ON "ProcessingJob"("stage");

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionCurriculumAccess" ADD CONSTRAINT "InstitutionCurriculumAccess_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionCurriculumAccess" ADD CONSTRAINT "InstitutionCurriculumAccess_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionCurriculumAccess" ADD CONSTRAINT "InstitutionCurriculumAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
