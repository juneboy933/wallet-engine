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

const router = express.Router();

router.get("/details", authMiddleware, asyncHandler(wallet));
router.get("/transactions", authMiddleware, asyncHandler(getTransactions));

router.post(
  "/deposit",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(depositFunds),
);
router.post(
  "/withdraw",
  authMiddleware,
  idempotencyMiddleware,
  asyncHandler(withdrawFunds),
);

export default router;
