-- Spaced review: every mastery row now carries the date it is next due.
-- Existing rows stay NULL, which the review queue reads as "due now" so a
-- student with history sees a queue on the first load after the migration.

-- AlterTable
ALTER TABLE "ConceptMastery" ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "reviewIntervalDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ConceptMastery_studentId_nextReviewAt_idx" ON "ConceptMastery"("studentId", "nextReviewAt");
