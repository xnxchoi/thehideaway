import type { ProductsValidation } from "@payloadcms/plugin-ecommerce/types";

function priceFieldName(currency: string): string {
  return `priceIn${currency.toUpperCase()}`;
}

function numberOr(value: unknown, fallback: number): number {
  if (value == null) return fallback;
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw new Error("invalid-quantity-bounds");
  return value;
}

export const hideawayProductsValidation: ProductsValidation = async ({
  currency,
  product,
  quantity = 1,
  variant
}) => {
  if (!currency) {
    throw new Error("Currency must be provided for product validation.");
  }

  const record = product as unknown as Record<string, unknown>;
  if (record.active !== true) throw new Error("product-inactive");
  if (record._status !== "published") {
    throw new Error("product-unpublished");
  }

  const min = numberOr(record.min_order_quantity, 1);
  const max = numberOr(record.max_order_quantity, 99);
  if (min < 1 || max < min) throw new Error("invalid-quantity-bounds");
  if (!Number.isSafeInteger(quantity) || quantity < min) {
    throw new Error("quantity-below-min");
  }
  if (quantity > max) {
    throw new Error("quantity-above-max");
  }

  const priced = (variant ?? product) as unknown as Record<string, unknown>;
  const priceField = priceFieldName(currency);
  if (
    !Number.isSafeInteger(priced[priceField]) ||
    Number(priced[priceField]) <= 0
  ) {
    throw new Error(
      `${variant ? "Variant" : "Product"} does not have a price in ${currency}.`
    );
  }
  if (priced[`${priceField}Enabled`] !== true)
    throw new Error("currency-price-disabled");

  if (
    variant &&
    (variant as unknown as Record<string, unknown>).active !== true
  ) {
    throw new Error("variant-inactive");
  }
  if (
    variant &&
    (variant as unknown as Record<string, unknown>)._status !== "published"
  ) {
    throw new Error("variant-unpublished");
  }
};
