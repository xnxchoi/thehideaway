import type { Payload } from "payload";

type FragranceDraft = {
  name: string;
  slug: string;
  summary: string;
  standard_enabled: boolean;
  request_to_order_enabled: boolean;
  private_order_enabled: boolean;
  private_preset_price_enabled: boolean;
  private_tier_gate: string;
  min_order_quantity: number;
  max_order_quantity: number;
  sort: number;
};

type LaunchProduct = {
  name: string;
  slug: string;
  summary: string;
  details: string;
  shippingReturns: string;
  unitAmount: number;
  availableQuantity: number | null;
  fulfillment: "stock" | "preorder";
  sku: string;
  sort: number;
};

export const DEFAULT_VARIANT_TYPE = {
  name: "default",
  label: "Default"
} as const;

export const DEFAULT_VARIANT_OPTION = {
  label: "Standard",
  value: "standard"
} as const;

export function inventoryCollectionsReady(payload: Payload): boolean {
  const collections = payload.collections ?? {};
  return (
    "stock-locations" in collections &&
    "inventory-receipts" in collections &&
    "inventory-levels" in collections
  );
}

export function pluginDraftProductData(
  product: FragranceDraft,
  categoryId: string
): Record<string, unknown> {
  return {
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    category: categoryId,
    storefront: "lostinseoul",
    active: false,
    _status: "draft",
    enableVariants: false,
    priceInKRWEnabled: false,
    standard_enabled: product.standard_enabled,
    request_to_order_enabled: product.request_to_order_enabled,
    private_order_enabled: product.private_order_enabled,
    private_preset_price_enabled: product.private_preset_price_enabled,
    private_tier_gate: product.private_tier_gate,
    min_order_quantity: product.min_order_quantity,
    max_order_quantity: product.max_order_quantity,
    sort: product.sort
  };
}

export function pluginLaunchProductData(
  product: LaunchProduct,
  categoryId: string,
  media: { heroMedia: string | null; gallery: readonly string[] }
): Record<string, unknown> {
  return {
    name: product.name,
    slug: product.slug,
    active: true,
    _status: "published",
    storefront: "lostinseoul",
    category: categoryId,
    summary: product.summary,
    details: product.details,
    shipping_returns: product.shippingReturns,
    hero_media: media.heroMedia,
    gallery: [...media.gallery],
    enableVariants: true,
    priceInKRWEnabled: true,
    priceInKRW: product.unitAmount,
    min_order_quantity: 1,
    max_order_quantity: product.availableQuantity ?? 1,
    standard_enabled: product.fulfillment === "stock",
    request_to_order_enabled: product.fulfillment === "preorder",
    private_order_enabled: false,
    private_preset_price_enabled: false,
    private_unit_amount: null,
    private_tier_gate: "anyone",
    sort: product.sort
  };
}

export function pluginLaunchVariantData(
  product: LaunchProduct,
  productId: string,
  options: readonly string[]
): Record<string, unknown> {
  return {
    product: productId,
    active: true,
    sku: product.sku,
    label: product.name,
    title: product.name,
    options: [...options],
    priceInKRWEnabled: true,
    priceInKRW: product.unitAmount,
    sort: product.sort,
    _status: "published"
  };
}
