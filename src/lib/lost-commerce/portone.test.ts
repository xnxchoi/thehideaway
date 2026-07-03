import { afterEach, describe, expect, it } from "vitest";
import {
  buildPortOnePaymentPayload,
  generatePortOneSignature,
  isPortOneCheckoutEnabled
} from "./portone";

const OLD_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("PortOne payment payloads", () => {
  it("keeps checkout disabled until PortOne has a complete payment configuration", () => {
    // Master gate on so this test isolates the config-presence dimension.
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";
    delete process.env.PORTONE_CLIENT_KEY;
    delete process.env.PORTONE_SECRET_KEY;
    delete process.env.PORTONE_STORE_ID;
    delete process.env.PORTONE_CHANNEL_KEY;
    delete process.env.PORTONE_DEFAULT_CHANNEL;

    expect(isPortOneCheckoutEnabled()).toBe(false);

    process.env.PORTONE_STORE_ID = "store-test";
    expect(isPortOneCheckoutEnabled()).toBe(false);

    process.env.PORTONE_CHANNEL_KEY = "channel-test";
    expect(isPortOneCheckoutEnabled()).toBe(true);

    delete process.env.PORTONE_CHANNEL_KEY;
    process.env.PORTONE_DEFAULT_CHANNEL = "default-channel";
    expect(isPortOneCheckoutEnabled()).toBe(true);
  });

  it("enables checkout for complete global PortOne credentials", () => {
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";
    delete process.env.PORTONE_STORE_ID;
    delete process.env.PORTONE_CHANNEL_KEY;
    delete process.env.PORTONE_DEFAULT_CHANNEL;

    process.env.PORTONE_CLIENT_KEY = "client";
    expect(isPortOneCheckoutEnabled()).toBe(false);

    process.env.PORTONE_SECRET_KEY = "secret";
    expect(isPortOneCheckoutEnabled()).toBe(true);
  });

  it("keeps card checkout dark unless the master gate is explicitly on", () => {
    // Full, valid config present…
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";

    // …but the master gate is unset → still dark (default-off).
    delete process.env.PORTONE_CARD_CHECKOUT_LIVE;
    expect(isPortOneCheckoutEnabled()).toBe(false);

    // Only exactly "true" opens it.
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "1";
    expect(isPortOneCheckoutEnabled()).toBe(false);
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "TRUE";
    expect(isPortOneCheckoutEnabled()).toBe(false);
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";
    expect(isPortOneCheckoutEnabled()).toBe(true);

    // Gate on but no config → still off (the API's card-unavailable path holds).
    delete process.env.PORTONE_STORE_ID;
    delete process.env.PORTONE_CHANNEL_KEY;
    delete process.env.PORTONE_DEFAULT_CHANNEL;
    delete process.env.PORTONE_CLIENT_KEY;
    delete process.env.PORTONE_SECRET_KEY;
    expect(isPortOneCheckoutEnabled()).toBe(false);
  });

  it("does not treat template placeholders as configured credentials", () => {
    process.env.PORTONE_CARD_CHECKOUT_LIVE = "true";
    process.env.PORTONE_CLIENT_KEY = "CHANGE_ME_API_KEY";
    process.env.PORTONE_SECRET_KEY = "CHANGE_ME_API_KEY";
    process.env.PORTONE_STORE_ID = "CHANGE_ME_API_KEY";
    process.env.PORTONE_CHANNEL_KEY = "CHANGE_ME_API_KEY";

    expect(isPortOneCheckoutEnabled()).toBe(false);
    expect(() =>
      buildPortOnePaymentPayload({
        orderRef: "lis_placeholder",
        amount: 1000,
        currency: "KRW",
        origin: "https://lostinseoul.com"
      })
    ).toThrow("portone-not-configured");
  });

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

  it("builds a PortOne V2 redirect payload when Store ID is configured", () => {
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";

    const payload = buildPortOnePaymentPayload({
      orderRef: "lis_2",
      amount: 120000,
      currency: "KRW",
      origin: "https://lostinseoul.com",
      orderName: "LOSTINSEOUL Print",
      products: [
        {
          id: "product-1:variant-1",
          name: "LOSTINSEOUL Print / Framed",
          amount: 120000,
          quantity: 1,
          link: "https://lostinseoul.com/products/print"
        }
      ]
    });

    expect(payload).toMatchObject({
      storeId: "store-test",
      channelKey: "channel-test",
      paymentId: "lis_2",
      orderName: "LOSTINSEOUL Print",
      totalAmount: 120000,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
      redirectUrl: "https://lostinseoul.com/payment/return?order=lis_2",
      forceRedirect: true,
      noticeUrls: ["https://lostinseoul.com/api/lost/webhooks/portone"],
      products: [
        {
          id: "product-1:variant-1",
          name: "LOSTINSEOUL Print / Framed",
          amount: 120000,
          quantity: 1,
          link: "https://lostinseoul.com/products/print"
        }
      ],
      productType: "PRODUCT_TYPE_REAL",
      customData: {
        orderRef: "lis_2",
        service: "lostinseoul"
      }
    });
  });

  it("adds a fallback product for V2 payloads without line details", () => {
    process.env.PORTONE_STORE_ID = "store-test";
    process.env.PORTONE_CHANNEL_KEY = "channel-test";

    const payload = buildPortOnePaymentPayload({
      orderRef: "lis_3",
      amount: 55000,
      currency: "KRW",
      origin: "https://lostinseoul.com",
      orderName: "LOSTINSEOUL order"
    });

    expect(payload).toMatchObject({
      products: [
        {
          id: "lis_3",
          name: "LOSTINSEOUL order",
          amount: 55000,
          quantity: 1
        }
      ]
    });
  });
});
