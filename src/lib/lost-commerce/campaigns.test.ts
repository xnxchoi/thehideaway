import { beforeEach, describe, expect, it, vi } from "vitest";

import { claimRequestOrderCapacity, markRequestOrderPaid } from "./campaigns";

vi.mock("@/lib/db/sequences", () => ({
  campaignCommitmentLock: vi.fn(async () => undefined)
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("claimRequestOrderCapacity", () => {
  it("locks, re-reads, and fails closed for finite capacity", async () => {
    const { campaignCommitmentLock } = await import("@/lib/db/sequences");
    const events: string[] = [];
    vi.mocked(campaignCommitmentLock).mockImplementationOnce(async () => {
      events.push("lock");
    });
    const req = { transactionID: "tx-1", context: {} };
    const payload = {
      findByID: vi.fn(async () => {
        events.push("campaign");
        return {
          id: "campaign-1",
          state: "open",
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          maximum_commitments: 2
        };
      })
    } as any;

    await expect(
      claimRequestOrderCapacity({
        payload,
        campaignId: "campaign-1",
        productId: "product-1",
        skuIds: ["sku-1"],
        req
      })
    ).rejects.toThrow("campaign-capacity-reservations-unavailable");

    expect(events).toEqual(["lock", "campaign"]);
  });

  it("allows an open unbounded campaign after the locked re-read", async () => {
    const req = { transactionID: "tx-1", context: {} };
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        id: "campaign-1",
        product: "product-1",
        state: "open",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
        maximum_commitments: null,
        eligible_skus: ["sku-1"]
      })
    } as any;

    await expect(
      claimRequestOrderCapacity({
        payload,
        campaignId: "campaign-1",
        productId: "product-1",
        skuIds: ["sku-1"],
        req
      })
    ).resolves.toBeUndefined();
  });

  it("requires a transaction before taking campaign capacity", async () => {
    const payload = { findByID: vi.fn() } as any;

    await expect(
      claimRequestOrderCapacity({
        payload,
        campaignId: "campaign-1",
        productId: "product-1",
        skuIds: ["sku-1"]
      })
    ).rejects.toThrow("transaction-required");
    expect(payload.findByID).not.toHaveBeenCalled();
  });

  it.each([
    [
      "closed",
      {
        state: "met",
        deadline: new Date(Date.now() + 86_400_000).toISOString()
      },
      "campaign-not-open"
    ],
    [
      "expired",
      {
        state: "open",
        deadline: new Date(Date.now() - 86_400_000).toISOString()
      },
      "campaign-ended"
    ]
  ])(
    "rejects a %s campaign after taking the lock",
    async (_label, campaign, error) => {
      const payload = {
        findByID: vi.fn(async () => ({ id: "campaign-1", ...campaign }))
      } as any;

      await expect(
        claimRequestOrderCapacity({
          payload,
          campaignId: "campaign-1",
          productId: "product-1",
          skuIds: ["sku-1"],
          req: { transactionID: "tx-1", context: {} }
        })
      ).rejects.toThrow(error);
    }
  );

  it("revalidates SKU eligibility after taking the campaign lock", async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        id: "campaign-1",
        product: "product-1",
        state: "open",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
        maximum_commitments: null,
        eligible_skus: ["sku-2"]
      })
    } as any;

    await expect(
      claimRequestOrderCapacity({
        payload,
        campaignId: "campaign-1",
        productId: "product-1",
        skuIds: ["sku-1"],
        req: { transactionID: "tx-1", context: {} }
      })
    ).rejects.toThrow("campaign-sku-ineligible");
  });
});

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
      find: vi.fn(async () => ({
        docs: [{ id: "order-previous", status: "committed" }]
      })),
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
        status: "paid",
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
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        pagination: false
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

  it("rejects an invalid order transition before writing campaign state", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "campaign-1",
        paid_commitments: 0,
        minimum_commitments: 2,
        state: "open"
      })),
      find: vi.fn(async () => ({ docs: [] })),
      update: vi.fn()
    } as any;
    const req = {
      transactionID: "tx-1",
      payload,
      context: {}
    };

    await expect(
      markRequestOrderPaid({
        payload,
        req,
        order: {
          id: "order-1",
          order_mode: "request_to_order",
          status: "failed",
          campaign: "campaign-1"
        }
      })
    ).rejects.toThrow("invalid-commerce-transition");

    expect(payload.update).not.toHaveBeenCalled();
  });

  it("requires the caller transaction before incrementing commitments", async () => {
    const payload = {
      findByID: vi.fn(),
      find: vi.fn(),
      update: vi.fn()
    } as any;

    await expect(
      markRequestOrderPaid({
        payload,
        order: {
          id: "order-1",
          order_mode: "request_to_order",
          status: "paid",
          campaign: "campaign-1"
        }
      })
    ).rejects.toThrow("transaction-required");
    expect(payload.findByID).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });
});
