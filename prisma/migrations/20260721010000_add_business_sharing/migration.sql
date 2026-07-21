-- AlterTable
ALTER TABLE "SharedLink" ADD COLUMN     "detailLevel" TEXT,
ADD COLUMN     "allowEdit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BusinessCollaborator" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessCollaborator_businessId_idx" ON "BusinessCollaborator"("businessId");

-- CreateIndex
CREATE INDEX "BusinessCollaborator_userId_idx" ON "BusinessCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCollaborator_businessId_userId_key" ON "BusinessCollaborator"("businessId", "userId");

-- AddForeignKey
ALTER TABLE "BusinessCollaborator" ADD CONSTRAINT "BusinessCollaborator_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCollaborator" ADD CONSTRAINT "BusinessCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
