import { describe, expect, it } from "vitest";

import {
  authorizePluginOrderWrite,
  authorizePluginGuestAccessInitialization,
  recordPluginOrderCreated,
  pluginStatusFromLifecycle,
  protectPluginOrderLifecycle
} from "./order-lifecycle";

describe("pluginStatusFromLifecycle", () => {
  it("maps the LOSTINSEOUL lifecycle onto the plugin coarse status", () => {
    expect(pluginStatusFromLifecycle("pending_payment")).toBe("pending");
    expect(pluginStatusFromLifecycle("paid")).toBe("processing");
    expect(pluginStatusFromLifecycle("confirmed")).toBe("completed");
    expect(pluginStatusFromLifecycle("converted")).toBe("completed");
    expect(pluginStatusFromLifecycle("canceled")).toBe("cancelled");
    expect(pluginStatusFromLifecycle("failed")).toBe("cancelled");
    expect(pluginStatusFromLifecycle("refunded")).toBe("refunded");
  });
});

describe("protectPluginOrderLifecycle", () => {
  it("initializes guest access once for the actual order created in the same transaction", async () => {
    const req = { transactionID: "transaction" };
    authorizePluginOrderWrite(req);
    const originalDoc = {
      id: "actual-order",
      customer: null,
      guest_access_digest: null,
      lifecycle_status: "pending_payment"
    };
    await recordPluginOrderCreated({
      doc: originalDoc,
      operation: "create",
      req
    } as never);
    authorizePluginGuestAccessInitialization(req, "actual-order");
    await expect(
      protectPluginOrderLifecycle({
        data: { guest_access_digest: "a".repeat(64) },
        originalDoc,
        operation: "update",
        req
      } as never)
    ).resolves.toMatchObject({ guest_access_digest: "a".repeat(64) });
    await expect(
      protectPluginOrderLifecycle({
        data: { guest_access_digest: "b".repeat(64) },
        originalDoc,
        operation: "update",
        req
      } as never)
    ).rejects.toThrow("commerce-snapshot-update-forbidden");
    expect(() =>
      authorizePluginGuestAccessInitialization(req, "actual-order")
    ).toThrow();
  });

  it("rejects initialization outside the original guest creation transaction", async () => {
    const req = { transactionID: "transaction" };
    authorizePluginOrderWrite(req);
    expect(() =>
      authorizePluginGuestAccessInitialization(req, "existing-order")
    ).toThrow();
    await recordPluginOrderCreated({
      doc: { id: "owned-order", customer: "customer" },
      operation: "create",
      req
    } as never);
    expect(() =>
      authorizePluginGuestAccessInitialization(req, "owned-order")
    ).toThrow();
    await recordPluginOrderCreated({
      doc: { id: "guest-order" },
      operation: "create",
      req
    } as never);
    req.transactionID = "other-transaction";
    expect(() =>
      authorizePluginGuestAccessInitialization(req, "guest-order")
    ).toThrow();
  });
  it("does not let ordinary writes mint purchase capabilities or settlement intent", async () => {
    for (const data of [
      { guest_access_digest: "digest" },
      { settlement_effects: { receipt: "pending" } }
    ]) {
      await expect(
        protectPluginOrderLifecycle({
          data,
          operation: "create",
          req: {}
        } as never)
      ).rejects.toThrow("commerce-lifecycle-create-forbidden");
    }
  });
  it("uses the trusted settlement actor even when the HTTP caller is a customer", async () => {
    const req = { user: { id: "customer", role: "user" } };
    authorizePluginOrderWrite(req);
    await expect(
      protectPluginOrderLifecycle({
        data: { lifecycle_status: "paid", payment_status: "paid" },
        originalDoc: {
          lifecycle_status: "pending_payment",
          payment_status: "pending"
        },
        operation: "update",
        req
      } as never)
    ).resolves.toMatchObject({ status: "processing" });
  });
  it("overrides the vendor processing default for unpaid creation", async () => {
    await expect(
      protectPluginOrderLifecycle({
        data: { status: "processing" },
        operation: "create",
        req: {}
      } as never)
    ).resolves.toMatchObject({
      status: "pending",
      lifecycle_status: "pending_payment"
    });
  });
  it("rejects direct plugin status changes and snapshot replacement", async () => {
    for (const data of [
      { status: "completed" },
      { checkout_snapshot: { amount: 1 } }
    ]) {
      await expect(
        protectPluginOrderLifecycle({
          data,
          originalDoc: {
            lifecycle_status: "pending_payment",
            status: "pending",
            checkout_snapshot: { amount: 2 }
          },
          operation: "update",
          req: {}
        } as never)
      ).rejects.toThrow();
    }
  });
  it("rejects unauthenticated lifecycle jumps on plugin orders", async () => {
    await expect(
      protectPluginOrderLifecycle({
        collection: null,
        context: {},
        data: { lifecycle_status: "confirmed" },
        originalDoc: { lifecycle_status: "pending_payment" },
        operation: "update",
        req: {},
        index: undefined
      } as never)
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");
  });

  it("rejects invalid lifecycle transitions even when authorized", async () => {
    const req = { context: { user: { role: "admin" } } };
    const { authorizeCommerceLifecycleRequest } =
      await import("@/lib/lost-commerce/lifecycle-authorization");
    authorizeCommerceLifecycleRequest(req);
    await expect(
      protectPluginOrderLifecycle({
        collection: null,
        context: {},
        data: { lifecycle_status: "converted" },
        originalDoc: { lifecycle_status: "pending_payment" },
        operation: "update",
        req,
        index: undefined
      } as never)
    ).rejects.toThrow("invalid-commerce-transition");
  });
});
