import type { ProductOrderCampaign, ProductVariant } from "@/payload-types";
import type { CollectionBeforeChangeHook } from "payload";

import {
  campaignCommitmentLock,
  productSkuMutationLock
} from "@/lib/db/sequences";

type RelationshipValue = string | { id?: unknown } | null | undefined;
type SkuOwnership = Pick<ProductVariant, "id" | "product">;

function relationshipId(value: RelationshipValue): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

function relationshipIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const id = relationshipId(entry as RelationshipValue);
    return id ? [id] : [];
  });
}

export function assertCampaignSkuOwnership(
  productId: string,
  selectedSkuIds: readonly string[],
  resolvedSkus: readonly SkuOwnership[]
): void {
  const resolvedById = new Map(resolvedSkus.map((sku) => [sku.id, sku]));

  for (const skuId of selectedSkuIds) {
    const sku = resolvedById.get(skuId);
    if (!sku) throw new Error("campaign-sku-not-found");
    if (relationshipId(sku.product) !== productId) {
      throw new Error("campaign-sku-product-mismatch");
    }
  }
}

export const validateCampaignSkuOwnership: CollectionBeforeChangeHook<
  ProductOrderCampaign
> = async ({ data, originalDoc, req }) => {
  const product = Object.hasOwn(data, "product")
    ? data.product
    : originalDoc?.product;
  const eligibleSkus = Object.hasOwn(data, "eligible_skus")
    ? data.eligible_skus
    : originalDoc?.eligible_skus;
  const productId = relationshipId(product as RelationshipValue);
  const selectedSkuIds = [...new Set(relationshipIds(eligibleSkus))].sort();
  const campaignId =
    typeof originalDoc?.id === "string" ? originalDoc.id : null;
  const skuSelectionChanged =
    !originalDoc ||
    Object.hasOwn(data, "product") ||
    Object.hasOwn(data, "eligible_skus");

  if (!skuSelectionChanged) {
    if (!campaignId) return data;
    const transactionID = req.transactionID;
    if (transactionID == null) {
      throw new Error("campaign-sku-transaction-required");
    }
    await campaignCommitmentLock(req.payload, transactionID, campaignId);
    return data;
  }

  if ((!productId || selectedSkuIds.length === 0) && !campaignId) return data;

  const transactionID = req.transactionID;
  if (transactionID == null) {
    throw new Error("campaign-sku-transaction-required");
  }
  for (const skuId of selectedSkuIds) {
    await productSkuMutationLock(req.payload, transactionID, skuId);
  }
  if (campaignId) {
    await campaignCommitmentLock(req.payload, transactionID, campaignId);
  }

  if (!productId || selectedSkuIds.length === 0) return data;

  const result = await req.payload.find({
    collection: "product-variants",
    where: { id: { in: selectedSkuIds } },
    depth: 0,
    limit: selectedSkuIds.length,
    overrideAccess: true,
    req
  });

  assertCampaignSkuOwnership(productId, selectedSkuIds, result.docs);
  return data;
};
