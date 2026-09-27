-- Import entity type: PARENTS (parent accounts + optional child links)
-- Idempotent: ADD VALUE IF NOT EXISTS makes this safe to re-run on any local environment.

ALTER TYPE "ImportEntityType" ADD VALUE IF NOT EXISTS 'PARENTS';
