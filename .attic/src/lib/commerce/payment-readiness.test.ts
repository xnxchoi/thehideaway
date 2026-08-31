import { describe, expect, it } from "vitest";

import { isMinimalCommerceCardReady } from "./payment-readiness";

const completeConfig = {
  key: "",
  secret: "",
  apiSecret: "api-secret",
  webhookSecret: "whsec_abcdefghijklmnopqrstuvwxyz123456",
  apiJwt: "",
  storeId: "store-test",
  channelKey: "channel-test",
  environment: "sandbox" as const,
  defaultChannel: undefined,
  defaultMethod: undefined,
  cardCheckoutLive: true
};

describe("minimal commerce card readiness", () => {
  it("requires the V2 API and webhook configuration", () => {
    expect(isMinimalCommerceCardReady(completeConfig, "development")).toBe(
      true
    );
    expect(
      isMinimalCommerceCardReady(
        { ...completeConfig, apiSecret: "" },
        "development"
      )
    ).toBe(false);
    expect(
      isMinimalCommerceCardReady(
        { ...completeConfig, webhookSecret: "too-short" },
        "development"
      )
    ).toBe(false);
  });

  it("does not accept the incompatible global SDK configuration", () => {
    expect(
      isMinimalCommerceCardReady(
        {
          ...completeConfig,
          apiSecret: "",
          webhookSecret: "",
          storeId: undefined,
          channelKey: undefined,
          key: "global-key",
          secret: "global-secret"
        },
        "development"
      )
    ).toBe(false);
  });

  it("requires the explicit gate and live provider mode in production", () => {
    expect(
      isMinimalCommerceCardReady(
        { ...completeConfig, cardCheckoutLive: false },
        "development"
      )
    ).toBe(false);
    expect(isMinimalCommerceCardReady(completeConfig, "production")).toBe(
      false
    );
    expect(
      isMinimalCommerceCardReady(
        { ...completeConfig, environment: "live" },
        "production"
      )
    ).toBe(true);
  });
});
