import Decimal from "decimal.js";
import prisma from "../../config/prisma.config.js";
import { generateReference } from "../../utils/reference.util.js";
import redis from "../../config/redis.config.js";
import logger from "../../config/winston.config.js";
import { AppError } from "../../utils/appError.util.js";

const invalidateWalletCaches = async (...userIds) => {
  try {
    await redis.del(...userIds.map((userId) => `wallet:${userId}`));
  } catch (error) {
    logger.warn("Failed to invalidate transfer wallet caches", {
      userIds,
      error: error.message,
    });
  }
};

export const transferFunds = async (
  senderId,
  receiverEmail,
  amount,
  idempotencyKey,
) => {
  try {
    const decimalAmount = new Decimal(amount);

    const result = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx)
        return {
          status: "ALREADY_PROCESSED",
          transactionId: existingTx.id,
        };

      const recipientUser = await tx.user.findUnique({
        where: { email: receiverEmail },
      });
      if (!recipientUser) {
        throw new AppError("Receiver not found", 404);
      }

      if (recipientUser.id === senderId)
        throw new AppError("Cannot transfer to yourself", 400);

      const orderIds = [senderId, recipientUser.id].sort();

      const lockedWallets = await tx.$queryRaw`
            SELECT * FROM "Wallet"
            WHERE "userId" IN (${orderIds[0]}, ${orderIds[1]})
            ORDER BY "userId"
            FOR UPDATE
        `;

      const sender = lockedWallets.find((wallet) => wallet.userId === senderId);
      if (!sender) throw new AppError("Sender wallet not found", 404);

      const receiver = lockedWallets.find(
        (wallet) => wallet.userId === recipientUser.id,
      );
      if (!receiver) throw new AppError("Receiver wallet not found", 404);

      if (sender.currency !== receiver.currency) {
        throw new Error(
          `Currency mismatch: Sender is using ${sender.currency} but Receiver is using ${receiver.currency}`,
        );
      }

      if (new Decimal(sender.balance).lessThan(decimalAmount)) {
        throw new AppError("Insufficient funds", 400);
      }

      const updatedSenderWallet = await tx.wallet.update({
        where: { id: sender.id },
        data: {
          balance: { decrement: decimalAmount },
        },
      });
      const updatedReceiverWallet = await tx.wallet.update({
        where: { id: receiver.id },
        data: {
          balance: { increment: decimalAmount },
        },
      });

      const reference = generateReference("TRANSFER");

      const txRecord = await tx.transaction.create({
        data: {
          walletId: sender.id,
          amount: decimalAmount,
          type: "TRANSFER",
          status: "COMPLETED",
          idempotencyKey,
          reference,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: sender.id,
          transactionId: txRecord.id,
          entryType: "DEBIT",
          amount: decimalAmount,
          balanceBefore: sender.balance,
          balanceAfter: updatedSenderWallet.balance,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: receiver.id,
          transactionId: txRecord.id,
          entryType: "CREDIT",
          amount: decimalAmount,
          balanceBefore: receiver.balance,
          balanceAfter: updatedReceiverWallet.balance,
        },
      });

      logger.info("Transfer successful", {
        Sender: senderId,
        Receiver: recipientUser.id,
        ReceiverEmail: receiverEmail,
        transactionId: txRecord.id,
        amount,
      });

      return {
        transactionId: txRecord.id,
        sentBy: senderId,
        receivedBy: recipientUser.id,
        amount: amount,
        balance: updatedSenderWallet.balance,
        cacheUserIds: [senderId, recipientUser.id],
      };
    });

    if (result.status !== "ALREADY_PROCESSED") {
      await invalidateWalletCaches(...result.cacheUserIds);
      delete result.cacheUserIds;
    }

    return result;
  } catch (error) {
    logger.error("Transfer failed", {
      senderId,
      receiverEmail,
      amount,
      message: error.message,
    });

    throw error;
  }
};
