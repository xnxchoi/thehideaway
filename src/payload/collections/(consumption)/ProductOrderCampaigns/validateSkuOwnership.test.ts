import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  campaignCommitmentLock,
  productSkuMutationLock
} from "@/lib/db/sequences";

import {
  assertCampaignSkuOwnership,
  validateCampaignSkuOwnership
} from "./validateSkuOwnership";

vi.mock("@/lib/db/sequences", () => ({
  campaignCommitmentLock: vi.fn(),
  productSkuMutationLock: vi.fn()
}));

describe("assertCampaignSkuOwnership", () => {
  it("accepts selected SKUs owned by the campaign product", () => {
    expect(() =>
      assertCampaignSkuOwnership(
        "product-1",
        ["sku-1"],
        [{ id: "sku-1", product: "product-1" }]
      )
    ).not.toThrow();
  });

  it("rejects missing and cross-product SKUs", () => {
    expect(() =>
      assertCampaignSkuOwnership("product-1", ["sku-1"], [])
    ).toThrow("campaign-sku-not-found");
    expect(() =>
      assertCampaignSkuOwnership(
        "product-1",
        ["sku-1"],
        [{ id: "sku-1", product: "product-2" }]
      )
    ).toThrow("campaign-sku-product-mismatch");
  });
});

describe("validateCampaignSkuOwnership", () => {
  beforeEach(() => {
    vi.mocked(campaignCommitmentLock).mockReset();
    vi.mocked(productSkuMutationLock).mockReset();
  });

  it("serializes updates with checkout after locking selected SKUs", async () => {
    const calls: string[] = [];
    vi.mocked(productSkuMutationLock).mockImplementation(async () => {
      calls.push("sku");
    });
    vi.mocked(campaignCommitmentLock).mockImplementation(async () => {
      calls.push("campaign");
    });
    const find = vi.fn().mockImplementation(async () => {
      calls.push("find");
      return { docs: [{ id: "sku-1", product: "product-1" }] };
    });

    await validateCampaignSkuOwnership({
      data: { eligible_skus: ["sku-1"] },
      operation: "update",
      originalDoc: {
        id: "campaign-1",
        product: "product-1",
        eligible_skus: ["sku-1"]
      },
      req: { payload: { find }, transactionID: "tx-1" }
    } as never);

    expect(calls).toEqual(["sku", "campaign", "find"]);
    expect(campaignCommitmentLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "campaign-1"
    );
  });

  it("takes only the campaign lock for lifecycle-only updates", async () => {
    const find = vi.fn();

    await validateCampaignSkuOwnership({
      data: { paid_commitments: 2, state: "met" },
      operation: "update",
      originalDoc: {
        id: "campaign-1",
        product: "product-1",
        eligible_skus: ["sku-1"]
      },
      req: { payload: { find }, transactionID: "tx-1" }
    } as never);

    expect(campaignCommitmentLock).toHaveBeenCalledWith(
      expect.anything(),
      "tx-1",
      "campaign-1"
    );
    expect(productSkuMutationLock).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("requires a transaction before validating selected SKUs", async () => {
    const find = vi.fn();

    await expect(
      validateCampaignSkuOwnership({
        data: { product: "product-1", eligible_skus: ["sku-1"] },
        operation: "create",
        originalDoc: undefined,
        req: { payload: { find } }
      } as never)
    ).rejects.toThrow("campaign-sku-transaction-required");

    expect(productSkuMutationLock).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("loads the selected SKUs and accepts matching ownership", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: "sku-1", product: "product-1" }]
    });
    const data = {
      product: "product-1",
      eligible_skus: ["sku-1"]
    };

    await expect(
      validateCampaignSkuOwnership({
        data,
        operation: "create",
        originalDoc: undefined,
        req: { payload: { find }, transactionID: "tx-1" }
      } as never)
    ).resolves.toBe(data);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-variants",
        where: { id: { in: ["sku-1"] } }
      })
    );
  });

  it("locks selected SKUs once in deterministic order before reading them", async () => {
    const calls: string[] = [];
    vi.mocked(productSkuMutationLock).mockImplementation(
      async (_payload, _transactionID, skuId) => {
        calls.push(`lock:${skuId}`);
      }
    );
    const find = vi.fn().mockImplementation(async () => {
      calls.push("find");
      return {
        docs: [
          { id: "sku-a", product: "product-1" },
          { id: "sku-b", product: "product-1" }
        ]
      };
    });

    await validateCampaignSkuOwnership({
      data: {
        product: "product-1",
        eligible_skus: ["sku-b", { id: "sku-a" }, "sku-b"]
      },
      operation: "create",
      originalDoc: undefined,
      req: { payload: { find }, transactionID: "tx-1" }
    } as never);

    expect(calls).toEqual(["lock:sku-a", "lock:sku-b", "find"]);
    expect(productSkuMutationLock).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "tx-1",
      "sku-a"
    );
    expect(productSkuMutationLock).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "tx-1",
      "sku-b"
    );
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["sku-a", "sku-b"] } } })
    );
  });

  it("validates persisted SKUs when an update changes the product", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: "sku-1", product: "product-1" }]
    });

    await expect(
      validateCampaignSkuOwnership({
        data: { product: "product-2" },
        operation: "update",
        originalDoc: {
          product: "product-1",
          eligible_skus: [{ id: "sku-1" }]
        },
        req: { payload: { find }, transactionID: "tx-1" }
      } as never)
    ).rejects.toThrow("campaign-sku-product-mismatch");
  });

  it("does not query when the campaign has no selected SKUs", async () => {
    const find = vi.fn();
    const data = { product: "product-1", eligible_skus: [] };

    await expect(
      validateCampaignSkuOwnership({
        data,
        operation: "create",
        originalDoc: undefined,
        req: { payload: { find } }
      } as never)
    ).resolves.toBe(data);
    expect(find).not.toHaveBeenCalled();
  });
});
