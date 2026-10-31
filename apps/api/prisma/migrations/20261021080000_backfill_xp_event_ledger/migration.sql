-- Backfill the XP ledger from existing lifetime XP counters so that profiles that
-- predate the ledger still report correct weekly/monthly/all-time numbers.
-- Idempotent: only profiles with XP and without a ledger entry are copied.
INSERT INTO "XpEvent" (id, "studentId", xp, reason, "createdAt")
SELECT gen_random_uuid(), p."studentId", p.xp, 'BACKFILL', COALESCE(p."lastActiveAt", p."createdAt")
FROM "GamificationProfile" p
WHERE p.xp > 0
  AND NOT EXISTS (SELECT 1 FROM "XpEvent" e WHERE e."studentId" = p."studentId");
