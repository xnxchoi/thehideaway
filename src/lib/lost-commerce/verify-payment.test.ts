import { describe, expect, it } from "vitest";
import {
  verifyPortOnePayment,
  type PortOnePaymentRecord,
  type VerifyExpectation
} from "./verify-payment";

const baseExpectation: VerifyExpectation = {
  amount: 120000,
  currency: "KRW",
  requireLiveChannel: true
};

const paidRecord = (
  overrides: Partial<PortOnePaymentRecord> = {}
): PortOnePaymentRecord => ({
  status: "PAID",
  amount: { total: 120000 },
  currency: "KRW",
  channel: { type: "LIVE" },
  transactionId: "txn_abc",
  ...overrides
});

describe("verifyPortOnePayment", () => {
  it("accepts a paid, amount-matching, currency-matching live payment", () => {
    const result = verifyPortOnePayment(paidRecord(), baseExpectation);
    expect(result).toEqual({ ok: true, transactionRef: "txn_abc" });
  });

  it("accepts CURRENCY_-prefixed currency codes", () => {
    const result = verifyPortOnePayment(
      paidRecord({ currency: "CURRENCY_KRW" }),
      baseExpectation
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a non-paid status", () => {
    const result = verifyPortOnePayment(
      paidRecord({ status: "READY" }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "not-paid" });
  });

  it("rejects an amount mismatch (undercharge attack)", () => {
    const result = verifyPortOnePayment(
      paidRecord({ amount: { total: 1000 } }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "amount-mismatch" });
  });

  it("rejects a currency mismatch", () => {
    const result = verifyPortOnePayment(
      paidRecord({ currency: "USD" }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "currency-mismatch" });
  });

  it("rejects a TEST-channel payment when live channel is required", () => {
    const result = verifyPortOnePayment(
      paidRecord({ channel: { type: "TEST" } }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "test-channel-rejected" });
  });

  it("fails CLOSED in production when the channel field is absent", () => {
    const result = verifyPortOnePayment(
      paidRecord({ channel: null }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "test-channel-rejected" });
  });

  it("fails CLOSED in production for an unknown / misnamed channel type", () => {
    const result = verifyPortOnePayment(
      paidRecord({ channel: { type: "PRODUCTION" } }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "test-channel-rejected" });
  });

  it("accepts an explicit LIVE channel in production", () => {
    const result = verifyPortOnePayment(
      paidRecord({ channel: { type: "LIVE" } }),
      baseExpectation
    );
    expect(result.ok).toBe(true);
  });

  it("allows a TEST-channel payment when live channel is not required (sandbox)", () => {
    const result = verifyPortOnePayment(
      paidRecord({ channel: { type: "TEST" } }),
      {
        ...baseExpectation,
        requireLiveChannel: false
      }
    );
    expect(result.ok).toBe(true);
  });

  it("allows an absent channel in sandbox (dev flows keep working)", () => {
    const result = verifyPortOnePayment(paidRecord({ channel: null }), {
      ...baseExpectation,
      requireLiveChannel: false
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an underpayment — settled amount.paid below the expected total", () => {
    const result = verifyPortOnePayment(
      paidRecord({ amount: { total: 120000, paid: 1000 } }),
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "amount-mismatch" });
  });

  it("accepts when amount.paid equals the expected total", () => {
    const result = verifyPortOnePayment(
      paidRecord({ amount: { total: 120000, paid: 120000 } }),
      baseExpectation
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a malformed record (missing amount)", () => {
    const result = verifyPortOnePayment(
      { status: "PAID", currency: "KRW" },
      baseExpectation
    );
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects null / undefined records", () => {
    expect(verifyPortOnePayment(null, baseExpectation)).toEqual({
      ok: false,
      reason: "malformed"
    });
    expect(verifyPortOnePayment(undefined, baseExpectation)).toEqual({
      ok: false,
      reason: "malformed"
    });
  });

  it("falls back to paymentId / id for the transaction ref", () => {
    const result = verifyPortOnePayment(
      paidRecord({ transactionId: undefined, id: "pay_1" }),
      baseExpectation
    );
    expect(result).toEqual({ ok: true, transactionRef: "pay_1" });
  });
});
