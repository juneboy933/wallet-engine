/*
  Warnings:

  - Added the required column `balanceAfter` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceBefore` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `entryType` on the `LedgerEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('credit', 'debit');

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "balanceAfter" DECIMAL(20,2) NOT NULL,
ADD COLUMN     "balanceBefore" DECIMAL(20,2) NOT NULL,
DROP COLUMN "entryType",
ADD COLUMN     "entryType" "EntryType" NOT NULL;

-- DropEnum
DROP TYPE "entryType";
