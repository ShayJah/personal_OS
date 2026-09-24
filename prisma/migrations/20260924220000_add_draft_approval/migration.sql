-- AlterTable
ALTER TABLE "EmailDraft" ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedByUserId" TEXT;
