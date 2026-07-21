import { afterEach, describe, expect, it } from "vitest";

import { isManualPaymentEnabled } from "./payment-methods";

const originalValue = process.env.LOST_MANUAL_PAYMENT_LIVE;

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env.LOST_MANUAL_PAYMENT_LIVE;
  } else {
    process.env.LOST_MANUAL_PAYMENT_LIVE = originalValue;
  }
});

describe("manual payment gate", () => {
  it("is disabled unless explicitly enabled", () => {
    delete process.env.LOST_MANUAL_PAYMENT_LIVE;
    expect(isManualPaymentEnabled()).toBe(false);

    process.env.LOST_MANUAL_PAYMENT_LIVE = "1";
    expect(isManualPaymentEnabled()).toBe(false);

    process.env.LOST_MANUAL_PAYMENT_LIVE = "TRUE";
    expect(isManualPaymentEnabled()).toBe(false);
  });

  it("accepts only the explicit live value", () => {
    process.env.LOST_MANUAL_PAYMENT_LIVE = "true";
    expect(isManualPaymentEnabled()).toBe(true);
  });
});
