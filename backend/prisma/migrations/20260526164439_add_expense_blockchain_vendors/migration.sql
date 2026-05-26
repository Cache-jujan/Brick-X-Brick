/*
  Warnings:

  - The values [UNASSIGNED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isActive` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `Task` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Made the column `clientName` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dueDate` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedTo` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `recipientRole` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedBy` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedTo` on table `Ticket` required. This step will fail if there are existing NULL values in that column.

*/

-- ─── Step 0: Seed helpers ─────────────────────────────────────────────────────
-- Grab the first GENERAL_MANAGER user id to use as a safe default for createdBy
-- and the first PROJECT_MANAGER for milestones. Falls back to the first user if
-- no specific role exists yet (dev data scenario).

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'OVERDUE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BIRValidationStatus" AS ENUM ('FORMAL', 'INFORMAL');

-- CreateEnum
CREATE TYPE "VendorApprovalStatus" AS ENUM ('APPROVED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('BIR_DUPLICATE', 'VENDOR_VALIDATION', 'TICKET_MISMATCH');

-- CreateEnum
CREATE TYPE "BlockchainEventType" AS ENUM ('EXPENSE_APPROVED', 'REPORT_GENERATED', 'SYNC_COMPLETED');

-- AlterEnum: Remove UNASSIGNED — migrate any UNASSIGNED rows to PENDING first
UPDATE "Ticket" SET "status" = 'PENDING' WHERE "status" = 'UNASSIGNED';

BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_assignedTo_fkey";

-- ─── User: add new columns with defaults ──────────────────────────────────────
ALTER TABLE "User" ADD COLUMN "lockoutUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- ─── Project: fix existing rows before adding NOT NULL columns ────────────────

-- Ensure clientName is not null (fill blanks)
UPDATE "Project" SET "clientName" = 'Unknown Client' WHERE "clientName" IS NULL;

-- Add createdBy as nullable first, fill with first GM user, then make NOT NULL
ALTER TABLE "Project" ADD COLUMN "createdBy" TEXT;
UPDATE "Project" SET "createdBy" = (
  SELECT id FROM "User"
  WHERE role = 'GENERAL_MANAGER'
  ORDER BY "createdAt" ASC
  LIMIT 1
);
-- Fallback: if no GM exists yet, use the first user
UPDATE "Project" SET "createdBy" = (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "createdBy" IS NULL;
ALTER TABLE "Project" ALTER COLUMN "createdBy" SET NOT NULL;

-- Drop isActive, add status
ALTER TABLE "Project" DROP COLUMN "isActive";
ALTER TABLE "Project" ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Project" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(15,2);
ALTER TABLE "Project" ALTER COLUMN "clientName" SET NOT NULL;

-- ─── Milestone: add createdBy safely ─────────────────────────────────────────
ALTER TABLE "Milestone" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Milestone" ADD COLUMN "status" "MilestoneStatus" NOT NULL DEFAULT 'ON_TRACK';

ALTER TABLE "Milestone" ADD COLUMN "createdBy" TEXT;
UPDATE "Milestone" SET "createdBy" = (
  SELECT id FROM "User"
  WHERE role = 'PROJECT_MANAGER'
  ORDER BY "createdAt" ASC
  LIMIT 1
);
-- Fallback: if no PM exists yet, use first user
UPDATE "Milestone" SET "createdBy" = (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "createdBy" IS NULL;
ALTER TABLE "Milestone" ALTER COLUMN "createdBy" SET NOT NULL;

-- ─── Task: handle targetDate → dueDate rename and new NOT NULL columns ────────
ALTER TABLE "Task" ADD COLUMN "issueReport" TEXT;
ALTER TABLE "Task" ADD COLUMN "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" ADD COLUMN "photoEvidenceURL" TEXT;
ALTER TABLE "Task" ADD COLUMN "scheduleVarianceAlertSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "updatedBy" TEXT;

-- Copy targetDate → dueDate before dropping (nullable first, fill, then NOT NULL)
ALTER TABLE "Task" ADD COLUMN "dueDate" TIMESTAMP(3);
UPDATE "Task" SET "dueDate" = "targetDate" WHERE "targetDate" IS NOT NULL;
UPDATE "Task" SET "dueDate" = NOW() WHERE "dueDate" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "dueDate" SET NOT NULL;
ALTER TABLE "Task" DROP COLUMN "targetDate";

-- assignedTo: fill any NULLs before making NOT NULL
UPDATE "Task" SET "assignedTo" = (
  SELECT id FROM "User"
  WHERE role = 'SITE_MANAGER'
  ORDER BY "createdAt" ASC
  LIMIT 1
) WHERE "assignedTo" IS NULL;
-- Fallback
UPDATE "Task" SET "assignedTo" = (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "assignedTo" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "assignedTo" SET NOT NULL;

-- ─── Ticket: add new NOT NULL columns safely ──────────────────────────────────

-- Add nullable first, populate, then constrain
ALTER TABLE "Ticket" ADD COLUMN "photoURL" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "resolvedBy" TEXT;

ALTER TABLE "Ticket" ADD COLUMN "subject" TEXT;
UPDATE "Ticket" SET "subject" = COALESCE("description", 'Untitled Ticket');
ALTER TABLE "Ticket" ALTER COLUMN "subject" SET NOT NULL;

ALTER TABLE "Ticket" ADD COLUMN "submittedBy" TEXT;
UPDATE "Ticket" SET "submittedBy" = (
  SELECT id FROM "User"
  WHERE role = 'PROJECT_MANAGER'
  ORDER BY "createdAt" ASC
  LIMIT 1
);
UPDATE "Ticket" SET "submittedBy" = (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "submittedBy" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "submittedBy" SET NOT NULL;

ALTER TABLE "Ticket" ADD COLUMN "recipientRole" TEXT;
UPDATE "Ticket" SET "recipientRole" = CASE
  WHEN type = 'MATERIAL_REQUEST' THEN 'PURCHASER'
  ELSE 'SITE_MANAGER'
END;
ALTER TABLE "Ticket" ALTER COLUMN "recipientRole" SET NOT NULL;

ALTER TABLE "Ticket" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Ticket" SET "updatedAt" = "createdAt";
ALTER TABLE "Ticket" ALTER COLUMN "updatedAt" SET NOT NULL;

-- description is now nullable
ALTER TABLE "Ticket" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- assignedTo: fill NULLs before making NOT NULL
UPDATE "Ticket" SET "assignedTo" = (
  SELECT id FROM "User"
  WHERE role = 'PURCHASER'
  ORDER BY "createdAt" ASC
  LIMIT 1
) WHERE "assignedTo" IS NULL AND type = 'MATERIAL_REQUEST';

UPDATE "Ticket" SET "assignedTo" = (
  SELECT id FROM "User"
  WHERE role = 'SITE_MANAGER'
  ORDER BY "createdAt" ASC
  LIMIT 1
) WHERE "assignedTo" IS NULL AND type = 'WORK_ITEM';

UPDATE "Ticket" SET "assignedTo" = (
  SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "assignedTo" IS NULL;

ALTER TABLE "Ticket" ALTER COLUMN "assignedTo" SET NOT NULL;

-- ─── New Tables ───────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "ticketId" TEXT,
    "vendorName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "birValidationStatus" "BIRValidationStatus" NOT NULL,
    "receiptImageURL" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "birNumber" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptAllocation" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "allocatedAmount" DECIMAL(12,2) NOT NULL,
    "commonReceiptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMasterList" (
    "id" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "location" TEXT,
    "historicalAverage" DECIMAL(12,2),
    "approvalStatus" "VendorApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMasterList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "flaggedBy" TEXT NOT NULL,
    "flagType" "FlagType" NOT NULL,
    "detectionLayer" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainLog" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "eventType" "BlockchainEventType" NOT NULL,
    "validatorNodeCount" INTEGER NOT NULL,
    "consensusType" TEXT NOT NULL DEFAULT 'Clique',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorMasterList_vendorName_key" ON "VendorMasterList"("vendorName");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainLog_txHash_key" ON "BlockchainLog"("txHash");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptAllocation" ADD CONSTRAINT "ReceiptAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptAllocation" ADD CONSTRAINT "ReceiptAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMasterList" ADD CONSTRAINT "VendorMasterList_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;