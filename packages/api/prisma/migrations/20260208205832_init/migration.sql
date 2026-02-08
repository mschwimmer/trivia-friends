-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "authProvider" "AuthProvider" NOT NULL,
    "providerUid" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "dailyDoubleClueId" TEXT,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "BoardCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardClue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "isDailyDouble" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BoardClue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT NOT NULL,
    "hostUserId" TEXT,
    "title" TEXT,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPlayer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SessionPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionClue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "boardClueId" TEXT,
    "colIndex" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "categoryTitle" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isDailyDouble" BOOLEAN NOT NULL DEFAULT false,
    "opened" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SessionClue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_providerUid_key" ON "User"("authProvider", "providerUid");

-- CreateIndex
CREATE UNIQUE INDEX "Board_dailyDoubleClueId_key" ON "Board"("dailyDoubleClueId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardCategory_boardId_colIndex_key" ON "BoardCategory"("boardId", "colIndex");

-- CreateIndex
CREATE INDEX "BoardClue_questionId_idx" ON "BoardClue"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardClue_boardId_colIndex_rowIndex_key" ON "BoardClue"("boardId", "colIndex", "rowIndex");

-- CreateIndex
CREATE INDEX "GameSession_boardId_idx" ON "GameSession"("boardId");

-- CreateIndex
CREATE INDEX "GameSession_hostUserId_idx" ON "GameSession"("hostUserId");

-- CreateIndex
CREATE INDEX "SessionPlayer_sessionId_idx" ON "SessionPlayer"("sessionId");

-- CreateIndex
CREATE INDEX "SessionClue_sessionId_idx" ON "SessionClue"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionClue_sessionId_colIndex_rowIndex_key" ON "SessionClue"("sessionId", "colIndex", "rowIndex");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_dailyDoubleClueId_fkey" FOREIGN KEY ("dailyDoubleClueId") REFERENCES "BoardClue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardCategory" ADD CONSTRAINT "BoardCategory_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardClue" ADD CONSTRAINT "BoardClue_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardClue" ADD CONSTRAINT "BoardClue_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPlayer" ADD CONSTRAINT "SessionPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClue" ADD CONSTRAINT "SessionClue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClue" ADD CONSTRAINT "SessionClue_boardClueId_fkey" FOREIGN KEY ("boardClueId") REFERENCES "BoardClue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
