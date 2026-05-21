import express from "express";
import {
  depositFunds,
  getTransactions,
  wallet,
  withdrawFunds,
} from "./wallet.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../../middlewares/idempotencyKey.middleware.js";
import { asyncHandler } from "../../middlewares/async.middleware.js";
import { moneyRateLimiter } from "../../middlewares/rate-limit.middleware.js";

const router = express.Router();

router.get("/details", authMiddleware, asyncHandler(wallet));
router.get("/transactions", authMiddleware, asyncHandler(getTransactions));

router.post(
  "/deposit",
  authMiddleware,
  idempotencyMiddleware,
  moneyRateLimiter,
  asyncHandler(depositFunds),
);
router.post(
  "/withdraw",
  authMiddleware,
  idempotencyMiddleware,
  moneyRateLimiter,
  asyncHandler(withdrawFunds),
);

export default router;
