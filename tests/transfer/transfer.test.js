import { describe, expect, it } from "vitest";
import { createAndLogin, depositFunds } from "../helpers/test.helpers.js";
import request from "supertest";
import app from "../../app.js";

describe("POST /api/v1/transfer", () => {
  const url = "/api/v1/transfer";
  it("Should allow transfer of funds", async () => {
    const token = await createAndLogin("test4@axon.com", "password123");
    // Receiver
    await createAndLogin("receiver@axon.com", "password123");

    // Deposit
    await depositFunds(token, "1000");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiver@axon.com",
        amount: "300",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.balance).toBe("700");

    expect(response.body.data).toHaveProperty("transactionId");
    expect(response.body.data).toHaveProperty("sentBy");
    expect(response.body.data).toHaveProperty("receivedBy");
  });

  it("Should reject unauthorized user to transfer funds", async () => {
    await createAndLogin("receiver@axon.com", "password123");
    const response = await request(app)
      .post(url)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiver@axon.com",
        amount: "300",
      });
    expect(response.statusCode).toBe(401);
  });

  it("Should require idempotency key", async () => {
    const token = await createAndLogin("transfer1@axon.com", "password123");
    await createAndLogin("receiver1@axon.com", "password123");
    await depositFunds(token, "1000");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        receiverEmail: "receiver1@axon.com",
        amount: "400",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("Should reject insufficient funds", async () => {
    const token = await createAndLogin("transfer2@axon.com", "password123");
    await createAndLogin("receiver2@axon.com", "password123");
    await depositFunds(token, "600");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiver2@axon.com",
        amount: "700",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("Should reject invalid amount", async () => {
    const token = await createAndLogin("transfer3@axon.com", "password123");
    await createAndLogin("receiver3@axon.com", "password123");
    await depositFunds(token, "300");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiver3@axon.com",
        amount: "-200",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("Should reject non numeric amount", async () => {
    const token = await createAndLogin("transfer4@axon.com", "password123");
    await createAndLogin("receiver4@axon.com", "password123");
    await depositFunds(token, "100");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiver4@axon.com",
        amount: "humble",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("Should reject self transfer", async () => {
    const token = await createAndLogin("selfaccount@axon.com", "password123");
    await depositFunds(token, "400");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "selfaccount@axon.com",
        amount: "200",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain("yourself");
  });

  it("Should reject transfer to non existing receiver", async () => {
    const token = await createAndLogin("transfer5@axon.com", "password123");
    await depositFunds(token, "500");
    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "missingemail@axon.com",
        amount: "200",
      });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain("Receiver not found");
  });

  it("Should not process duplicate transfer twice", async () => {
    const token = await createAndLogin("transfer@axon.com", "password123");
    await depositFunds(token, "1000");
    const key = crypto.randomUUID();
    await createAndLogin("duplicate@axon.com", "password123");

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        receiverEmail: "duplicate@axon.com",
        amount: "200",
      });

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({
        receiverEmail: "duplicate@axon.com",
        amount: "200",
      });

    const walletResponse = await request(app)
      .get("/api/v1/wallet/details")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain("already processed");
    expect(walletResponse.body.data.balance).toBe("800");
  });

  it("Should credit receiver wallet after transfer", async () => {
    const senderToken = await createAndLogin("sender1@axon.com", "password123");
    const receiverToken = await createAndLogin(
      "receiverbalance@axon.com",
      "password123",
    );
    await depositFunds(senderToken, "1000");
    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${senderToken}`)
      .set("x-idempotency-key", crypto.randomUUID())
      .send({
        receiverEmail: "receiverbalance@axon.com",
        amount: "300",
      });
    const walletResponse = await request(app)
      .get("/api/v1/wallet/details")
      .set("Authorization", `Bearer ${receiverToken}`);
    expect(walletResponse.statusCode).toBe(200);
    expect(walletResponse.body.data.balance).toBe("300");
  });
});
