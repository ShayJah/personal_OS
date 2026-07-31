-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "linkedin" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "crmSheetId" TEXT,
ADD COLUMN "crmSheetTab" TEXT NOT NULL DEFAULT 'CRM';
