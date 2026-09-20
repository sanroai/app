-- CreateEnum
CREATE TYPE "SubscriptionHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'RENEWED', 'PLAN_CHANGED', 'LIMIT_CHANGED', 'CANCELLED', 'EXPIRED', 'ACTIVATED', 'SUSPENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_EXPIRED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE 'INSTITUTION_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_RENEWED';
ALTER TYPE "AuditAction" ADD VALUE 'PLAN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_LIMIT_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_ENABLED';

-- AlterEnum
ALTER TYPE "InstitutionStatusEnum" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InstitutionType" ADD VALUE 'COACHING';
ALTER TYPE "InstitutionType" ADD VALUE 'ACADEMY';
ALTER TYPE "InstitutionType" ADD VALUE 'TUITION_CENTRE';
ALTER TYPE "InstitutionType" ADD VALUE 'EDUCATIONAL_INSTITUTE';
ALTER TYPE "InstitutionType" ADD VALUE 'TRAINING_CENTRE';
ALTER TYPE "InstitutionType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "subscriptionId" UUID,
    "action" "SubscriptionHistoryAction" NOT NULL,
    "changedById" UUID NOT NULL,
    "oldPlanId" UUID,
    "newPlanId" UUID,
    "oldStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus",
    "oldSeatLimit" INTEGER,
    "newSeatLimit" INTEGER,
    "oldStartsAt" TIMESTAMP(3),
    "oldEndsAt" TIMESTAMP(3),
    "newStartsAt" TIMESTAMP(3),
    "newEndsAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionHistory_institutionId_createdAt_idx" ON "SubscriptionHistory"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_subscriptionId_idx" ON "SubscriptionHistory"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_action_idx" ON "SubscriptionHistory"("action");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "Institution_deletedAt_idx" ON "Institution"("deletedAt");

-- CreateIndex
CREATE INDEX "Subscription_institutionId_status_idx" ON "Subscription"("institutionId", "status");

-- CreateIndex
CREATE INDEX "Subscription_endsAt_idx" ON "Subscription"("endsAt");

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
