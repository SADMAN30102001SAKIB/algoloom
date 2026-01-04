-- AlterTable
ALTER TABLE "ProblemStat" ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ProblemStat_solvedAt_idx" ON "ProblemStat"("solvedAt");
