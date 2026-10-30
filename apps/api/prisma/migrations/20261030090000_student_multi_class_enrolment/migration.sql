-- A student may be enrolled in more than one class.
--
-- `Student.grade` stays the primary class (profiles, reports, imports keep
-- meaning); `StudentEnrolment` holds the full set that authorises content, and
-- `Student.allGrades` lifts the restriction for an account that has to explore
-- every class (the demo/QA student).

ALTER TABLE "Student" ADD COLUMN "allGrades" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "StudentEnrolment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "grade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEnrolment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentEnrolment_studentId_grade_key" ON "StudentEnrolment"("studentId", "grade");
CREATE INDEX "StudentEnrolment_studentId_idx" ON "StudentEnrolment"("studentId");
CREATE INDEX "StudentEnrolment_grade_idx" ON "StudentEnrolment"("grade");

ALTER TABLE "StudentEnrolment" ADD CONSTRAINT "StudentEnrolment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: whoever already had a class keeps it as their first enrolment, so
-- the access check reads exactly the same grade as before the migration.
INSERT INTO "StudentEnrolment" ("id", "studentId", "grade")
SELECT gen_random_uuid(), "id", "grade"
FROM "Student"
WHERE "grade" IS NOT NULL AND btrim("grade") <> '';
