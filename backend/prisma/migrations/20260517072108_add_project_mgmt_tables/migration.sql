/*
  Warnings:

  - The values [ADMIN,ACCOUNTANT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `location` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaterialRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('MATERIAL_REQUEST', 'WORK_ITEM');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('UNASSIGNED', 'PENDING', 'RESOLVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('GENERAL_MANAGER', 'PROJECT_MANAGER', 'SITE_MANAGER', 'PURCHASER', 'SYS_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_userId_fkey";

-- DropForeignKey
ALTER TABLE "MaterialRequest" DROP CONSTRAINT "MaterialRequest_projectId_fkey";

-- DropForeignKey
ALTER TABLE "MaterialRequest" DROP CONSTRAINT "MaterialRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkItem" DROP CONSTRAINT "WorkItem_projectId_fkey";

-- DropForeignKey
ALTER TABLE "WorkItem" DROP CONSTRAINT "WorkItem_userId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "location",
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "completionPct" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "MaterialRequest";

-- DropTable
DROP TABLE "WorkItem";

-- DropEnum
DROP TYPE "ExpenseStatus";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedTo" TEXT,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "status" "TicketStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskUpdate" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "completionPct" INTEGER NOT NULL,
    "issueText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskUpdate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUpdate" ADD CONSTRAINT "TaskUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUpdate" ADD CONSTRAINT "TaskUpdate_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
