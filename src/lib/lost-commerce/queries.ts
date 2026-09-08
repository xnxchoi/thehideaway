import config from "@payload-config";
import { getPayload } from "payload";
import type { Product } from "@/payload-types";
import { catalogUnitAmount } from "@/payload/plugins/ecommerce/catalog-money";
import { formatLostMoney } from "./format";
import { getStorefrontInventoryAvailability } from "./storefront-inventory-availability";
import {
  normalizeLostDropCard,
  normalizeLostProductSkus,
  type LostDropCard,
  type LostProductVariant as NormalizedLostProductVariant
} from "./query-normalizers";
import type { LostCurrency, LostOrderMode } from "./types";

type AnyDoc = Record<string, unknown>;

export type ProductListing = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  currency: LostCurrency;
  unitAmount: number;
  price: string;
  displayPrice: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  galleryPreview: Array<{ url: string; alt?: string | null }>;
  heroVideoUrl?: string | null;
  modes: LostOrderMode[];
  stockState?: string | null;
  campaign?: LostCampaignView | null;
};

export type { LostDropCard };

export type ProductType = NormalizedLostProductVariant & {
  actionableModes: LostOrderMode[];
  stockState: "in_stock" | "out_of_stock" | "on_request" | null;
};

export type LostCampaignView = {
  id: string;
  title: string;
  minimumCommitments: number;
  paidCommitments: number;
  deadline: string;
  progressVisibility: "hidden" | "percentage" | "count";
  eligibleSkuIds: string[];
};

export type LostProductDetail = LostProductCard & {
  description?: Product["description"];
  details?: string | null;
  care?: string | null;
  shippingReturns?: string | null;
  gallery: Array<{ url: string; alt?: string | null }>;
  privatePresetPriceEnabled?: boolean;
  privateUnitAmount?: number | null;
  variants: LostProductVariant[];
};

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function richTextValue(value: unknown): Product["description"] {
  if (!value || typeof value !== "object") return null;
  const root = (value as { root?: unknown }).root;
  if (!root || typeof root !== "object") return null;
  const children = (root as { children?: unknown }).children;
  if (!Array.isArray(children) || children.length === 0) return null;
  return value as NonNullable<Product["description"]>;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : Number(value ?? fallback);
}

function progressVisibilityValue(
  value: unknown
): LostCampaignView["progressVisibility"] {
  return value === "percentage" || value === "count" || value === "hidden"
    ? value
    : "hidden";
}

function mediaView(media: unknown): {
  url?: string | null;
  alt?: string | null;
  mimeType?: string | null;
} {
  if (!media || typeof media === "string") return {};
  const doc = media as AnyDoc;
  const rawUrl = typeof doc.url === "string" ? doc.url : null;
  const filename = typeof doc.filename === "string" ? doc.filename : null;
  const url =
    rawUrl?.includes("/api/media/file/") && filename
      ? `/media/${filename}`
      : (rawUrl ?? (filename ? `/media/${filename}` : null));
  return {
    url,
    alt: nullableString(doc.alt) ?? filename,
    mimeType: nullableString(doc.mimeType)
  };
}

function isImage(media: ReturnType<typeof mediaView>) {
  if (media.mimeType) return media.mimeType.startsWith("image/");
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(media.url ?? "");
}

function isVideo(media: ReturnType<typeof mediaView>) {
  if (media.mimeType) return media.mimeType.startsWith("video/");
  return /\.(m4v|mov|mp4|webm)$/i.test(media.url ?? "");
}

const LOST_ORDER_MODES: readonly LostOrderMode[] = [
  "standard_purchase",
  "request_to_order",
  "private_order"
];

function isPositiveAmount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 1;
}

function hasActiveSkuIdentity(variant: NormalizedLostProductVariant): boolean {
  return Boolean(variant.id.trim() && variant.sku?.trim());
}

