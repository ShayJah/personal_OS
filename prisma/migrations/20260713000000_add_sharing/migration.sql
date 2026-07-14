-- CreateTable
CREATE TABLE "ShareSettings" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "shareProgressPage" BOOLEAN NOT NULL DEFAULT false,
    "shareReports" BOOLEAN NOT NULL DEFAULT false,
    "shareTasks" BOOLEAN NOT NULL DEFAULT false,
    "shareHabits" BOOLEAN NOT NULL DEFAULT false,
    "shareHighlights" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareSettings_profileId_key" ON "ShareSettings"("profileId");

-- CreateIndex
CREATE INDEX "ShareSettings_profileId_idx" ON "ShareSettings"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedLink_token_key" ON "SharedLink"("token");

-- CreateIndex
CREATE INDEX "SharedLink_userId_idx" ON "SharedLink"("userId");

-- CreateIndex
CREATE INDEX "SharedLink_token_idx" ON "SharedLink"("token");

-- AddForeignKey
ALTER TABLE "ShareSettings" ADD CONSTRAINT "ShareSettings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
