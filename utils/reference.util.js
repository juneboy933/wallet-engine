import crypto from "crypto";

export const generateReference = (prefix = "TXN") => {
  const timestamp = Date.now();
  const reference = `${prefix}-${timestamp}-${crypto.randomUUID()}`;
  return reference;
};
