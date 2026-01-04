-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "driverCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "functionSignature" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "starterCode" SET DEFAULT '',
ALTER COLUMN "starterCode" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "language" SET DEFAULT 'PYTHON';
