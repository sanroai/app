-- Student archive lifecycle + system-institution index (schema drift fix)
-- Idempotent / non-destructive: guarded so it can re-run safely on any environment.

-- 1. StudentStatus.ARCHIVED (ADD VALUE fails if the value already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'StudentStatus'
      AND e.enumlabel = 'ARCHIVED'
  ) THEN
    ALTER TYPE "StudentStatus" ADD VALUE 'ARCHIVED';
  END IF;
END
$$;

-- 2. Student.archivedAt (read by Prisma on every Student INSERT ... RETURNING)
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- 3. Institution.isSystemInstitution lookup index (schema.prisma @@index)
CREATE INDEX IF NOT EXISTS "Institution_isSystemInstitution_idx"
  ON "Institution"("isSystemInstitution");
