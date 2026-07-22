import type { Payload } from "payload";
import type {
  LostCartLineInput,
  LostCartLineSnapshot,
  LostCurrency,
  LostOrderMode,
  LostResolvedCheckout
} from "./types";
import {
  buildCommerceSkuSnapshot,
  productIdOfSku,
  type ProductSkuForSnapshot
} from "./product-skus";

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

async function resolveSku(
  payload: Payload,
  line: LostCartLineInput,
  req?: Record<string, unknown>
): Promise<ProductSkuForSnapshot & AnyDoc> {
  if (!line.skuId && !line.variantId) throw new Error("sku-required");

  let sku: AnyDoc | null | undefined;
  if (line.skuId) {
    sku = (await payload.findByID({
      collection: "product-variants",
      id: line.skuId,
      depth: 0,
      disableErrors: true,
      req: req as never,
      overrideAccess: true
    })) as AnyDoc | null;
    if (!sku) throw new Error("sku-not-found");
  } else {
    const result = await payload.find({
      collection: "product-variants",
      depth: 0,
      limit: 2,
      req: req as never,
      overrideAccess: true,
      where: {
        and: [
          { product: { equals: line.productId } },
          { legacy_variant_ref: { equals: line.variantId } }
        ]
      }
    });
    if (result.docs.length !== 1) throw new Error("sku-not-found");
    sku = result.docs[0] as AnyDoc;
  }

  if (!sku?.active) throw new Error("sku-inactive");
  if (productIdOfSku(sku.product) !== line.productId) {
    throw new Error("sku-product-mismatch");
  }
  return sku as ProductSkuForSnapshot & AnyDoc;
}

function aggregateCheckoutLines(
  lines: LostCartLineInput[]
): LostCartLineInput[] {
  const merged = new Map<string, LostCartLineInput>();
  for (const line of lines) {
    const key = [
      line.productId,
      line.skuId ?? line.variantId ?? "",
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

function assertCampaignUsage(lines: LostCartLineInput[]): void {
  for (const line of lines) {
    if (line.mode !== "request_to_order" && line.campaignId !== undefined) {
      throw new Error("campaign-not-allowed");
    }
  }
}

async function assertCampaign(
  payload: Payload,
  line: LostCartLineInput,
  product: AnyDoc,
  skuId: string,
  req?: Record<string, unknown>
): Promise<AnyDoc | null> {
  if (line.mode !== "request_to_order") return null;
  if (!line.campaignId) throw new Error("campaign-required");

  const campaign = (await payload.findByID({
    collection: "product-order-campaigns" as never,
    id: line.campaignId,
    depth: 0,
    disableErrors: true,
    req: req as never,
    overrideAccess: true
  })) as AnyDoc | null;

  if (!campaign) throw new Error("campaign-not-open");

  const campaignProductId =
    typeof campaign.product === "string"
      ? campaign.product
      : campaign.product?.id;
  if (campaignProductId !== product.id || campaign.state !== "open") {
    throw new Error("campaign-not-open");
  }
  if (new Date(campaign.deadline).getTime() < Date.now()) {
    throw new Error("campaign-ended");
  }
  if (typeof campaign.maximum_commitments === "number") {
    throw new Error("campaign-capacity-reservations-unavailable");
  }
  const eligible = Array.isArray(campaign.eligible_skus)
    ? campaign.eligible_skus.map((value: unknown) =>
        typeof value === "string"
          ? value
          : String((value as { id?: unknown })?.id ?? "")
      )
    : [];
  if (!eligible.includes(skuId)) {
    throw new Error("campaign-sku-ineligible");
  }

  return campaign;
}

export async function resolveLostCheckout(input: {
  payload: Payload;
  lines: LostCartLineInput[];
  req?: Record<string, unknown>;
  user: AnyDoc;
  allowUnpricedPrivateOrder?: boolean;
}): Promise<LostResolvedCheckout> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error("empty-cart");
  }
  assertCampaignUsage(input.lines);

  const snapshots: LostCartLineSnapshot[] = [];
  let mode: LostOrderMode | null = null;
  let campaignId: string | undefined;
  let currency: LostCurrency | null = null;

  for (const line of aggregateCheckoutLines(input.lines)) {
    const quantity = normalizeQuantity(line.quantity);
    if (mode && mode !== line.mode) throw new Error("mixed-order-modes");
    mode = line.mode;

    const product = (await input.payload.findByID({
      collection: "products" as never,
      id: line.productId,
      depth: 0,
      disableErrors: true,
      req: input.req as never,
      overrideAccess: true
    })) as AnyDoc | null;

    if (!product?.active || product.storefront !== "lostinseoul") {
      throw new Error("product-unavailable");
    }
    assertModeAllowed(product, line.mode, input.user);

    const sku = await resolveSku(input.payload, line, input.req);
    const campaign = await assertCampaign(
      input.payload,
      line,
      product,
      sku.id,
      input.req
    );
    const validatedCampaignId = campaign ? line.campaignId : undefined;
    if (campaignId && campaignId !== validatedCampaignId) {
      throw new Error("mixed-campaigns");
    }
    if (validatedCampaignId) campaignId = validatedCampaignId;

    const min = Number(product.min_order_quantity ?? 1);
    const max = Number(product.max_order_quantity ?? 1);
    if (quantity < min || quantity > max)
      throw new Error("quantity-out-of-range");

    const lineCurrency = (product.currency ?? "KRW") as LostCurrency;
    if (currency && currency !== lineCurrency)
      throw new Error("mixed-currency");
    currency = lineCurrency;

    snapshots.push(
      buildCommerceSkuSnapshot({
        product: {
          id: String(product.id),
          name: String(product.name ?? ""),
          slug: String(product.slug ?? ""),
          currency: lineCurrency,
          unit_amount: Number(product.unit_amount ?? 0),
          private_preset_price_enabled: product.private_preset_price_enabled,
          private_unit_amount: product.private_unit_amount
        },
        sku,
        quantity,
        mode: line.mode,
        campaignId: validatedCampaignId,
        allowUnpricedPrivateOrder: input.allowUnpricedPrivateOrder
      })
    );
  }

  const subtotalAmount = snapshots.reduce(
    (sum, line) => sum + line.lineAmount,
    0
  );
  return {
    mode: mode ?? "standard_purchase",
    campaignId,
    currency: currency ?? "KRW",
    subtotalAmount,
    totalAmount: subtotalAmount,
    lines: snapshots
  };
}
