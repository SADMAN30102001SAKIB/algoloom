/*
  Warnings:

  - A unique constraint covering the columns `[userId,period]` on the table `Leaderboard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Leaderboard` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Leaderboard_period_score_idx";

-- DropIndex
DROP INDEX "Leaderboard_userId_period_createdAt_key";

-- AlterTable
ALTER TABLE "Leaderboard" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Leaderboard_period_rank_idx" ON "Leaderboard"("period", "rank" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_userId_period_key" ON "Leaderboard"("userId", "period");
