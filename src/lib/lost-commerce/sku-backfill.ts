import type { Payload } from "payload";

import { buildSkuOptionKey, canonicalizeSkuOptions } from "./product-skus";

type LegacyProduct = {
  id: string;
  variants?: unknown;
};

export type ReviewedSkuFact = {
  productId: string;
  legacyVariantRef: string;
  sku: string;
  options?: Array<{ key: string; value: string }>;
  label?: string | null;
};

export type SkuBackfillRow = {
  product: string;
  active: false;
  sku: string;
  label: string | null;
  options: Array<{ key: string; value: string }>;
  option_key: string;
  legacy_variant_ref: string;
  legacy_key: string;
  price_override_amount: null;
  barcode: null;
  weight_grams: null;
  length_mm: null;
  width_mm: null;
  height_mm: null;
  tax_category: null;
  inventory: null;
  stock_state: null;
};

function legacyVariantExists(product: LegacyProduct, ref: string): boolean {
  return (
    Array.isArray(product.variants) &&
    product.variants.some(
      (variant) =>
        variant &&
        typeof variant === "object" &&
        (variant as { id?: unknown }).id === ref
    )
  );
}

function relationshipId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id.trim() : "";
  }
  return "";
}

function normalizedText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function matchesBackfillRow(existing: unknown, row: SkuBackfillRow): boolean {
  if (!existing || typeof existing !== "object") return false;
  const candidate = existing as Record<string, unknown>;
  const nullableFactFields = [
    "price_override_amount",
    "barcode",
    "weight_grams",
    "length_mm",
    "width_mm",
    "height_mm",
    "tax_category",
    "inventory",
    "stock_state"
  ] as const;

  try {
    const options = canonicalizeSkuOptions(candidate.options);
    return (
      relationshipId(candidate.product) === row.product &&
      candidate.active === false &&
      normalizedText(candidate.sku)?.toUpperCase() === row.sku &&
      normalizedText(candidate.label) === row.label &&
      JSON.stringify(options) === JSON.stringify(row.options) &&
      candidate.option_key === row.option_key &&
      normalizedText(candidate.legacy_variant_ref) === row.legacy_variant_ref &&
      candidate.legacy_key === row.legacy_key &&
      nullableFactFields.every((field) => candidate[field] === null)
    );
  } catch {
    return false;
  }
}

export function buildSkuBackfillPlan(
  products: LegacyProduct[],
  reviewed: ReviewedSkuFact[]
): SkuBackfillRow[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const seenSkus = new Set<string>();
  const seenLegacyKeys = new Set<string>();
  const seenOptionKeys = new Set<string>();

  return reviewed.map((fact) => {
    const productId = fact.productId.trim();
    const legacyVariantRef = fact.legacyVariantRef.trim();
    const sku = fact.sku.trim().toUpperCase();
    const product = productsById.get(productId);
    if (!product || !legacyVariantRef || !sku) {
      throw new Error("invalid-reviewed-sku");
    }
    if (!legacyVariantExists(product, legacyVariantRef)) {
      throw new Error("reviewed-legacy-variant-not-found");
    }

    const legacyKey = `${productId}:${legacyVariantRef}`;
    const options = canonicalizeSkuOptions(fact.options);
    const optionKey = buildSkuOptionKey(productId, options);
    if (
      seenSkus.has(sku) ||
      seenLegacyKeys.has(legacyKey) ||
      seenOptionKeys.has(optionKey)
    ) {
      throw new Error("duplicate-reviewed-sku");
    }
    seenSkus.add(sku);
    seenLegacyKeys.add(legacyKey);
    seenOptionKeys.add(optionKey);

    return {
      product: productId,
      active: false,
      sku,
      label: fact.label?.trim() || null,
      options,
      option_key: optionKey,
      legacy_variant_ref: legacyVariantRef,
      legacy_key: legacyKey,
      price_override_amount: null,
      barcode: null,
      weight_grams: null,
      length_mm: null,
      width_mm: null,
      height_mm: null,
      tax_category: null,
      inventory: null,
      stock_state: null
    };
  });
}

export async function applySkuBackfill(input: {
  payload: Payload;
  products: LegacyProduct[];
  reviewed: ReviewedSkuFact[];
}): Promise<{ created: number; existing: number }> {
  const rows = buildSkuBackfillPlan(input.products, input.reviewed);
  let created = 0;
  let existing = 0;
  for (const row of rows) {
    const found = await input.payload.find({
      collection: "product-variants",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { legacy_key: { equals: row.legacy_key } }
    });
    if (found.docs.length > 0) {
      if (!matchesBackfillRow(found.docs[0], row)) {
        throw new Error("sku-backfill-conflict");
      }
      existing += 1;
      continue;
    }
    try {
      await input.payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: row
      });
      created += 1;
    } catch (error) {
      const replay = await input.payload.find({
        collection: "product-variants",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { legacy_key: { equals: row.legacy_key } }
      });
      if (replay.docs.length === 0) throw error;
      if (!matchesBackfillRow(replay.docs[0], row)) {
        throw new Error("sku-backfill-conflict");
      }
      existing += 1;
    }
  }
  return { created, existing };
}
