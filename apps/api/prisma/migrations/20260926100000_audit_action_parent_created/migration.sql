-- Audit action for bulk-imported parent accounts (parents have no create/added action yet)
-- Idempotent: ADD VALUE IF NOT EXISTS makes this safe to re-run on any local environment.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PARENT_CREATED';