function isStandardSkuActionable(
  variant: NormalizedLostProductVariant,
  availableToPromise: number | undefined
) {
  return (
    isPositiveAmount(variant.amount) &&
    Number.isSafeInteger(availableToPromise) &&
    Number(availableToPromise) >= 1
  );
}

function campaignEligibleSkuIds(campaign?: AnyDoc | null): string[] {
  if (!Array.isArray(campaign?.eligible_skus)) return [];

  return campaign.eligible_skus.flatMap((value) => {
    const id =
      typeof value === "string"
        ? value
        : stringValue((value as AnyDoc | null)?.id);
    return id ? [id] : [];
  });
}

function isCampaignCheckoutActionable(campaign?: AnyDoc | null): boolean {
  if (!campaign) return false;
  const maximum = campaign.maximum_commitments;
  return maximum == null;
}

function annotateActionableModes(
  product: AnyDoc,
  campaign: AnyDoc | null,
  variants: NormalizedLostProductVariant[],
  availableToPromiseBySku: ReadonlyMap<string, number>
): LostProductVariant[] {
  const eligibleRequestSkuIds = new Set(
    isCampaignCheckoutActionable(campaign)
      ? campaignEligibleSkuIds(campaign)
      : []
  );
  const hasPrivatePreset =
    product.private_preset_price_enabled === true &&
    isPositiveAmount(product.private_unit_amount);
  const isQuoteOnly = product.private_preset_price_enabled !== true;

  return variants.map((variant) => {
    if (!hasActiveSkuIdentity(variant)) {
      return { ...variant, actionableModes: [], stockState: null };
    }
    const actionableModes = [
      product.standard_enabled &&
      isStandardSkuActionable(variant, availableToPromiseBySku.get(variant.id))
        ? "standard_purchase"
        : null,
      product.request_to_order_enabled &&
      eligibleRequestSkuIds.has(variant.id) &&
      isPositiveAmount(variant.amount)
        ? "request_to_order"
        : null,
      product.private_order_enabled && (isQuoteOnly || hasPrivatePreset)
        ? "private_order"
        : null
    ].filter(Boolean) as LostOrderMode[];

    const availableToPromise = availableToPromiseBySku.get(variant.id);
    const hasStandardAvailability =
      product.standard_enabled &&
      Number.isSafeInteger(availableToPromise) &&
      Number(availableToPromise) >= 1;
    const hasRequestAvailability =
      actionableModes.includes("request_to_order") ||
      actionableModes.includes("private_order");
    const stockState = hasStandardAvailability
      ? "in_stock"
      : hasRequestAvailability
        ? "on_request"
        : product.standard_enabled
          ? "out_of_stock"
          : null;

    return { ...variant, actionableModes, stockState };
  });
}

function modes(variants: LostProductVariant[]): LostOrderMode[] {
  return LOST_ORDER_MODES.filter((mode) =>
    variants.some((variant) => variant.actionableModes.includes(mode))
  );
}

function cardPrice(
  product: AnyDoc,
  variants: LostProductVariant[],
  currency: LostCurrency
): { unitAmount: number; price: string } {
  const amounts = variants.flatMap((variant) =>
    typeof variant.amount === "number" && Number.isFinite(variant.amount)
      ? [variant.amount]
      : []
  );
  const unitAmount = amounts[0] ?? catalogUnitAmount(product);
  const distinctAmounts = [...new Set(amounts)].sort((a, b) => a - b);
  const price =
    distinctAmounts.length > 1
      ? `${formatLostMoney(distinctAmounts[0], currency)}–${formatLostMoney(
          distinctAmounts[distinctAmounts.length - 1],
          currency
        )}`
      : formatLostMoney(unitAmount, currency);

  return { unitAmount, price };
}

