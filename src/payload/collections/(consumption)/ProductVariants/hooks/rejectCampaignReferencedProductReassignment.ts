import type { CollectionBeforeChangeHook } from "payload";

type RelationshipValue = string | { id?: unknown } | null | undefined;

function relationshipId(value: RelationshipValue): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

export const rejectCampaignReferencedProductReassignment: CollectionBeforeChangeHook =
  async ({ data, operation, originalDoc, req }) => {
    if (operation !== "update") return data;

    const originalProductId = relationshipId(
      originalDoc?.product as RelationshipValue
    );
    const nextProductId = relationshipId(data.product as RelationshipValue);
    if (!nextProductId || nextProductId === originalProductId) return data;

    if (req.transactionID == null) {
      throw new Error("sku-update-transaction-required");
    }

    const skuId = relationshipId(originalDoc as RelationshipValue);
    if (!skuId) throw new Error("sku-id-required");

    const referencedCampaigns = await req.payload.find({
      collection: "product-order-campaigns",
      where: { eligible_skus: { contains: skuId } },
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      req
    });
    if (referencedCampaigns.docs.length > 0) {
      throw new Error("sku-product-referenced-by-campaign");
    }

    return data;
  };
