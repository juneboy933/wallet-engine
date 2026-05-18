import Decimal from "decimal.js";
import z from "zod";

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

export const transferSchema = z.object({
  receiverEmail: z.string().trim().toLowerCase().email(),
  amount: amountString,
});
