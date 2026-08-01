import type { CollectionBeforeValidateHook } from "payload";

import {
  buildSkuOptionKey,
  canonicalizeSkuOptions
} from "@/lib/lost-commerce/product-skus";

type VariantData = Record<string, unknown>;

function relationshipId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id.trim() : "";
  }
  return "";
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableInteger(value: unknown, minimum = 0): number | null {
  if (value == null || value === "") return null;
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    throw new Error("invalid-sku-number");
  }
  return Number(value);
}

function identityChanged(
  originalDoc: VariantData,
  normalized: VariantData
): boolean {
  const originalProduct = relationshipId(originalDoc.product);
  const originalOptions = canonicalizeSkuOptions(originalDoc.options);
  const nextOptions = canonicalizeSkuOptions(normalized.options);
  return (
    originalProduct !== relationshipId(normalized.product) ||
    nullableText(originalDoc.sku)?.toUpperCase() !== normalized.sku ||
    JSON.stringify(originalOptions) !== JSON.stringify(nextOptions)
  );
}

export function normalizeProductVariantData(input: {
  operation: "create" | "update";
  data?: VariantData | null;
  originalDoc?: VariantData | null;
}): VariantData {
  const originalDoc = input.originalDoc ?? {};
  const incoming = input.data ?? {};
  const merged = { ...originalDoc, ...incoming };
  const productId = relationshipId(merged.product);
  if (!productId) throw new Error("sku-product-required");

  const options = canonicalizeSkuOptions(merged.options);
  const sku = nullableText(merged.sku)?.toUpperCase() ?? null;
  const active = merged.active === true;
  if (active && !sku) throw new Error("active-sku-required");

  const wasIdentityLocked =
    input.operation === "update" &&
    (originalDoc.identity_locked === true || originalDoc.active === true);
  const identityLocked = wasIdentityLocked || active;

  const normalized: VariantData = {
    ...incoming,
    product: merged.product,
    active,
    identity_locked: identityLocked,
    sku,
    label: nullableText(merged.label),
    options,
    option_key: buildSkuOptionKey(productId, options),
    price_override_amount: nullableInteger(merged.price_override_amount, 1),
    barcode: nullableText(merged.barcode),
    weight_grams: nullableInteger(merged.weight_grams, 1),
    length_mm: nullableInteger(merged.length_mm, 1),
    width_mm: nullableInteger(merged.width_mm, 1),
    height_mm: nullableInteger(merged.height_mm, 1),
    tax_category: nullableText(merged.tax_category)
  };

  if (wasIdentityLocked && identityChanged(originalDoc, normalized)) {
    if (
      relationshipId(originalDoc.product) !== relationshipId(normalized.product)
    ) {
      throw new Error("sku-product-immutable");
    }
    throw new Error("sku-identity-immutable");
  }

  return normalized;
}

export const normalizeProductVariant: CollectionBeforeValidateHook = (args) =>
  normalizeProductVariantData({
    operation: args.operation,
    data: args.data as VariantData | undefined,
    originalDoc: args.originalDoc as VariantData | undefined
  });
