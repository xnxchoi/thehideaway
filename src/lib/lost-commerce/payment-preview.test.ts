import { describe, expect, it } from "vitest";
import {
  isLostCommercePaymentPreviewEnabled,
  isLostCommercePaymentUiEnabled,
  shouldExecuteLostCommercePayment
} from "./payment-preview";

describe("LOSTINSEOUL payment preview", () => {
  it("enables payment UI previews only in development", () => {
    expect(
      isLostCommercePaymentPreviewEnabled({ NODE_ENV: "development" })
    ).toBe(true);
    expect(isLostCommercePaymentPreviewEnabled({ NODE_ENV: "test" })).toBe(
      false
    );
    expect(
      isLostCommercePaymentPreviewEnabled({ NODE_ENV: "production" })
    ).toBe(false);
  });

  it("renders payment UI when a provider is configured or preview mode is on", () => {
    expect(
      isLostCommercePaymentUiEnabled({
        configured: false,
        previewEnabled: true
      })
    ).toBe(true);
    expect(
      isLostCommercePaymentUiEnabled({
        configured: true,
        previewEnabled: false
      })
    ).toBe(true);
    expect(
      isLostCommercePaymentUiEnabled({
        configured: false,
        previewEnabled: false
      })
    ).toBe(false);
  });

  it("does not execute an unconfigured card payment from preview UI", () => {
    expect(
      shouldExecuteLostCommercePayment({
        paymentPreviewEnabled: true,
        paymentProvider: "portone",
        portOneEnabled: false
      })
    ).toBe(false);
    expect(
      shouldExecuteLostCommercePayment({
        paymentPreviewEnabled: true,
        paymentProvider: "portone",
        portOneEnabled: true
      })
    ).toBe(true);
    expect(
      shouldExecuteLostCommercePayment({
        paymentPreviewEnabled: true,
        paymentProvider: "manual",
        portOneEnabled: false
      })
    ).toBe(true);
  });
});
