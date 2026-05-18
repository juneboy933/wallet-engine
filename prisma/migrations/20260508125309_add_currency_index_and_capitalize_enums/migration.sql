/*
  Warnings:

  - The values [credit,debit] on the enum `EntryType` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,completed,failed] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [deposit,withdraw,transfer] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EntryType_new" AS ENUM ('CREDIT', 'DEBIT');
ALTER TABLE "LedgerEntry" ALTER COLUMN "entryType" TYPE "EntryType_new" USING ("entryType"::text::"EntryType_new");
ALTER TYPE "EntryType" RENAME TO "EntryType_old";
ALTER TYPE "EntryType_new" RENAME TO "EntryType";
DROP TYPE "public"."EntryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRANSFER');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropIndex
DROP INDEX "Wallet_userId_idx";

-- CreateIndex
CREATE INDEX "Wallet_userId_currency_idx" ON "Wallet"("userId", "currency");
