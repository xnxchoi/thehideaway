import { catalogUnitAmount } from "../catalog-money";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import type { LostCartLineClient } from "@/lib/lost-commerce/useLostCart";
import type { LostCurrency, LostOrderMode } from "@/lib/lost-commerce/types";

const MODES: readonly LostOrderMode[] = [
  "standard_purchase",
  "request_to_order",
  "private_order"
];

type AnyDoc = Record<string, unknown>;

function isRecord(value: unknown): value is AnyDoc {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function relationId(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (isRecord(value) && typeof value.id === "string") return value.id;
  return "";
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function modeOf(value: unknown): LostOrderMode {
  return MODES.find((mode) => mode === value) ?? "standard_purchase";
}

function currencyOf(value: unknown, fallback: string): LostCurrency {
  if (value === "KRW" || value === "USD" || value === "JPY" || value === "EUR") {
    return value;
  }
  if (
    fallback === "KRW" ||
    fallback === "USD" ||
    fallback === "JPY" ||
    fallback === "EUR"
  ) {
    return fallback;
  }
  return "KRW";
}

function mediaUrl(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const filename = text(value.filename) ?? null;
  const rawUrl = text(value.url) ?? null;
  const url =
    rawUrl?.includes("/api/media/file/") && filename
      ? `/media/${filename}`
      : (rawUrl ?? (filename ? `/media/${filename}` : null));
  return url;
}

export function pluginCartAddItem(
  line: LostCartLineClient
): Record<string, unknown> {
  return {
    product: line.productId,
    ...(line.skuId ? { variant: line.skuId } : {}),
    mode: line.mode,
    campaign: line.campaignId,
    product_name: line.productName,
    product_slug: line.productSlug,
    sku_label: line.variantLabel,
    unit_amount: line.unitAmount,
    currency: line.currency,
    schema_version: 3
  };
}

export function mapPluginCartLines(
  cart: { items?: unknown[] | null } | null | undefined,
  currencyCode: string
): LostCartLineClient[] {
  if (!Array.isArray(cart?.items)) return [];
  return cart.items.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const product = isRecord(raw.product) ? raw.product : null;
    const variant = isRecord(raw.variant) ? raw.variant : null;
    const currency = currencyOf(raw.currency, currencyCode);
    const snapshotAmount =
      typeof raw.unit_amount === "number" &&
      Number.isSafeInteger(raw.unit_amount) &&
      raw.unit_amount >= 1
        ? raw.unit_amount
        : 0;
    const unitAmount =
      snapshotAmount ||
      catalogUnitAmount(raw, currency) ||
      catalogUnitAmount(variant, currency) ||
      catalogUnitAmount(product, currency);
    const productId = relationId(raw.product);
    const skuId = relationId(raw.variant);
    const itemId = text(raw.id);
    if (!itemId || !productId) return [];
    const productName =
      text(raw.product_name) ?? text(product?.name) ?? productId;
    const productSlug = text(raw.product_slug) ?? text(product?.slug) ?? "";
    const variantLabel =
      text(raw.sku_label) ?? text(variant?.label) ?? text(variant?.sku);
    const quantity =
      typeof raw.quantity === "number" && Number.isSafeInteger(raw.quantity)
        ? raw.quantity
        : 1;
    return [
      {
        itemId,
        productId,
        skuId,
        productName,
        productSlug,
        variantLabel,
        mode: modeOf(raw.mode),
        campaignId: text(raw.campaign),
        quantity,
        unitAmount,
        currency,
        price: formatLostMoney(unitAmount, currency),
        imageUrl: mediaUrl(product?.hero_media)
      }
    ];
  });
}
