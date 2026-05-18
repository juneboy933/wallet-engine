import env from "../config/schema.config.js";
import jwt from "jsonwebtoken";

const secretKey = env.JWT_SECRET;

export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
  return token;
};

export const verifyToken = (token) => {
  const decoded = jwt.verify(token, secretKey);
  return decoded;
};
