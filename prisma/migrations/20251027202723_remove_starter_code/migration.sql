/*
  Warnings:

  - You are about to drop the column `driverCode` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `functionName` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `parameterTypes` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `returnType` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `starterCode` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "driverCode",
DROP COLUMN "functionName",
DROP COLUMN "parameterTypes",
DROP COLUMN "returnType",
DROP COLUMN "starterCode",
ADD COLUMN     "inputFormat" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "outputFormat" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "language" DROP DEFAULT;
