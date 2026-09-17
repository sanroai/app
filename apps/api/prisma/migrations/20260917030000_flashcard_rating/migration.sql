-- CreateTable
CREATE TABLE "FlashcardRating" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "conceptId" UUID,
    "rating" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlashcardRating_studentId_idx" ON "FlashcardRating"("studentId");

-- CreateIndex
CREATE INDEX "FlashcardRating_conceptId_idx" ON "FlashcardRating"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardRating_studentId_questionId_key" ON "FlashcardRating"("studentId", "questionId");

-- AddForeignKey
ALTER TABLE "FlashcardRating" ADD CONSTRAINT "FlashcardRating_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardRating" ADD CONSTRAINT "FlashcardRating_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardRating" ADD CONSTRAINT "FlashcardRating_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
