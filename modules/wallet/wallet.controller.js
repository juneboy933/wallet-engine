import Decimal from "decimal.js";
import {
  deposit,
  getTransactionHistory,
  getWallet,
  withdraw,
} from "./wallet.service.js";
import { amountSchema, transactionSchema } from "./wallet.validation.js";

export const wallet = async (req, res) => {
  const userId = req.user.userId;
  const wallet = await getWallet(userId);
  res.status(200).json({
    success: true,
    data: wallet,
  });
};

export const depositFunds = async (req, res) => {
  const userId = req.user.userId;
  const idempotencyKey = req.idempotencyKey;

  const validation = amountSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }
  const amount = new Decimal(validation.data.amount);
  const result = await deposit(userId, amount, idempotencyKey);
  if (result.status === "ALREADY_PROCESSED") {
    return res.status(200).json({
      success: true,
      message: "Deposit already processed",
      data: {
        transactionId: result.transactionId,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "Deposit successful",
    data: {
      userId,
      amount,
      walletId: result.walletId,
      transactionId: result.transactionRecordId,
      balance: result.newBalance,
    },
  });
};

export const withdrawFunds = async (req, res) => {
  const userId = req.user.userId;
  const idempotencyKey = req.idempotencyKey;

  const validation = amountSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }

  const amount = new Decimal(validation.data.amount);
  const result = await withdraw(userId, amount, idempotencyKey);
  if (result.status === "ALREADY_PROCESSED") {
    return res.status(200).json({
      success: true,
      message: "Withdrawal already processed",
      data: {
        transactionId: result.transactionId,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "Withdrawal successful",
    data: {
      userId,
      amount,
      walletId: result.walletId,
      transactionId: result.transactionId,
      balance: result.newBalance,
    },
  });
};

export const getTransactions = async (req, res) => {
  const userId = req.user.userId;
  const validation = transactionSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }

  const { page, limit, type } = validation.data;
  const result = await getTransactionHistory(userId, page, limit, type);
  return res.status(200).json({
    success: true,
    data: result,
  });
};
