-- IDEMPOTENT enum additions (may already exist locally via `db push`)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_PLAN_CHANGED') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_PLAN_CHANGED';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_EXPIRED') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_EXPIRED';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INSTITUTION_ADMIN_CHANGED') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_ADMIN_CHANGED';
  END IF;
END
$$;

-- People Management: DIRECT SANRO subscribers (no fake institution)
-- AlterTable
ALTER TABLE "Parent" ALTER COLUMN "institutionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "institutionId" DROP NOT NULL,
ALTER COLUMN "academicYearId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "userId" UUID,
ALTER COLUMN "institutionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionHistory" ALTER COLUMN "institutionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;