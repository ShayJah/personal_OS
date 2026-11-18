-- AlterTable
ALTER TABLE "Project" ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "businessId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "section" TEXT;

-- CreateIndex
CREATE INDEX "Project_businessId_idx" ON "Project"("businessId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
