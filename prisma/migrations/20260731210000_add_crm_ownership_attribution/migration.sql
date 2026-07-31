-- AlterTable
ALTER TABLE "CrmRecord" ADD COLUMN "assignedToUserId" TEXT;

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "CrmRecord_assignedToUserId_idx" ON "CrmRecord"("assignedToUserId");

-- AddForeignKey
ALTER TABLE "CrmRecord" ADD CONSTRAINT "CrmRecord_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
