import { describe, expect, it, vi } from "vitest";

import { markRequestOrderPaid } from "./campaigns";

vi.mock("@/lib/db/sequences", () => ({
  campaignCommitmentLock: vi.fn(async () => undefined)
}));

describe("markRequestOrderPaid", () => {
  it("serializes campaign commitment increments inside the caller transaction", async () => {
    const { campaignCommitmentLock } = await import("@/lib/db/sequences");
    const payload = {
      findByID: vi.fn(async () => ({
        id: "campaign-1",
        paid_commitments: 1,
        minimum_commitments: 2,
        state: "open"
      })),
      find: vi.fn(async () => ({ docs: [{ id: "order-previous" }] })),
      update: vi.fn(async () => ({ id: "updated" }))
    } as any;
    const req = {
      transactionID: "tx-1",
      payload,
      context: {}
    };

    await markRequestOrderPaid({
      payload,
      req,
      order: {
        id: "order-1",
        order_mode: "request_to_order",
        campaign: "campaign-1"
      }
    });

    expect(campaignCommitmentLock).toHaveBeenCalledWith(
      payload,
      "tx-1",
      "campaign-1"
    );
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-order-campaigns",
        id: "campaign-1",
        req
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-order-campaigns",
        id: "campaign-1",
        req,
        data: {
          paid_commitments: 2,
          state: "met"
        }
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        req,
        data: expect.objectContaining({
          status: "confirmed",
          fulfillment_status: "in_production"
        })
      })
    );
  });
});
