import request from "supertest";
import app from "../../app.js";

export const createAndLogin = async (email, password) => {
  await request(app).post("/api/v1/auth/register").send({
    email,
    password,
  });

  const response = await request(app).post("/api/v1/auth/login").send({
    email,
    password,
  });
  return response.body.data.token;
};

export const depositFunds = async (token, amount) => {
  const response = await request(app)
    .post("/api/v1/wallet/deposit")
    .set("Authorization", `Bearer ${token}`)
    .set("x-idempotency-key", crypto.randomUUID())
    .send({
      amount: amount,
    });
  return response;
};
