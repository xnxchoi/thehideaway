import config from "@payload-config";
import { getPayload } from "payload";
import { formatLostMoney } from "./format";
import {
  normalizeLostDropCard,
  normalizeLostProductVariants,
  type LostDropCard,
  type LostProductVariant
} from "./query-normalizers";
import type { LostCurrency, LostOrderMode } from "./types";

type AnyDoc = Record<string, unknown>;

export type LostProductCard = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  currency: LostCurrency;
  unitAmount: number;
  price: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  galleryPreview: Array<{ url: string; alt?: string | null }>;
  heroVideoUrl?: string | null;
  modes: LostOrderMode[];
  stockState?: string | null;
  campaign?: LostCampaignView | null;
};

export type { LostDropCard, LostProductVariant };

export type LostCampaignView = {
  id: string;
  title: string;
  minimumCommitments: number;
  paidCommitments: number;
  deadline: string;
  progressVisibility: "hidden" | "percentage" | "count";
};

export type LostProductDetail = LostProductCard & {
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

function modes(product: AnyDoc): LostOrderMode[] {
  return [
    product.standard_enabled ? "standard_purchase" : null,
    product.request_to_order_enabled ? "request_to_order" : null,
    product.private_order_enabled ? "private_order" : null
  ].filter(Boolean) as LostOrderMode[];
}

function card(product: AnyDoc, campaign?: AnyDoc | null): LostProductCard {
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
  const currency = stringValue(product.currency, "KRW") as LostCurrency;
  const unitAmount = numberValue(product.unit_amount);
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
    price: formatLostMoney(unitAmount, currency),
    imageUrl: primaryImage?.url,
    imageAlt: primaryImage?.alt ?? productName,
    galleryPreview: galleryPreview.slice(0, 5),
    heroVideoUrl: isVideo(hero) ? hero.url : null,
    modes: modes(product),
    stockState: nullableString(product.stock_state),
    campaign: campaign
      ? {
          id: stringValue(campaign.id),
          title: stringValue(campaign.title),
          minimumCommitments: numberValue(campaign.minimum_commitments),
          paidCommitments: numberValue(campaign.paid_commitments),
          deadline: stringValue(campaign.deadline),
          progressVisibility: progressVisibilityValue(
            campaign.progress_visibility
          )
        }
      : null
  };
}

async function activeCampaignFor(productId: string): Promise<AnyDoc | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "product-order-campaigns" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: "deadline",
    where: {
      and: [
        { product: { equals: productId } },
        { state: { equals: "open" } },
        { deadline: { greater_than: new Date().toISOString() } }
      ]
    } as never
  });
  return (result.docs[0] as AnyDoc | undefined) ?? null;
}

export async function getLostHomeData(): Promise<{
  products: LostProductCard[];
  drops: LostDropCard[];
}> {
  const payload = await getPayload({ config });
  const [productsResult, dropsResult] = await Promise.all([
    payload.find({
      collection: "products" as never,
      depth: 1,
      limit: 24,
      overrideAccess: true,
      sort: "sort",
      where: {
        and: [
          { active: { equals: true } },
          { storefront: { equals: "lostinseoul" } }
        ]
      } as never
    }),
    payload.find({
      collection: "product-drops" as never,
      depth: 0,
      limit: 8,
      overrideAccess: true,
      sort: "sort",
      where: { active: { equals: true } } as never
    })
  ]);

  const products = await Promise.all(
    (productsResult.docs as AnyDoc[]).map(async (product) =>
      card(product, await activeCampaignFor(stringValue(product.id)))
    )
  );

  return {
    products,
    drops: (dropsResult.docs as AnyDoc[]).map(normalizeLostDropCard)
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
        { storefront: { equals: "lostinseoul" } }
      ]
    } as never
  });
  const product = result.docs[0] as AnyDoc | undefined;
  if (!product) return null;

  const gallery = Array.isArray(product.gallery)
    ? product.gallery
        .map(mediaView)
        .filter((item) => item.url)
        .map((item) => ({ url: item.url as string, alt: item.alt }))
    : [];

  return {
    ...card(product, await activeCampaignFor(stringValue(product.id))),
    details: nullableString(product.details),
    care: nullableString(product.care),
    shippingReturns: nullableString(product.shipping_returns),
    gallery,
    privatePresetPriceEnabled: Boolean(product.private_preset_price_enabled),
    privateUnitAmount:
      typeof product.private_unit_amount === "number"
        ? product.private_unit_amount
        : null,
    variants: normalizeLostProductVariants(product)
  };
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
      collection: "product-drops" as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ slug: { equals: slug } }, { active: { equals: true } }]
      } as never
    }),
    payload.find({
      collection: "product-drops" as never,
      depth: 0,
      limit: 8,
      overrideAccess: true,
      sort: "sort",
      where: { active: { equals: true } } as never
    })
  ]);
  const drop = dropResult.docs[0] as AnyDoc | undefined;
  if (!drop) return null;

  const productResult = await payload.find({
    collection: "products" as never,
    depth: 1,
    limit: 48,
    overrideAccess: true,
    sort: "sort",
    where: {
      and: [
        { active: { equals: true } },
        { storefront: { equals: "lostinseoul" } },
        { drop: { equals: drop.id } }
      ]
    } as never
  });

  const products = await Promise.all(
    (productResult.docs as AnyDoc[]).map(async (product) =>
      card(product, await activeCampaignFor(stringValue(product.id)))
    )
  );

  return {
    title: stringValue(drop.title),
    kicker: nullableString(drop.kicker) ?? undefined,
    lede: nullableString(drop.lede) ?? undefined,
    products,
    drops: (dropsResult.docs as AnyDoc[]).map(normalizeLostDropCard)
  };
}
