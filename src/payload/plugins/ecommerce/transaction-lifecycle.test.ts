import { describe, expect, it } from "vitest";
import {
  authorizePluginTransactionWrite,
  protectPluginTransaction
} from "./transaction-lifecycle";

describe("transaction attempt protection", () => {
  it("rejects forged successful creation", async () => {
    await expect(
      protectPluginTransaction({
        data: { status: "succeeded" },
        operation: "create",
        req: {}
      } as never)
    ).rejects.toThrow("commerce-transaction-write-forbidden");
  });
  it("rejects direct status and provider outcome updates", async () => {
    for (const data of [
      { status: "succeeded" },
      { provider_outcome: { status: "PAID" } }
    ]) {
      await expect(
        protectPluginTransaction({
          data,
          originalDoc: { status: "pending" },
          operation: "update",
          req: {}
        } as never)
      ).rejects.toThrow("commerce-transaction-write-forbidden");
    }
  });
  it("keeps attempt identity immutable even for authorized settlement", async () => {
    const req = {};
    authorizePluginTransactionWrite(req);
    for (const data of [
      { checkout_fingerprint: "changed" },
      { portone: { paymentId: "other" } }
    ]) {
      await expect(
        protectPluginTransaction({
          data,
          originalDoc: {
            checkout_fingerprint: "original",
            portone: { paymentId: "payment" }
          },
          operation: "update",
          req
        } as never)
      ).rejects.toThrow("commerce-snapshot-update-forbidden");
    }
  });
  it("allows trusted provider status and transaction reference updates", async () => {
    const req = {};
    authorizePluginTransactionWrite(req);
    const data = {
      status: "succeeded",
      portone: { paymentId: "payment", transactionId: "transaction" }
    };
    await expect(
      protectPluginTransaction({
        data,
        originalDoc: { status: "pending", portone: { paymentId: "payment" } },
        operation: "update",
        req
      } as never)
    ).resolves.toEqual(data);
  });
});
