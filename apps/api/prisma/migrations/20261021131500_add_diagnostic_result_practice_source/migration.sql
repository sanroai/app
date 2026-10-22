-- Practice sessions are not assessment attempts, so their diagnostic evidence is
-- linked to the practice set instead. Without this the practice submit failed with
-- "DiagnosticResult_attemptId_fkey" (the practice id was written into the
-- assessment-attempt foreign key).
ALTER TABLE "DiagnosticResult" ADD COLUMN "practiceSetId" UUID;

CREATE INDEX "DiagnosticResult_practiceSetId_idx" ON "DiagnosticResult"("practiceSetId");

ALTER TABLE "DiagnosticResult"
  ADD CONSTRAINT "DiagnosticResult_practiceSetId_fkey"
  FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