function cardDisplayPrice(
  product: AnyDoc,
  productModes: LostOrderMode[],
  variants: LostProductVariant[],
  currency: LostCurrency
): string | null {
  const pricedMode = productModes.find(
    (mode) => mode === "standard_purchase" || mode === "request_to_order"
  );
  const pricedVariants = pricedMode
    ? variants.filter((variant) => variant.actionableModes.includes(pricedMode))
    : productModes.length === 0 && product.request_to_order_enabled === true
      ? variants
      : [];
  if (pricedVariants.length > 0) {
    const amounts = pricedVariants.flatMap((variant) =>
      isPositiveAmount(variant.amount) ? [variant.amount] : []
    );
    const distinctAmounts = [...new Set(amounts)].sort((a, b) => a - b);
    if (distinctAmounts.length === 0) return null;
    if (distinctAmounts.length === 1) {
      return formatLostMoney(distinctAmounts[0], currency);
    }
    return `${formatLostMoney(distinctAmounts[0], currency)}–${formatLostMoney(
      distinctAmounts[distinctAmounts.length - 1],
      currency
    )}`;
  }

  return productModes.includes("private_order") &&
    product.private_preset_price_enabled === true &&
    isPositiveAmount(product.private_unit_amount)
    ? formatLostMoney(product.private_unit_amount, currency)
    : null;
}

function card(
  product: AnyDoc,
  campaign?: AnyDoc | null,
  variants: LostProductVariant[] = []
): LostProductCard {
  const productId = stringValue(product.id);
  const productName = stringValue(product.name);
  const hero = mediaView(product.hero_media);
  const galleryImages = Array.isArray(product.gallery)
    ? product.gallery
        .map(mediaView)
        .filter(isImage)
        .filter((item): item is typeof item & { url: string } =>
          Boolean(item.url)
        )
    : [];
  const galleryImage = galleryImages[0];
  const currency = "KRW" as LostCurrency;
  const { unitAmount, price } = cardPrice(product, variants, currency);
  const productModes = modes(variants);
  const primaryImage = isImage(hero) && hero.url ? hero : galleryImage;
  const galleryPreview = [
    ...(primaryImage?.url
      ? [{ url: primaryImage.url, alt: primaryImage.alt ?? productName }]
      : []),
    ...galleryImages.map((item) => ({ url: item.url, alt: item.alt }))
  ].filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.url === item.url) === index
  );

  return {
    id: productId,
    name: productName,
    slug: stringValue(product.slug),
    summary: nullableString(product.summary),
    currency,
    unitAmount,
    price,
    displayPrice: cardDisplayPrice(product, productModes, variants, currency),
    imageUrl: primaryImage?.url,
    imageAlt: primaryImage?.alt ?? productName,
    galleryPreview: galleryPreview.slice(0, 5),
    heroVideoUrl: isVideo(hero) ? hero.url : null,
    modes: productModes,
    stockState: variants[0]?.stockState ?? null,
    campaign: campaign
      ? {
          id: stringValue(campaign.id),
          title: stringValue(campaign.title),
          minimumCommitments: numberValue(campaign.minimum_commitments),
          paidCommitments: numberValue(campaign.paid_commitments),
          deadline: stringValue(campaign.deadline),
          progressVisibility: progressVisibilityValue(
            campaign.progress_visibility
          ),
          eligibleSkuIds: campaignEligibleSkuIds(campaign)
        }
      : null
  };
}

async function activeSkusByProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  products: AnyDoc[]
): Promise<Map<string, NormalizedLostProductVariant[]>> {
  const ids = products
    .map((product) => stringValue(product.id))
    .filter(Boolean);
  if (ids.length === 0) return new Map();
  const documents: AnyDoc[] = [];
  const limit = Math.max(100, ids.length * 20);
  let page = 1;

  while (true) {
    const result = await payload.find({
      collection: "variants",
      depth: 2,
      limit,
      overrideAccess: true,
      page,
      sort: "sort",
      where: {
        and: [
          { active: { equals: true } },
          { _status: { equals: "published" } },
          { product: { in: ids } }
        ]
      }
    });
    documents.push(...(result.docs as unknown as AnyDoc[]));

    if (!result.hasNextPage) break;
    if (typeof result.nextPage !== "number" || result.nextPage <= page) {
      throw new Error("Invalid product SKU pagination state");
    }
    page = result.nextPage;
  }

  return new Map(
    products.map((product) => {
      const productId = stringValue(product.id);
      const related = documents.filter((sku) => {
        const relation = sku.product;
        return (
          (typeof relation === "string"
            ? relation
            : stringValue((relation as AnyDoc | undefined)?.id)) === productId
        );
      });
      return [productId, normalizeLostProductSkus(product, related)];
    })
  );
}

