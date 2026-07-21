import { describe, expect, it } from "vitest";

import {
  checkoutCommandFailureAction,
  checkoutCompletionAction,
  checkoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
  parseCheckoutIntentSuccess,
  replaceCheckoutCommandWithPendingPayment
} from "./checkout-idempotency";
import { LOST_PENDING_PAYMENT_STORAGE_KEY } from "@/lib/lost-commerce/payment-recovery";

class MemoryStorage implements Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  serialized(): string {
    return JSON.stringify([...this.values.entries()]);
  }
}

describe("checkout idempotency key", () => {
  it("requires reconciliation for every PortOne SDK result", () => {
    expect(checkoutCompletionAction("portone")).toBe("reconcile");
  });

  it("routes manual orders to a pending state", () => {
    expect(checkoutCompletionAction("manual")).toBe("manual-pending");
  });

  it("retains the key for ambiguous and retryable responses", () => {
    expect(checkoutCommandFailureAction(200, null)).toBe("retain");
    expect(checkoutCommandFailureAction(200, { ok: false })).toBe("retain");
    expect(
      checkoutCommandFailureAction(409, {
        ok: false,
        error: "idempotency-in-progress"
      })
    ).toBe("retain");
    expect(
      checkoutCommandFailureAction(503, {
        ok: false,
        error: "commerce-command-unavailable"
      })
    ).toBe("retain");
  });

  it("clears the key only for a recognized terminal error", () => {
    expect(
      checkoutCommandFailureAction(409, {
        ok: false,
        error: "payment-method-unavailable"
      })
    ).toBe("clear");
    expect(checkoutCommandFailureAction(400, null)).toBe("retain");
  });

  it("accepts only a complete provider-specific success envelope", () => {
    const order = { id: "order-1", order_ref: "lis_order_1" };
    expect(
      parseCheckoutIntentSuccess(
        {
          ok: true,
          order,
          paymentProvider: "portone",
          portone: { storeId: "store-1", paymentId: "lis_order_1" }
        },
        "portone"
      )
    ).toMatchObject({ order, paymentProvider: "portone" });
    expect(
      parseCheckoutIntentSuccess(
        { ok: true, order, paymentProvider: "portone", portone: null },
        "portone"
      )
    ).toBeNull();
    expect(parseCheckoutIntentSuccess({ ok: true }, "manual")).toBeNull();
    expect(
      parseCheckoutIntentSuccess(
        { ok: true, order, paymentProvider: "manual", portone: null },
        "manual"
      )
    ).toMatchObject({ order, paymentProvider: "manual" });
  });

  it("reuses one key for the same serialized command", async () => {
    const storage = new MemoryStorage();
    const body = JSON.stringify({ lines: [{ productId: "p1", quantity: 1 }] });

    const first = await checkoutIdempotencyKey(body, storage);
    const retry = await checkoutIdempotencyKey(body, storage);

    expect(retry).toBe(first);
  });

  it("rotates the key when the command changes without storing request PII", async () => {
    const storage = new MemoryStorage();
    const first = await checkoutIdempotencyKey(
      JSON.stringify({
        contact: { email: "private@example.com" },
        quantity: 1
      }),
      storage
    );
    const changed = await checkoutIdempotencyKey(
      JSON.stringify({
        contact: { email: "private@example.com" },
        quantity: 2
      }),
      storage
    );

    expect(changed).not.toBe(first);
    expect(storage.serialized()).not.toContain("private@example.com");
  });

  it("clears the persisted command after a terminal response", async () => {
    const storage = new MemoryStorage();
    const body = JSON.stringify({ paymentProvider: "manual" });
    const first = await checkoutIdempotencyKey(body, storage);

    clearCheckoutIdempotencyKey(storage);
    const next = await checkoutIdempotencyKey(body, storage);

    expect(next).not.toBe(first);
  });

  it("persists payment recovery before clearing the completed command", async () => {
    const operations: string[] = [];
    const storage = new MemoryStorage();
    const trackedStorage = {
      getItem: storage.getItem.bind(storage),
      setItem(key: string, value: string) {
        operations.push(`set:${key}`);
        storage.setItem(key, value);
      },
      removeItem(key: string) {
        operations.push(`remove:${key}`);
        storage.removeItem(key);
      }
    };
    const body = JSON.stringify({ paymentProvider: "portone" });
    await checkoutIdempotencyKey(body, trackedStorage);
    operations.length = 0;

    replaceCheckoutCommandWithPendingPayment(
      { orderRef: "order-1", paymentId: "payment-1" },
      trackedStorage
    );

    expect(operations).toEqual([
      `set:${LOST_PENDING_PAYMENT_STORAGE_KEY}`,
      "remove:lostinseoul.checkout.command"
    ]);
    expect(storage.getItem(LOST_PENDING_PAYMENT_STORAGE_KEY)).toBe(
      JSON.stringify({ orderRef: "order-1", paymentId: "payment-1" })
    );
  });

  it("retains the command when payment recovery cannot be persisted", async () => {
    const storage = new MemoryStorage();
    const body = JSON.stringify({ paymentProvider: "portone" });
    const commandKey = await checkoutIdempotencyKey(body, storage);
    const failingStorage = {
      getItem: storage.getItem.bind(storage),
      setItem() {
        throw new Error("storage-full");
      },
      removeItem: storage.removeItem.bind(storage)
    };

    expect(() =>
      replaceCheckoutCommandWithPendingPayment(
        { orderRef: "order-1", paymentId: "payment-1" },
        failingStorage
      )
    ).toThrow("storage-full");
    expect(await checkoutIdempotencyKey(body, storage)).toBe(commandKey);
  });
});
