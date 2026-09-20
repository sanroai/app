-- SANRO AI system institution — fix singleton index
-- A FULL unique index on the boolean isSystemInstitution would forbid a second
-- isSystemInstitution=false row. Replace with a PARTIAL unique index that only
-- enforces single-ness for the true row (exactly one system institution).
DROP INDEX IF EXISTS "Institution_isSystemInstitution_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Institution_system_institution_singleton"
  ON "Institution"("isSystemInstitution")
  WHERE "isSystemInstitution" = true;