-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AchievementCategory" ADD VALUE 'PROBLEM_SOLVING';
ALTER TYPE "AchievementCategory" ADD VALUE 'STREAK';
ALTER TYPE "AchievementCategory" ADD VALUE 'LEVEL';
ALTER TYPE "AchievementCategory" ADD VALUE 'SPECIAL';

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "requirement" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ProblemStat" ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "problemsSolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT;
