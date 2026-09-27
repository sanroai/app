-- Import entity types: CONTENT (lesson/asset library rows) and QUESTIONS (question bank rows)
-- Idempotent: ADD VALUE IF NOT EXISTS makes this safe to re-run on any local environment.

ALTER TYPE "ImportEntityType" ADD VALUE IF NOT EXISTS 'CONTENT';
ALTER TYPE "ImportEntityType" ADD VALUE IF NOT EXISTS 'QUESTIONS';
