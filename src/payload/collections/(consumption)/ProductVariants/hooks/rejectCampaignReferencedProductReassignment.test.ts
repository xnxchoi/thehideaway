import { describe, expect, it, vi } from "vitest";

import { rejectCampaignReferencedProductReassignment } from "./rejectCampaignReferencedProductReassignment";

describe("rejectCampaignReferencedProductReassignment", () => {
  it("requires the existing SKU mutation transaction for a product change", async () => {
    const find = vi.fn();

    await expect(
      rejectCampaignReferencedProductReassignment({
        data: { product: "product-2" },
        operation: "update",
        originalDoc: { id: "sku-1", product: "product-1" },
        req: { payload: { find } }
      } as never)
    ).rejects.toThrow("sku-update-transaction-required");

    expect(find).not.toHaveBeenCalled();
  });

  it("rejects product reassignment when a campaign references the SKU", async () => {
    const req = {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [{ id: "campaign-1" }] })
      },
      transactionID: "tx-1"
    };

    await expect(
      rejectCampaignReferencedProductReassignment({
        data: { product: "product-2" },
        operation: "update",
        originalDoc: { id: "sku-1", product: "product-1" },
        req
      } as never)
    ).rejects.toThrow("sku-product-referenced-by-campaign");

    expect(req.payload.find).toHaveBeenCalledWith({
      collection: "product-order-campaigns",
      where: { eligible_skus: { contains: "sku-1" } },
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      req
    });
  });

  it("allows an unreferenced never-active draft SKU to be corrected", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });
    const data = { product: "product-2" };

    await expect(
      rejectCampaignReferencedProductReassignment({
        data,
        operation: "update",
        originalDoc: {
          id: "sku-1",
          product: "product-1",
          active: false,
          identity_locked: false
        },
        req: { payload: { find }, transactionID: "tx-1" }
      } as never)
    ).resolves.toBe(data);
  });

  it("does not query campaigns when product ownership is unchanged", async () => {
    const find = vi.fn();
    const data = { label: "Corrected label" };

    await expect(
      rejectCampaignReferencedProductReassignment({
        data,
        operation: "update",
        originalDoc: { id: "sku-1", product: "product-1" },
        req: { payload: { find }, transactionID: "tx-1" }
      } as never)
    ).resolves.toBe(data);
    expect(find).not.toHaveBeenCalled();
  });
});
