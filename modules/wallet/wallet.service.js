import Decimal from "decimal.js";
import prisma from "../../config/prisma.config.js";
import redis from "../../config/redis.config.js";
import logger from "../../config/winston.config.js";
import { generateReference } from "../../utils/reference.util.js";
import { AppError } from "../../utils/appError.util.js";

const invalidateWalletCache = async (userId) => {
  try {
    await redis.del(`wallet:${userId}`);
  } catch (error) {
    logger.warn("Failed to invalidate wallet cache", {
      userId,
      error: error.message,
    });
  }
};

export const getWallet = async (userId) => {
  try {
    const walletKey = `wallet:${userId}`;

    const cachedWallet = await redis.get(walletKey);
    if (cachedWallet) {
      logger.info("Wallet fetched from cache", { userId });
      const parsed = JSON.parse(cachedWallet);
      parsed.balance = new Decimal(parsed.balance);

      return parsed;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId },
    });
    if (!wallet) throw new AppError("Wallet not found", 404);

    await redis.set(walletKey, JSON.stringify(wallet), "EX", 60); // Cache for 1mins;

    logger.info("Wallet fetched from DB and cached", { userId });
    return wallet;
  } catch (error) {
    logger.error("Failed to fetch wallet", { userId, error: error.message });
    throw error;
  }
};

export const deposit = async (userId, amount, idempotencyKey) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Idempotency Check (CRITICAL)
      // Stop double-deposits if the user clicks the button twice or the network retries
      const existingTx = await tx.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx)
        return { status: "ALREADY_PROCESSED", transactionId: existingTx.id };

      // Lock the Wallet Row (Pessimistic Locking)
      const wallets = await tx.$queryRaw`
        SELECT * FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE
      `;
      const wallet = wallets[0];
      if (!wallet) throw new AppError("WALLET_NOT_FOUND", 404);

      // Atomic Increment
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      const reference = generateReference("DEPOSIT");

      // Create Transaction Record
      const transactionRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: amount,
          status: "COMPLETED", // Since it's a direct deposit, we mark as completed
          idempotencyKey,
          reference: reference,
        },
      });

      // Ledger Entry (The Audit Trail)
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transactionRecord.id,
          entryType: "CREDIT",
          amount: amount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
        },
      });

      logger.info("Deposit successful", {
        userId,
        amount,
        txId: transactionRecord.id,
      });

      return {
        userId,
        walletId: wallet.id,
        transactionRecordId: transactionRecord.id,
        newBalance: updatedWallet.balance,
      };
    });

    if (result.status !== "ALREADY_PROCESSED") {
      await invalidateWalletCache(userId);
    }

    return result;
  } catch (error) {
    logger.error("Deposit failed", { userId, error: error.message });
    throw error;
  }
};

export const withdraw = async (userId, amount, idempotencyKey) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return { status: "ALREADY_PROCESSED", transactionId: existingTx.id };
      }

      const wallets = await tx.$queryRaw`
         SELECT * FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE
      `;
      const wallet = wallets[0];
      if (!wallet) throw new AppError("Wallet not found", 404);
      if (new Decimal(wallet.balance).lessThan(amount))
        throw new AppError("Insufficient funds", 400);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      const reference = generateReference("WITHDRAW");

      const txRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAW",
          amount: amount,
          status: "COMPLETED",
          idempotencyKey,
          reference: reference,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: txRecord.id,
          entryType: "DEBIT",
          amount: amount,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
        },
      });

      logger.info("Withdrawal successful", {
        userId,
        amount,
        transactionId: txRecord.id,
      });

      return {
        userId,
        walletId: wallet.id,
        transactionId: txRecord.id,
        newBalance: updatedWallet.balance,
      };
    });

    if (result.status !== "ALREADY_PROCESSED") {
      await invalidateWalletCache(userId);
    }

    return result;
  } catch (error) {
    logger.error("Withdrawal failed", { userId, error: error.message });
    throw error;
  }
};

export const getTransactionHistory = async (userId, page, limit, type) => {
  try {
    const wallet = await prisma.wallet.findFirst({
      where: { userId },
    });
    if (!wallet) throw new AppError("Wallet not found", 404);

    const skip = (page - 1) * limit;
    const whereClause = {
      walletId: wallet.id,
    };
    if (type) {
      whereClause.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.transaction.count({
        where: whereClause,
      }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch transaction history", {
      userId,
      error: error.message,
    });
    throw error;
  }
};
