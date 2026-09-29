-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'READY', 'DEPLOYING', 'DEPLOYED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "ReleaseItemType" AS ENUM ('FEATURE', 'BUG', 'HOTFIX', 'INFRASTRUCTURE', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "ReleaseItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'QA_PENDING', 'READY');

-- CreateEnum
CREATE TYPE "ChecklistKind" AS ENUM ('QA_VALIDATED', 'DATABASE_MIGRATION_CHECKED', 'ENVIRONMENT_VARIABLES_CHECKED', 'BACKGROUND_JOBS_CHECKED', 'ROLLBACK_PLAN_DOCUMENTED');

-- CreateEnum
CREATE TYPE "DeploymentResult" AS ENUM ('SUCCEEDED', 'FAILED', 'ROLLED_BACK');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "targetDeploymentDate" DATE,
    "deployedAt" TIMESTAMPTZ(3),
    "rollbackNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseItem" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReleaseItemType" NOT NULL,
    "status" "ReleaseItemStatus" NOT NULL DEFAULT 'TODO',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReleaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseChecklistItem" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "kind" "ChecklistKind" NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "changeRequired" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReleaseChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "DeploymentResult" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Release_status_targetDeploymentDate_idx" ON "Release"("status", "targetDeploymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Release_projectId_version_key" ON "Release"("projectId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseItem_releaseId_externalReference_key" ON "ReleaseItem"("releaseId", "externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseChecklistItem_releaseId_kind_key" ON "ReleaseChecklistItem"("releaseId", "kind");

-- CreateIndex
CREATE INDEX "Deployment_releaseId_occurredAt_idx" ON "Deployment"("releaseId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseItem" ADD CONSTRAINT "ReleaseItem_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseChecklistItem" ADD CONSTRAINT "ReleaseChecklistItem_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
