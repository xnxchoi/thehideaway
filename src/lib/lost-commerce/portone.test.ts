import { afterEach, describe, expect, it } from "vitest";
import {
  buildPortOnePaymentPayload,
  generatePortOneSignature
} from "./portone";

const OLD_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("PortOne payment payloads", () => {
  it("signs stable payment request fields", () => {
    const first = generatePortOneSignature({
      clientKey: "client",
      secret: "secret",
      amount: 1000,
      currency: "KRW",
      merchantOrderId: "lis_1",
      successUrl: "https://lostinseoul.com/payment/success",
      failureUrl: "https://lostinseoul.com/payment/failure"
    });
    const second = generatePortOneSignature({
      clientKey: "client",
      secret: "secret",
      amount: 1000,
      currency: "KRW",
      merchantOrderId: "lis_1",
      successUrl: "https://lostinseoul.com/payment/success",
      failureUrl: "https://lostinseoul.com/payment/failure"
    });

    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(20);
  });

  it("uses clean lostinseoul.com callback paths", () => {
    process.env.PORTONE_CLIENT_KEY = "client";
    process.env.PORTONE_SECRET_KEY = "secret";
    const payload = buildPortOnePaymentPayload({
      orderRef: "lis_1",
      amount: 1000,
      currency: "KRW",
      origin: "https://lostinseoul.com"
    });

    expect(payload.success_url).toBe(
      "https://lostinseoul.com/payment/success?order=lis_1"
    );
    expect(payload.failure_url).toBe(
      "https://lostinseoul.com/payment/failure?order=lis_1"
    );
  });
});
