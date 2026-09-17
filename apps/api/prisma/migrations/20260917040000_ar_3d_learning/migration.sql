-- CreateEnum
CREATE TYPE "ArModelFormat" AS ENUM ('GLB', 'GLTF', 'USDZ');

-- CreateEnum
CREATE TYPE "ArValidationStatus" AS ENUM ('PENDING', 'VALID', 'WARNINGS', 'INVALID', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "ArActivityType" AS ENUM ('AR_OPENED', 'AR_STARTED', 'AR_MODEL_INTERACTION', 'AR_QUICK_CHECK_STARTED', 'AR_QUICK_CHECK_COMPLETED', 'AR_COMPLETED');

-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'AR';

-- CreateTable
CREATE TABLE "ArContent" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "learningObjective" TEXT,
    "instructions" TEXT,
    "status" "ContentLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'INSTITUTION_ONLY',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "modelKey" TEXT,
    "modelUrl" TEXT,
    "modelFormat" "ArModelFormat",
    "fileSizeBytes" INTEGER,
    "previewKey" TEXT,
    "previewUrl" TEXT,
    "thumbnailUrl" TEXT,
    "hotspots" JSONB,
    "polygonCount" INTEGER,
    "textureMaxDim" INTEGER,
    "validationStatus" "ArValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationReport" JSONB,
    "source" TEXT,
    "license" TEXT,
    "attribution" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "institutionId" UUID,
    "boardId" UUID,
    "subjectId" UUID,
    "chapterId" UUID,
    "topicId" UUID,
    "conceptId" UUID,
    "grade" TEXT,
    "createdById" UUID,
    "reviewedById" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArContentVersion" (
    "id" UUID NOT NULL,
    "arContentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "modelKey" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArActivity" (
    "id" UUID NOT NULL,
    "type" "ArActivityType" NOT NULL,
    "arContentId" UUID NOT NULL,
    "conceptId" UUID,
    "studentId" UUID,
    "institutionId" UUID,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArContent_conceptId_status_idx" ON "ArContent"("conceptId", "status");

-- CreateIndex
CREATE INDEX "ArContent_institutionId_status_idx" ON "ArContent"("institutionId", "status");

-- CreateIndex
CREATE INDEX "ArContent_status_idx" ON "ArContent"("status");

-- CreateIndex
CREATE INDEX "ArContentVersion_arContentId_idx" ON "ArContentVersion"("arContentId");

-- CreateIndex
CREATE INDEX "ArActivity_arContentId_type_idx" ON "ArActivity"("arContentId", "type");

-- CreateIndex
CREATE INDEX "ArActivity_studentId_idx" ON "ArActivity"("studentId");

-- CreateIndex
CREATE INDEX "ArActivity_institutionId_idx" ON "ArActivity"("institutionId");

