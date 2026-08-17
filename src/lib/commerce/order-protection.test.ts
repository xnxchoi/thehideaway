import { describe, expect, it } from "vitest";

import {
  authorizeCommerceOrderMutation,
  protectCommerceOrder
} from "./order-protection";

function hookArgs(input: {
  data: Record<string, unknown>;
  originalDoc?: Record<string, unknown>;
  operation: "create" | "update";
  req?: object;
}) {
  return {
    collection: {} as never,
    context: {},
    data: input.data,
    operation: input.operation,
    originalDoc: input.originalDoc,
    req: (input.req ?? {}) as never
  } as never;
}

describe("commerce order protection", () => {
  it("rejects immutable order fact changes", async () => {
    await expect(
      protectCommerceOrder(
        hookArgs({
          operation: "update",
          data: { quantity: 2 },
          originalDoc: { quantity: 1 }
        })
      )
    ).rejects.toThrow("commerce-order-facts-immutable");
  });

  it("rejects untrusted lifecycle changes", async () => {
    await expect(
      protectCommerceOrder(
        hookArgs({
          operation: "update",
          data: { status: "paid" },
          originalDoc: { status: "awaiting_payment" }
        })
      )
    ).rejects.toThrow("commerce-order-mutation-forbidden");
  });

  it("allows an authorized valid lifecycle change", async () => {
    const req = {};
    authorizeCommerceOrderMutation(req);

    await expect(
      protectCommerceOrder(
        hookArgs({
          req,
          operation: "update",
          data: { status: "paid", payment_status: "paid" },
          originalDoc: {
            status: "awaiting_payment",
            payment_status: "pending"
          }
        })
      )
    ).resolves.toEqual({ status: "paid", payment_status: "paid" });
  });

  it("rejects an authorized invalid order transition", async () => {
    const req = {};
    authorizeCommerceOrderMutation(req);

    await expect(
      protectCommerceOrder(
        hookArgs({
          req,
          operation: "update",
          data: { status: "completed" },
          originalDoc: { status: "awaiting_payment" }
        })
      )
    ).rejects.toThrow("invalid-order-transition");
  });

  it("rejects financially inconsistent lifecycle states", async () => {
    const req = {};
    authorizeCommerceOrderMutation(req);

    await expect(
      protectCommerceOrder(
        hookArgs({
          req,
          operation: "update",
          data: { payment_status: "paid" },
          originalDoc: {
            status: "awaiting_payment",
            payment_status: "pending"
          }
        })
      )
    ).rejects.toThrow("commerce-order-state-inconsistent");
  });

  it("only allows pending initial lifecycle state", async () => {
    await expect(
      protectCommerceOrder(
        hookArgs({
          operation: "create",
          data: { status: "paid", payment_status: "paid" }
        })
      )
    ).rejects.toThrow("commerce-order-initial-state-forbidden");
  });
});
