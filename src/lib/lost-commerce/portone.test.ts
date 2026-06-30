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
    delete process.env.PORTONE_STORE_ID;
    delete process.env.PORTONE_CHANNEL_KEY;
    delete process.env.PORTONE_DEFAULT_CHANNEL;

    process.env.PORTONE_CLIENT_KEY = "client";
    expect(isPortOneCheckoutEnabled()).toBe(false);

    process.env.PORTONE_SECRET_KEY = "secret";
    expect(isPortOneCheckoutEnabled()).toBe(true);
  });

  it("does not treat template placeholders as configured credentials", () => {
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
