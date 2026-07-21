import { describe, expect, it } from "vitest";

import {
  authorizeCommerceLifecycleRequest,
  protectCampaignLifecycle,
  protectOrderLifecycle,
  protectPaymentLifecycle
} from "./lifecycle-authorization";

function hookArgs(input: {
  data: Record<string, unknown>;
  originalDoc?: Record<string, unknown>;
  operation?: "create" | "update";
  req?: object;
}) {
  return {
    collection: null,
    context: {},
    data: input.data,
    originalDoc: input.originalDoc,
    operation: input.operation ?? "update",
    req: input.req ?? {},
    index: undefined
  } as never;
}

describe("commerce lifecycle authorization", () => {
  it("rejects generic order lifecycle updates", async () => {
    await expect(
      protectOrderLifecycle(
        hookArgs({
          data: { status: "confirmed" },
          originalDoc: { status: "pending_payment" }
        })
      )
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");
  });

  it("allows lifecycle updates issued by a guarded service", async () => {
    const req = {};
    authorizeCommerceLifecycleRequest(req);

    await expect(
      protectOrderLifecycle(
        hookArgs({
          req,
          data: { status: "confirmed", payment_status: "paid" },
          originalDoc: {
            status: "pending_payment",
            payment_status: "pending"
          }
        })
      )
    ).resolves.toMatchObject({ status: "confirmed", payment_status: "paid" });
  });

  it("allows creates and unrelated updates without a marker", async () => {
    await expect(
      protectOrderLifecycle(
        hookArgs({ operation: "create", data: { status: "pending_payment" } })
      )
    ).resolves.toMatchObject({ status: "pending_payment" });
    await expect(
      protectPaymentLifecycle(
        hookArgs({
          data: { updatedAt: "2026-07-21T08:00:00.000Z" },
          originalDoc: {
            status: "pending",
            updatedAt: "2026-07-21T07:00:00.000Z"
          }
        })
      )
    ).resolves.toMatchObject({ updatedAt: "2026-07-21T08:00:00.000Z" });
  });

  it("rejects records created directly in advanced lifecycle states", async () => {
    await expect(
      protectOrderLifecycle(
        hookArgs({ operation: "create", data: { status: "confirmed" } })
      )
    ).rejects.toThrow("commerce-lifecycle-create-forbidden");
    await expect(
      protectPaymentLifecycle(
        hookArgs({ operation: "create", data: { status: "paid" } })
      )
    ).rejects.toThrow("commerce-lifecycle-create-forbidden");
  });

  it("protects campaign counters and lifecycle state", async () => {
    await expect(
      protectCampaignLifecycle(
        hookArgs({
          data: { paid_commitments: 2, state: "met" },
          originalDoc: { paid_commitments: 1, state: "open" }
        })
      )
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");

    await expect(
      protectCampaignLifecycle(
        hookArgs({
          operation: "create",
          data: { state: "open", paid_commitments: 0 }
        })
      )
    ).resolves.toMatchObject({ state: "open", paid_commitments: 0 });
  });

  it("rejects generic payment lifecycle updates", async () => {
    await expect(
      protectPaymentLifecycle(
        hookArgs({
          data: { status: "paid" },
          originalDoc: { status: "pending" }
        })
      )
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");
    await expect(
      protectPaymentLifecycle(
        hookArgs({
          data: {
            portone_transaction_ref: "txn-2",
            paid_at: "2026-07-21T08:00:00.000Z"
          },
          originalDoc: {
            portone_transaction_ref: "txn-1",
            paid_at: "2026-07-21T07:00:00.000Z"
          }
        })
      )
    ).rejects.toThrow("commerce-lifecycle-update-forbidden");
  });

  it("rejects order and payment snapshot mutation even for lifecycle services", async () => {
    const req = {};
    authorizeCommerceLifecycleRequest(req);
    await expect(
      protectOrderLifecycle(
        hookArgs({
          req,
          data: { total_amount: 2000 },
          originalDoc: { total_amount: 1000 }
        })
      )
    ).rejects.toThrow("commerce-snapshot-update-forbidden");
    await expect(
      protectPaymentLifecycle(
        hookArgs({
          req,
          data: { user: "user-2" },
          originalDoc: { user: "user-1" }
        })
      )
    ).rejects.toThrow("commerce-snapshot-update-forbidden");
  });

  it("rejects order line snapshot version changes", async () => {
    await expect(
      protectOrderLifecycle(
        hookArgs({
          data: { line_snapshot_version: 1 },
          originalDoc: { line_snapshot_version: 2 }
        })
      )
    ).rejects.toThrow("commerce-snapshot-update-forbidden");
  });
});
