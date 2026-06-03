import type { Payload } from "payload";
import type {
  LostCartLineInput,
  LostCartLineSnapshot,
  LostCurrency,
  LostOrderMode,
  LostResolvedCheckout
} from "./types";

type AnyDoc = Record<string, any>;

const STAFF_ROLES = new Set(["admin", "editor", "cofounder"]);

export function assertLostRoleGate(user: AnyDoc, gate?: string | null) {
  if (!gate || gate === "anyone") return;
  const role = user?.role ?? "user";
  if (gate === "staff" && STAFF_ROLES.has(role)) return;
  if (gate === "resident" && ["resident", "patron", "cofounder"].includes(role))
    return;
  if (gate === "patron" && ["patron", "cofounder"].includes(role)) return;
  if (gate === "cofounder" && role === "cofounder") return;
  throw new Error("private-order-forbidden");
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("bad-quantity");
  }
  return quantity;
}

function readVariants(product: AnyDoc): AnyDoc[] {
  return Array.isArray(product.variants) ? product.variants : [];
}

function resolveVariant(product: AnyDoc, variantId?: string): AnyDoc | null {
  if (!variantId) return null;
  const variant =
    readVariants(product).find((candidate) => candidate?.id === variantId) ??
    null;
  if (!variant) throw new Error("variant-not-found");
  return variant;
}

function assertModeAllowed(product: AnyDoc, mode: LostOrderMode, user: AnyDoc) {
  if (mode === "standard_purchase" && !product.standard_enabled) {
    throw new Error("standard-disabled");
  }
  if (mode === "request_to_order" && !product.request_to_order_enabled) {
    throw new Error("request-disabled");
  }
  if (mode === "private_order") {
    if (!product.private_order_enabled) throw new Error("private-disabled");
    assertLostRoleGate(user, product.private_tier_gate);
  }
}

function resolveUnitAmount(product: AnyDoc, variant: AnyDoc | null, mode: LostOrderMode) {
  if (
    mode === "private_order" &&
    product.private_preset_price_enabled &&
    typeof product.private_unit_amount === "number"
  ) {
    return product.private_unit_amount;
  }

  if (variant && typeof variant.amount === "number") return variant.amount;
  return Number(product.unit_amount ?? 0);
}

function numericInventory(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function assertStandardAvailability(
  product: AnyDoc,
  variant: AnyDoc | null,
  quantity: number
) {
  const stockState = String(variant?.stock_state ?? product.stock_state ?? "in_stock");
  if (stockState === "out_of_stock") throw new Error("out-of-stock");
  if (stockState === "on_request") throw new Error("standard-unavailable");

  const inventory =
    numericInventory(variant?.inventory) ?? numericInventory(product.inventory);
  if (inventory !== null && quantity > inventory) {
    throw new Error("insufficient-inventory");
  }
}

function aggregateCheckoutLines(lines: LostCartLineInput[]): LostCartLineInput[] {
  const merged = new Map<string, LostCartLineInput>();
  for (const line of lines) {
    const key = [
      line.productId,
      line.variantId ?? "",
      line.mode,
      line.campaignId ?? ""
    ].join(":");
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
      continue;
    }
    merged.set(key, { ...line });
  }
  return [...merged.values()];
}

async function assertCampaign(
  payload: Payload,
  line: LostCartLineInput,
  product: AnyDoc,
  req?: Record<string, unknown>
): Promise<AnyDoc | null> {
  if (line.mode !== "request_to_order") return null;
  if (!line.campaignId) throw new Error("campaign-required");

  const campaign = (await payload.findByID({
    collection: "product-order-campaigns" as never,
    id: line.campaignId,
    depth: 0,
    req: req as never,
    overrideAccess: true
  })) as AnyDoc;

  const campaignProductId =
    typeof campaign.product === "string" ? campaign.product : campaign.product?.id;
  if (campaignProductId !== product.id || campaign.state !== "open") {
    throw new Error("campaign-not-open");
  }
  if (new Date(campaign.deadline).getTime() < Date.now()) {
    throw new Error("campaign-ended");
  }
  if (
    typeof campaign.maximum_commitments === "number" &&
    typeof campaign.paid_commitments === "number" &&
    campaign.paid_commitments >= campaign.maximum_commitments
  ) {
    throw new Error("campaign-full");
  }
  const eligible = campaign.eligible_variants;
  if (
    Array.isArray(eligible) &&
    eligible.length > 0 &&
    line.variantId &&
    !eligible.includes(line.variantId)
  ) {
    throw new Error("campaign-variant-ineligible");
  }

  return campaign;
}

export async function resolveLostCheckout(input: {
  payload: Payload;
  lines: LostCartLineInput[];
  req?: Record<string, unknown>;
  user: AnyDoc;
}): Promise<LostResolvedCheckout> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error("empty-cart");
  }

  const snapshots: LostCartLineSnapshot[] = [];
  let mode: LostOrderMode | null = null;
  let campaignId: string | undefined;
  let currency: LostCurrency | null = null;

  for (const line of aggregateCheckoutLines(input.lines)) {
    const quantity = normalizeQuantity(line.quantity);
    if (mode && mode !== line.mode) throw new Error("mixed-order-modes");
    mode = line.mode;
    if (campaignId && campaignId !== line.campaignId) {
      throw new Error("mixed-campaigns");
    }
    campaignId = line.campaignId;

    const product = (await input.payload.findByID({
      collection: "products" as never,
      id: line.productId,
      depth: 0,
      req: input.req as never,
      overrideAccess: true
    })) as AnyDoc;

    if (!product?.active) throw new Error("product-unavailable");
    assertModeAllowed(product, line.mode, input.user);
    await assertCampaign(input.payload, line, product, input.req);

    const min = Number(product.min_order_quantity ?? 1);
    const max = Number(product.max_order_quantity ?? 1);
    if (quantity < min || quantity > max) throw new Error("quantity-out-of-range");

    const variant = resolveVariant(product, line.variantId);
    if (line.mode === "standard_purchase") {
      assertStandardAvailability(product, variant, quantity);
    }
    const unitAmount = resolveUnitAmount(product, variant, line.mode);
    const lineCurrency = (product.currency ?? "KRW") as LostCurrency;
    if (currency && currency !== lineCurrency) throw new Error("mixed-currency");
    currency = lineCurrency;

    snapshots.push({
      ...line,
      quantity,
      productName: product.name,
      productSlug: product.slug,
      variantLabel: variant?.label ?? variant?.size ?? variant?.color,
      currency: lineCurrency,
      unitAmount,
      lineAmount: unitAmount * quantity
    });
  }

  const subtotalAmount = snapshots.reduce((sum, line) => sum + line.lineAmount, 0);
  return {
    mode: mode ?? "standard_purchase",
    campaignId,
    currency: currency ?? "KRW",
    subtotalAmount,
    totalAmount: subtotalAmount,
    lines: snapshots
  };
}
