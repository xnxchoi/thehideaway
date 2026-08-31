import type { ProductsValidation } from "@payloadcms/plugin-ecommerce/types";

function priceFieldName(currency: string): string {
  return `priceIn${currency.toUpperCase()}`;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : fallback;
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

  const record = product as Record<string, unknown>;
  if (record.active === false) throw new Error("product-inactive");
  if (record._status && record._status !== "published") {
    throw new Error("product-unpublished");
  }

  const min = numberOr(record.min_order_quantity, 1);
  const max = numberOr(record.max_order_quantity, 99);
  if (!Number.isInteger(quantity) || quantity < min) {
    throw new Error("quantity-below-min");
  }
  if (quantity > max) {
    throw new Error("quantity-above-max");
  }

  const priced = (variant ?? product) as Record<string, unknown>;
  const priceField = priceFieldName(currency);
  if (!priced[priceField]) {
    throw new Error(
      `${variant ? "Variant" : "Product"} does not have a price in ${currency}.`
    );
  }

  if (variant && (variant as Record<string, unknown>).active === false) {
    throw new Error("variant-inactive");
  }
};
