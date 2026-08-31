import { describe, expect, it } from "vitest";

import {
  pluginConfirmOrderRef,
  pluginPortOneClientPayload,
  pluginPortOnePaymentId
} from "./portone-checkout";

describe("plugin PortOne checkout helpers", () => {
  it("reads the client payment payload from initiatePayment", () => {
    const initiated = {
      message: "Payment initiated successfully",
      paymentId: "pay_1234567890abcd",
      transactionID: "txn-1",
      clientPayload: { storeId: "store-1", paymentId: "pay_1234567890abcd" }
    };
    expect(pluginPortOnePaymentId(initiated)).toBe("pay_1234567890abcd");
    expect(pluginPortOneClientPayload(initiated)).toEqual({
      storeId: "store-1",
      paymentId: "pay_1234567890abcd"
    });
  });

  it("rejects initiate results without a client payload", () => {
    expect(pluginPortOneClientPayload({ message: "nope" })).toBeNull();
    expect(pluginPortOnePaymentId(null)).toBeNull();
  });

  it("reads order_ref from confirmOrder and ignores the order UUID", () => {
    expect(
      pluginConfirmOrderRef({
        message: "ok",
        orderID: "order-uuid",
        order_ref: "LIS-1001",
        transactionID: "txn-1"
      })
    ).toBe("LIS-1001");
    expect(
      pluginConfirmOrderRef({
        message: "ok",
        orderID: "order-uuid",
        transactionID: "txn-1"
      })
    ).toBeNull();
  });
});
