import { describe, expect, it } from "vitest";

import {
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
      productPaymentSubmitAction({ orderRef: "lis_1", paymentId: "lis_1" })
    ).toBe("reconcile");
    expect(productPaymentSubmitAction(null)).toBe("create");
  });
});
