import z from "zod";
import Decimal from "decimal.js";

const amountString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places")
  .refine((val) => {
    try {
      const amount = new Decimal(val);
      return amount.greaterThan(0) && amount.lessThanOrEqualTo("1000000000");
    } catch {
      return false;
    }
  }, "Amount must be a valid positive number");

export const amountSchema = z.object({
  amount: amountString,
});

export const transactionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  type: z.enum(["DEPOSIT", "WITHDRAW", "TRANSFER"]).optional(),
});
