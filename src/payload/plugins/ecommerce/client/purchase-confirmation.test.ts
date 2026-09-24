import { describe, expect, it, vi } from "vitest";
import {
  confirmPurchase,
  markPurchaseRetryable,
  readPendingPurchaseForViewer,
  readPurchasePayment,
  rememberPurchasePayment,
  checkoutErrorKey,
  purchasePaymentFromInitiation
} from "./purchase-confirmation";

const payment = {
  orderRef: "LIS-1001",
  paymentId: "pay-1",
  cartID: "original-cart",
  purchaseAccessToken: "guest-capability"
};
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    }
  };
}
describe("purchase confirmation", () => {
  it("retains purchase authority across a changed cart without email identity", async () => {
    const store = storage();
    rememberPurchasePayment(payment, store);
    const restored = readPurchasePayment(undefined, store);
    const officialConfirm = vi.fn().mockResolvedValue({
      order_ref: payment.orderRef,
      paymentStatus: "paid"
    });
    await expect(
      confirmPurchase(restored!, {
        currentCartID: "merged-cart",
        officialConfirm
      })
    ).resolves.toMatchObject({ paymentStatus: "paid" });
    expect(officialConfirm).toHaveBeenCalledWith("portone", {
      additionalData: {
        paymentId: payment.paymentId,
        cartID: payment.cartID,
        purchaseAccessToken: payment.purchaseAccessToken
      }
    });
  });
  it("uses the registered endpoint when the current cart is gone", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ order_ref: payment.orderRef, paymentStatus: "paid" })
        )
      );
    await confirmPurchase(payment, { fetcher });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/payments/portone/confirm-order",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          paymentId: payment.paymentId,
          cartID: payment.cartID,
          purchaseAccessToken: payment.purchaseAccessToken
        })
      })
    );
  });
  it("does not infer paid from an order reference or reconciliation mismatch", async () => {
    await expect(
      confirmPurchase(payment, {
        fetcher: vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ order_ref: payment.orderRef }))
          )
      })
    ).rejects.toThrow();
    const result = await confirmPurchase(payment, {
      fetcher: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            order_ref: payment.orderRef,
            paymentStatus: "paid",
            reconciliationRequired: true
          })
        )
      )
    });
    expect(result.reconciliationRequired).toBe(true);
  });
  it("rejects missing or unrelated browser proof and tolerates inaccessible storage", () => {
    const store = storage();
    rememberPurchasePayment(payment, store);
    expect(readPurchasePayment("another-order", store)).toBeNull();
    expect(
      readPurchasePayment(undefined, {
        ...store,
        getItem: () => {
          throw new Error("denied");
        }
      })
    ).toBeNull();
  });
  it("requires the server-issued purchase identity before launching the SDK", () => {
    expect(
      purchasePaymentFromInitiation({ paymentId: "pay-1" }, "cart-1")
    ).toBeNull();
    expect(
      purchasePaymentFromInitiation(
        {
          paymentId: "pay-1",
          order_ref: "LIS-1",
          purchaseAccessToken: "token"
        },
        "cart-1"
      )
    ).toEqual({
      paymentId: "pay-1",
      orderRef: "LIS-1",
      cartID: "cart-1",
      purchaseAccessToken: "token"
    });
  });
  it("maps machine errors to translation keys without exposing response text", () => {
    expect(
      checkoutErrorKey(
        new Error(JSON.stringify({ error: "checkout-total-changed" }))
      )
    ).toBe("totalChanged");
    expect(
      checkoutErrorKey(new Error("provider secret internal failure"))
    ).toBe("failed");
  });
  it("uses the purchase cart returned by the server across cart hydration changes", () => {
    expect(
      purchasePaymentFromInitiation(
        { paymentId: "pay-1", order_ref: "LIS-1", cartID: "server-cart" },
        "stale-cart"
      )?.cartID
    ).toBe("server-cart");
  });
  it("preserves newer B when delayed terminal A finishes", async () => {
    const store = storage();
    rememberPurchasePayment(payment, store);
    let resolve!: (value: Response) => void;
    const response = new Promise<Response>((done) => {
      resolve = done;
    });
    const completion = confirmPurchase(payment, {
      fetcher: vi.fn(() => response)
    }).then(() => markPurchaseRetryable(payment, store));
    const newer = { ...payment, paymentId: "pay-B", orderRef: "LIS-B" };
    rememberPurchasePayment(newer, store);
    resolve(
      new Response(
        JSON.stringify({
          order_ref: payment.orderRef,
          paymentStatus: "pending",
          attemptStatus: "cancelled"
        })
      )
    );
    await completion;
    expect(readPurchasePayment(undefined, store)).toEqual(newer);
    expect(readPendingPurchaseForViewer(null, store)).toEqual(newer);
  });
  it("scopes authenticated pending purchases while retaining each account's recovery", () => {
    const store = storage();
    const alice = {
      orderRef: "LIS-A",
      paymentId: "pay-A",
      cartID: "cart-A",
      customerID: "alice"
    };
    rememberPurchasePayment(alice, store);
    expect(readPendingPurchaseForViewer("bob", store)).toBeNull();
    expect(readPendingPurchaseForViewer(null, store)).toBeNull();
    const bob = {
      ...alice,
      orderRef: "LIS-B",
      paymentId: "pay-B",
      cartID: "cart-B",
      customerID: "bob"
    };
    rememberPurchasePayment(bob, store);
    expect(readPendingPurchaseForViewer("alice", store)).toEqual(alice);
    expect(readPendingPurchaseForViewer("bob", store)).toEqual(bob);
  });
  it("preserves guest purchase capability through login", () => {
    const store = storage();
    rememberPurchasePayment(payment, store);
    expect(readPendingPurchaseForViewer("alice", store)).toEqual(payment);
  });
  it("prioritizes the latest guest attempt over an older account retry marker after login", () => {
    const store = storage();
    const own = {
      orderRef: "LIS-A",
      paymentId: "pay-A",
      cartID: "cart-A",
      customerID: "alice"
    };
    rememberPurchasePayment(own, store);
    markPurchaseRetryable(own, store);
    rememberPurchasePayment(payment, store);
    expect(readPendingPurchaseForViewer("alice", store)).toEqual(payment);
  });
  it("resolves the SDK order=paymentId callback even after a newer purchase starts", () => {
    const store = storage();
    rememberPurchasePayment(payment, store);
    rememberPurchasePayment(
      { ...payment, orderRef: "LIS-B", paymentId: "pay-B" },
      store
    );
    expect(readPurchasePayment(payment.paymentId, store)).toEqual(payment);
  });
});

describe("checkout shipping errors", () => {
  it.each([
    ["shipping-address-required", "shippingAddressRequired"],
    ["invalid-shipping-address", "invalidShippingAddress"],
    ["unsupported-shipping-country", "unsupportedShippingCountry"]
  ])("maps %s without exposing raw errors", (code, key) => {
    expect(checkoutErrorKey(new Error(code))).toBe(key);
    expect(
      checkoutErrorKey(
        new Error(JSON.stringify({ code, message: "Invalid address" }))
      )
    ).toBe(key);
    expect(checkoutErrorKey(new Error(JSON.stringify({ error: code })))).toBe(
      key
    );
  });
});
