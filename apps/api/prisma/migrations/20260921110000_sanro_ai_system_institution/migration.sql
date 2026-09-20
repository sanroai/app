-- SANRO AI system institution — Migration 2 of 2
-- Creates the SINGLE system-owned institution ("SANRO AI", type SANRO_PLATFORM),
-- hosts all direct SANRO customers, and backfills existing institution-less
-- students/parents onto it. Must never be duplicated (unique index), deleted,
-- archived, suspended or expired (frontend + backend + test enforcement).

-- 1. Add isSystemInstitution flag (unique => at most ONE system institution)
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "isSystemInstitution" BOOLEAN NOT NULL DEFAULT false;

-- 2. Singleton guarantee at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS "Institution_isSystemInstitution_key" ON "Institution"("isSystemInstitution");

-- 3. Insert the system institution (idempotent, never duplicated)
INSERT INTO "Institution" ("id", "name", "type", "isSystemInstitution", "status", "code", "createdAt", "lastActivityAt")
SELECT '00000000-0000-0000-0000-00000000a5a1', 'SANRO AI', 'SANRO_PLATFORM'::"InstitutionType", true, 'ACTIVE', 'SANRO-AI', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Institution" WHERE "isSystemInstitution" = true);

-- 4. Backfill existing institution-less people onto the system institution
UPDATE "Student" SET "institutionId" = '00000000-0000-0000-0000-00000000a5a1'
WHERE "institutionId" IS NULL;

UPDATE "Parent" SET "institutionId" = '00000000-0000-0000-0000-00000000a5a1'
WHERE "institutionId" IS NULL;