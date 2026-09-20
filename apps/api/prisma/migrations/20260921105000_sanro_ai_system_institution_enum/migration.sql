-- SANRO AI system institution
-- Migration 1 of 2: add SANRO_PLATFORM to InstitutionType.
-- (Separate from the institution insert because PostgreSQL forbids using a newly
-- committed enum value within the same transaction that added it.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'InstitutionType' AND n.nspname = current_schema() AND e.enumlabel = 'SANRO_PLATFORM'
  ) THEN
    ALTER TYPE "InstitutionType" ADD VALUE 'SANRO_PLATFORM';
  END IF;
END $$;