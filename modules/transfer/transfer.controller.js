import { transferFunds } from "./transfer.service.js";
import { transferSchema } from "./transfer.validation.js";

export const transfer = async (req, res) => {
  const userId = req.user.userId;
  const idempotencyKey = req.idempotencyKey;
  const validation = transferSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }

  const { receiverEmail, amount } = validation.data;
  const result = await transferFunds(
    userId,
    receiverEmail,
    amount,
    idempotencyKey,
  );
  if (result.status === "ALREADY_PROCESSED") {
    return res.status(200).json({
      success: true,
      message: "Transfer already processed",
      data: result,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Transfer processed successfully",
    data: result,
  });
};
