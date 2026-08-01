import type { LostCurrency, LostOrderMode } from "./types";

export type CommerceSkuOption = {
  key: string;
  value: string;
};

type ProductForSkuSnapshot = {
  id: string;
  name: string;
  slug: string;
  currency: LostCurrency;
  unit_amount: number;
  private_preset_price_enabled?: boolean | null;
  private_unit_amount?: number | null;
};

type PrivateOrderPreset = Pick<
  ProductForSkuSnapshot,
  "private_preset_price_enabled" | "private_unit_amount"
>;

export type ProductSkuForSnapshot = {
  id: string;
  product: string | { id: string };
  sku: string;
  label?: string | null;
  options?: readonly CommerceSkuOption[] | null;
  price_override_amount?: number | null;
  weight_grams?: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  tax_category?: string | null;
};

export type CommerceSkuSnapshot = {
  schemaVersion: 3;
  productId: string;
  productName: string;
  productSlug: string;
  skuId: string;
  sku: string;
  skuLabel: string | null;
  options: readonly Readonly<CommerceSkuOption>[];
  currency: LostCurrency;
  unitAmount: number;
  quantity: number;
  lineAmount: number;
  weightGrams: number | null;
  dimensions: Readonly<{
    lengthMm: number | null;
    widthMm: number | null;
    heightMm: number | null;
  }> | null;
  taxCategory: string | null;
  mode: LostOrderMode;
  campaignId?: string;
};

function normalizedOptionKey(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US");
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function canonicalizeSkuOptions(
  value: unknown
): CommerceSkuOption[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("invalid-sku-options");

  const seen = new Set<string>();
  const options = value.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("invalid-sku-option");
    }
    const candidate = entry as { key?: unknown; value?: unknown };
    const key = typeof candidate.key === "string" ? candidate.key.trim() : "";
    const optionValue =
      typeof candidate.value === "string" ? candidate.value.trim() : "";
    if (!key || !optionValue) throw new Error("invalid-sku-option");

    const identity = normalizedOptionKey(key);
    if (seen.has(identity)) throw new Error("duplicate-sku-option");
    seen.add(identity);
    return { key, value: optionValue };
  });

  return options.sort((left, right) => {
    const byKey = compareText(
      normalizedOptionKey(left.key),
      normalizedOptionKey(right.key)
    );
    return byKey || compareText(left.value, right.value);
  });
}

export function buildSkuOptionKey(
  productId: string,
  options: unknown
): string {
  const normalizedProductId = productId.trim();
  if (!normalizedProductId) throw new Error("sku-product-required");
  const canonical = canonicalizeSkuOptions(options).map(({ key, value }) => [
    normalizedOptionKey(key),
    value
  ]);
  return `${normalizedProductId}:${JSON.stringify(canonical)}`;
}

export function productIdOfSku(
  product: ProductSkuForSnapshot["product"]
): string {
  return typeof product === "string" ? product : product.id;
}

function safeNonNegativeInteger(value: unknown, error: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(error);
  }
  return Number(value);
}

function nullablePositiveInteger(value: unknown): number | null {
  if (value == null) return null;
  const number = safeNonNegativeInteger(value, "invalid-sku-number");
  if (number === 0) throw new Error("invalid-sku-number");
  return number;
}

export function hasPositivePrivateOrderPreset(
  product: PrivateOrderPreset
): product is PrivateOrderPreset & { private_unit_amount: number } {
  return (
    product.private_preset_price_enabled === true &&
    Number.isSafeInteger(product.private_unit_amount) &&
    Number(product.private_unit_amount) >= 1
  );
}

export function resolveSkuUnitAmount(input: {
  product: ProductForSkuSnapshot;
  sku: ProductSkuForSnapshot;
  mode: LostOrderMode;
  allowUnpricedPrivateOrder?: boolean;
}): number {
  if (input.mode === "private_order") {
    if (hasPositivePrivateOrderPreset(input.product)) {
      return input.product.private_unit_amount;
    }
    if (
      input.allowUnpricedPrivateOrder &&
      input.product.private_preset_price_enabled !== true
    ) {
      return 0;
    }
    throw new Error("invalid-sku-price");
  }

  if (input.sku.price_override_amount != null) {
    const override = safeNonNegativeInteger(
      input.sku.price_override_amount,
      "invalid-sku-price"
    );
    if (override > 0) return override;
  }

  const productAmount = safeNonNegativeInteger(
    input.product.unit_amount,
    "invalid-sku-price"
  );
  if (productAmount === 0) {
    throw new Error("invalid-sku-price");
  }
  return productAmount;
}

export function buildCommerceSkuSnapshot(input: {
  product: ProductForSkuSnapshot;
  sku: ProductSkuForSnapshot;
  quantity: number;
  mode: LostOrderMode;
  campaignId?: string;
  allowUnpricedPrivateOrder?: boolean;
}): CommerceSkuSnapshot {
  const productId = productIdOfSku(input.sku.product);
  if (productId !== input.product.id) throw new Error("sku-product-mismatch");

  const skuCode = input.sku.sku.trim();
  if (!skuCode) throw new Error("active-sku-required");
  const quantity = safeNonNegativeInteger(input.quantity, "bad-quantity");
  if (quantity < 1 || quantity > 99) throw new Error("bad-quantity");

  const unitAmount = resolveSkuUnitAmount(input);
  const lineAmount = unitAmount * quantity;
  if (!Number.isSafeInteger(lineAmount)) throw new Error("invalid-sku-price");

  const options = Object.freeze(
    canonicalizeSkuOptions(input.sku.options).map((option) =>
      Object.freeze({ ...option })
    )
  );
  const weightGrams = nullablePositiveInteger(input.sku.weight_grams);
  const lengthMm = nullablePositiveInteger(input.sku.length_mm);
  const widthMm = nullablePositiveInteger(input.sku.width_mm);
  const heightMm = nullablePositiveInteger(input.sku.height_mm);
  const dimensions =
    lengthMm === null && widthMm === null && heightMm === null
      ? null
      : Object.freeze({ lengthMm, widthMm, heightMm });

  return Object.freeze({
    schemaVersion: 3 as const,
    productId: input.product.id,
    productName: input.product.name,
    productSlug: input.product.slug,
    skuId: input.sku.id,
    sku: skuCode,
    skuLabel: input.sku.label?.trim() || null,
    options,
    currency: input.product.currency,
    unitAmount,
    quantity,
    lineAmount,
    weightGrams,
    dimensions,
    taxCategory: input.sku.tax_category?.trim() || null,
    mode: input.mode,
    ...(input.campaignId ? { campaignId: input.campaignId } : {})
  });
}