function inventoryLedgerRegistered(
  payload: Awaited<ReturnType<typeof getPayload>>
): boolean {
  return Boolean(
    payload.collections &&
      "inventory-levels" in payload.collections &&
      "stock-locations" in payload.collections
  );
}

async function storefrontAvailability(
  payload: Awaited<ReturnType<typeof getPayload>>,
  skuMap: ReadonlyMap<string, readonly NormalizedLostProductVariant[]>
): Promise<ReadonlyMap<string, number>> {
  const skuIds = [...skuMap.values()].flatMap((variants) =>
    variants.map((variant) => variant.id)
  );
  if (!inventoryLedgerRegistered(payload)) {
    return new Map(skuIds.map((id) => [id, 1]));
  }
  return getStorefrontInventoryAvailability({
    payload,
    paymentProvider: "portone",
    skuIds
  });
}

async function activeCampaignFor(productId: string): Promise<AnyDoc | null> {
  const payload = await getPayload({ config });
  if (
    !payload.collections ||
    !("product-order-campaigns" in payload.collections)
  ) {
    return null;
  }
  const result = await payload.find({
    collection: "product-order-campaigns" as never,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    sort: "deadline",
    where: {
      and: [
        { product: { equals: productId } },
        { state: { equals: "open" } },
        { deadline: { greater_than: new Date().toISOString() } }
      ]
    }
  });
  return (result.docs as unknown as AnyDoc[]).find(
    isCampaignCheckoutActionable
  ) ?? null;
}

export async function getLostHomeData(): Promise<{
  products: LostProductCard[];
  drops: LostDropCard[];
}> {
  const payload = await getPayload({ config });
  const [productsResult, dropsResult] = await Promise.all([
    payload.find({
      collection: "products",
      depth: 1,
      limit: 24,
      overrideAccess: true,
      sort: "sort",
      where: {
        and: [
          { active: { equals: true } },
          { _status: { equals: "published" } },
          { storefront: { equals: "lostinseoul" } }
        ]
      }
    }),
    payload.find({
      collection: "product-drops",
      depth: 0,
      limit: 8,
      overrideAccess: true,
      sort: "sort",
      where: { active: { equals: true } }
    })
  ]);

  const productDocs = productsResult.docs as unknown as AnyDoc[];
  const skuMap = await activeSkusByProduct(payload, productDocs);
  const availableToPromiseBySku = await storefrontAvailability(payload, skuMap);
  const products = await Promise.all(
    productDocs.map(async (product) => {
      const campaign = await activeCampaignFor(stringValue(product.id));
      const variants = annotateActionableModes(
        product,
        campaign,
        skuMap.get(stringValue(product.id)) ?? [],
        availableToPromiseBySku
      );
      return card(product, campaign, variants);
    })
  );

  return {
    products,
    drops: (dropsResult.docs as unknown as AnyDoc[]).map(normalizeLostDropCard)
  };
}

