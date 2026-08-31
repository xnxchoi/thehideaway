import { describe, expect, it } from "vitest";

import {
  canViewPaidLostOrder,
  productPaymentRecoveryAction,
  productPaymentSubmitAction
} from "./payment-recovery";

describe("productPaymentRecoveryAction", () => {
  it("shows success after authoritative paid reconciliation", () => {
    expect(productPaymentRecoveryAction({ ok: true, status: "paid" })).toBe(
      "success"
    );
  });

  it("does not claim failure when verification is unavailable", () => {
    expect(
      productPaymentRecoveryAction({
        ok: false,
        status: "503",
        reason: "verify-unavailable"
      })
    ).toBe("retry");
  });

  it("shows failure only for an authoritative terminal failure", () => {
    expect(
      productPaymentRecoveryAction({
        ok: false,
        status: "402",
        reason: "payment-failed"
      })
    ).toBe("failure");
  });

  it("reconciles an unresolved attempt instead of creating a new intent", () => {
    expect(
      productPaymentSubmitAction({
        orderRef: "lis_1",
        paymentId: "lis_1",
        customerEmail: "guest@example.com"
      })
    ).toBe("reconcile");
    expect(productPaymentSubmitAction(null)).toBe("create");
  });
});

describe("canViewPaidLostOrder", () => {
  it("lets a guest see a paid order that has no customer account", () => {
    expect(
      canViewPaidLostOrder({
        customer: null,
        paymentStatus: "paid",
        viewerId: null
      })
    ).toBe(true);
  });

  it("lets a signed-in customer see only their paid order", () => {
    expect(
      canViewPaidLostOrder({
        customer: "user-1",
        paymentStatus: "paid",
        viewerId: "user-1"
      })
    ).toBe(true);
    expect(
      canViewPaidLostOrder({
        customer: "user-1",
        paymentStatus: "paid",
        viewerId: "user-2"
      })
    ).toBe(false);
  });

  it("hides unpaid orders and guest views of account orders", () => {
    expect(
      canViewPaidLostOrder({
        customer: null,
        paymentStatus: "processing",
        viewerId: null
      })
    ).toBe(false);
    expect(
      canViewPaidLostOrder({
        customer: "user-1",
        paymentStatus: "paid",
        viewerId: null
      })
    ).toBe(false);
  });
});
