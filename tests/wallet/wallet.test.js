import { describe, expect, it } from "vitest";
import request from "supertest";
import { createAndLogin, depositFunds } from "../helpers/test.helpers.js";
import app from "../../app.js";

describe("GET /api/v1/wallet/details", () => {
  it("Should get the wallet details", async () => {
    const token = await createAndLogin("wallet@axon.com", "password123");
    const url = "/api/v1/wallet/details";
    const response = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("Should not get wallet details for unauthorized user", async () => {
    const url = "/api/v1/wallet/details";
    const response = await request(app).get(url);
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Unauthorized");
  });
});

describe("POST /api/v1/wallet/deposit", () => {
  it("Should allow user to deposit", async () => {
    const token = await createAndLogin("test5@axon.com", "password123");
    const idempotencyKey = crypto.randomUUID();
    const url = "/api/v1/wallet/deposit";

    const response = await depositFunds(token, "1000");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("userId");
    expect(response.body.data).toHaveProperty("walletId");
    expect(response.body.data).toHaveProperty("transactionId");
  });

  it("Should reject unauthorized user to deposit", async () => {
    const url = "/api/v1/wallet/deposit";
    const idempotencyKey = crypto.randomUUID();
    const data = { amount: "1000" };

    const response = await request(app)
      .post(url)
      .set("x-idempotency-key", `${idempotencyKey}`)
      .send(data);
    expect(response.statusCode).toBe(401);
  });

  it("Should require idempotency key", async () => {
    const url = "/api/v1/wallet/deposit";
    const token = await createAndLogin("test6@axon.com", "password123");
    const data = {
      amount: "1000",
    };

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send(data);

    expect(response.statusCode).toBe(400);
  });

  it("Should reject invalid amount", async () => {
    const url = "/api/v1/wallet/deposit";
    const token = await createAndLogin("test7@axon.com", "password123");
    const idempotencyKey = crypto.randomUUID();
    const data = {
      amount: "-500",
    };

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", `${idempotencyKey}`)
      .send(data);
    expect(response.statusCode).toBe(400);
  });

  it("Should reject non numeric amount", async () => {
    const url = "/api/v1/wallet/deposit";
    const token = await createAndLogin("test8@axon.com", "password123");
    const idempotencyKey = crypto.randomUUID();
    const data = {
      amount: "humble",
    };

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", `${idempotencyKey}`)
      .send(data);
    expect(response.statusCode).toBe(400);
  });

  it("Should reject duplicate deposit", async () => {
    const token = await createAndLogin("test9@axon.com", "password123");
    const key = crypto.randomUUID();
    const url = "/api/v1/wallet/deposit";

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        amount: "400",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        amount: "400",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain("already processed");
  });
});

describe("POST /api/v1/wallet/withdraw", () => {
  const url = "/api/v1/wallet/withdraw";
  it("Should allow user to withdraw funds", async () => {
    const token = await createAndLogin("test10@axon.com", "password123");
    const depositKey = crypto.randomUUID();
    const withdrawKey = crypto.randomUUID();

    await request(app)
      .post("/api/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", depositKey)
      .send({
        amount: "1000",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", withdrawKey)
      .send({
        amount: "200",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.balance).toBe("800");
  });

  it("Should reject unauthorized user to withdraw funds", async () => {
    const key = crypto.randomUUID();
    const token = await createAndLogin("token@axon.com", "password123");
    await request(app)
      .post("/api/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        amount: "500",
      });
    const response = await request(app)
      .post(url)
      .set("x-idempotency-key", key)
      .send({
        amount: "200",
      });
    expect(response.statusCode).toBe(401);
  });

  it("Should reject wihdrawals missing the idempotency key", async () => {
    const token = await createAndLogin("test11@gmail.com", "password123");
    const key = crypto.randomUUID();

    await request(app)
      .post("/api/v1/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        amount: "300",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: "200",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("Should reject withdrawal with insufficient funds", async () => {
    const token = await createAndLogin("test@axon.com", "password123");
    const depositkey = crypto.randomUUID();
    const withdrawalkey = crypto.randomUUID();
    const depositUrl = "/api/v1/wallet/deposit";

    await request(app)
      .post(depositUrl)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", depositkey)
      .send({
        amount: "300",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", withdrawalkey)
      .send({
        amount: "1400",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Insufficient funds");
  });

  it("Should reject invalid withdrawal amount", async () => {
    const depositUrl = "/api/v1/wallet/deposit";
    const depositKey = crypto.randomUUID();
    const withdrawkey = crypto.randomUUID();
    const token = await createAndLogin("test12@axon.com", "password123");

    await request(app)
      .post(depositUrl)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", depositKey)
      .send({
        amount: "300",
      });
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", withdrawkey)
      .send({
        amount: "-200",
      });
    expect(response.statusCode).toBe(400);
  });

  it("Should reject duplicate withdrawal", async () => {
    const token = await createAndLogin("test13@axon.com", "password123");
    const depositKey = crypto.randomUUID();
    const withdrawKey = crypto.randomUUID();
    const depositUrl = "/api/v1/wallet/deposit";

    await request(app)
      .post(depositUrl)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", depositKey)
      .send({
        amount: "500",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", withdrawKey)
      .send({
        amount: "300",
      });

    const secondResponse = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", withdrawKey)
      .send({
        amount: "300",
      });

    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body.message).toContain("already processed");
  });
});
