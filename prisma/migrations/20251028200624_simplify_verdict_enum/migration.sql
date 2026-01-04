/*
  Warnings:

  - The values [WRONG_ANSWER,TIME_LIMIT_EXCEEDED,MEMORY_LIMIT_EXCEEDED,RUNTIME_ERROR,COMPILATION_ERROR,INTERNAL_ERROR] on the enum `Verdict` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `acceptanceRate` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `totalAccepted` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubmission` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `bestMemory` on the `ProblemStat` table. All the data in the column will be lost.
  - You are about to drop the column `bestRuntime` on the `ProblemStat` table. All the data in the column will be lost.
  - The `hintsUsed` column on the `ProblemStat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `errorMessage` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `judge0Token` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `hintsUsed` on the `User` table. All the data in the column will be lost.

*/
-- Update existing verdicts to REJECTED (except ACCEPTED and PENDING)
UPDATE "Submission" SET "verdict" = 'PENDING' WHERE "verdict" IN ('WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'INTERNAL_ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "Verdict_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "Submission" ALTER COLUMN "verdict" DROP DEFAULT;
ALTER TABLE "Submission" ALTER COLUMN "verdict" TYPE "Verdict_new" USING ("verdict"::text::"Verdict_new");
ALTER TYPE "Verdict" RENAME TO "Verdict_old";
ALTER TYPE "Verdict_new" RENAME TO "Verdict";
DROP TYPE "Verdict_old";
ALTER TABLE "Submission" ALTER COLUMN "verdict" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Problem_acceptanceRate_idx";

-- DropIndex
DROP INDEX "Submission_judge0Token_key";

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "acceptanceRate",
DROP COLUMN "totalAccepted",
DROP COLUMN "totalSubmission";

-- AlterTable
ALTER TABLE "ProblemStat" DROP COLUMN "bestMemory",
DROP COLUMN "bestRuntime",
DROP COLUMN "hintsUsed",
ADD COLUMN     "hintsUsed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "errorMessage",
DROP COLUMN "judge0Token";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "hintsUsed",
ADD COLUMN     "isPro" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DailyChallenge_problemId_idx" ON "DailyChallenge"("problemId");

-- CreateIndex
CREATE INDEX "HintLog_problemId_idx" ON "HintLog"("problemId");

-- CreateIndex
CREATE INDEX "Leaderboard_userId_idx" ON "Leaderboard"("userId");

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintLog" ADD CONSTRAINT "HintLog_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