export async function getLostProductBySlug(
  slug: string
): Promise<LostProductDetail | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products" as never,
    depth: 1,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { slug: { equals: slug } },
        { active: { equals: true } },
        { _status: { equals: "published" } },
        { storefront: { equals: "lostinseoul" } }
      ]
    }
  });
  const product = result.docs[0] as unknown as AnyDoc | undefined;
  if (!product) return null;
  const skuMap = await activeSkusByProduct(payload, [product]);
  const availableToPromiseBySku = await storefrontAvailability(payload, skuMap);
  const campaign = await activeCampaignFor(stringValue(product.id));
  const variants = annotateActionableModes(
    product,
    campaign,
    skuMap.get(stringValue(product.id)) ?? [],
    availableToPromiseBySku
  );

  const gallery = Array.isArray(product.gallery)
    ? product.gallery
        .map(mediaView)
        .filter((item) => item.url)
        .map((item) => ({ url: item.url as string, alt: item.alt }))
    : [];

  return {
    ...card(product, campaign, variants),
    description: richTextValue(product.description),
    details: nullableString(product.details),
    care: nullableString(product.care),
    shippingReturns: nullableString(product.shipping_returns),
    gallery,
    privatePresetPriceEnabled: Boolean(product.private_preset_price_enabled),
    privateUnitAmount:
      typeof product.private_unit_amount === "number"
        ? product.private_unit_amount
        : null,
    variants
  };
}

const LOST_FRAGRANCE_CATEGORY_PATTERN = /fragrance|perfume|parfum|향/i;

function categoryMatchesFragrance(category: unknown): boolean {
  if (!category || typeof category === "string") return false;
  const doc = category as AnyDoc;
  return [doc.slug, doc.name]
    .filter((value): value is string => typeof value === "string")
    .some((value) => LOST_FRAGRANCE_CATEGORY_PATTERN.test(value));
}

export async function getLostFragranceData(): Promise<LostProductDetail | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products" as never,
    depth: 1,
    limit: 24,
    overrideAccess: true,
    sort: "sort",
    where: {
      and: [
        { active: { equals: true } },
        { _status: { equals: "published" } },
        { storefront: { equals: "lostinseoul" } }
      ]
    }
  });
  const fragrance = (result.docs as unknown as AnyDoc[]).find((product) =>
    categoryMatchesFragrance(product.category)
  );
  const slug = fragrance ? stringValue(fragrance.slug) : "";
  if (!slug) return null;
  return getLostProductBySlug(slug);
}

export async function getLostCollectionBySlug(slug: string): Promise<{
  title: string;
  kicker?: string;
  lede?: string;
  products: LostProductCard[];
  drops: LostDropCard[];
} | null> {
  const payload = await getPayload({ config });
  const [dropResult, dropsResult] = await Promise.all([
    payload.find({
      collection: "product-drops",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ slug: { equals: slug } }, { active: { equals: true } }]
      }
    }),
    payload.find({
      collection: "product-drops",
      depth: 0,
      limit: 8,
      overrideAccess: true,
      sort: "sort",
      where: { active: { equals: true } }
    })
  ]);
  const drop = dropResult.docs[0] as unknown as AnyDoc | undefined;
  if (!drop) return null;

  const productResult = await payload.find({
    collection: "products",
    depth: 1,
    limit: 48,
    overrideAccess: true,
    sort: "sort",
    where: {
      and: [
        { active: { equals: true } },
        { _status: { equals: "published" } },
        { storefront: { equals: "lostinseoul" } },
        { drop: { equals: drop.id } }
      ]
    }
  });

  const productDocs = productResult.docs as unknown as AnyDoc[];
  const skuMap = await activeSkusByProduct(payload, productDocs);
  const availableToPromiseBySku = await storefrontAvailability(payload, skuMap);
  const products = await Promise.all(
    productDocs.map(async (product) => {
      const campaign = await activeCampaignFor(stringValue(product.id));
      const variants = annotateActionableModes(
        product,
        campaign,
        skuMap.get(stringValue(product.id)) ?? [],
        availableToPromiseBySku
      );
      return card(product, campaign, variants);
    })
  );

  return {
    title: stringValue(drop.title),
    kicker: nullableString(drop.kicker) ?? undefined,
    lede: nullableString(drop.lede) ?? undefined,
    products,
    drops: (dropsResult.docs as unknown as AnyDoc[]).map(normalizeLostDropCard)
  };
}
