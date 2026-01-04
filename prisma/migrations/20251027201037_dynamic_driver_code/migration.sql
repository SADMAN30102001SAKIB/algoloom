/*
  Warnings:

  - You are about to drop the column `functionSignature` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "functionSignature",
ADD COLUMN     "functionName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "parameterTypes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "returnType" TEXT NOT NULL DEFAULT '';
