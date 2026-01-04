/*
  Warnings:

  - You are about to drop the column `currentStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastSolved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `problemsSolved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `streak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubmissions` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN     "statusId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentStreak",
DROP COLUMN "lastActiveDate",
DROP COLUMN "lastSolved",
DROP COLUMN "maxStreak",
DROP COLUMN "problemsSolved",
DROP COLUMN "streak",
DROP COLUMN "totalSubmissions",
DROP COLUMN "websiteUrl";
