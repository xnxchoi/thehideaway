import config from "@payload-config";
import { getPayload } from "payload";
import { formatLostMoney } from "./format";
import type { LostCurrency, LostOrderMode } from "./types";

type AnyDoc = Record<string, any>;

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
  heroVideoUrl?: string | null;
  modes: LostOrderMode[];
  stockState?: string | null;
  campaign?: LostCampaignView | null;
};

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
};

function mediaView(
  media: unknown
): { url?: string | null; alt?: string | null; mimeType?: string | null } {
  if (!media || typeof media === "string") return {};
  const doc = media as AnyDoc;
  return {
    url: doc.url ?? (doc.filename ? `/media/${doc.filename}` : null),
    alt: doc.alt ?? doc.filename ?? null,
    mimeType: doc.mimeType ?? null
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
  const hero = mediaView(product.hero_media);
  const galleryImage = Array.isArray(product.gallery)
    ? product.gallery.map(mediaView).find(isImage)
    : null;
  const currency = (product.currency ?? "KRW") as LostCurrency;
  const unitAmount = Number(product.unit_amount ?? 0);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    currency,
    unitAmount,
    price: formatLostMoney(unitAmount, currency),
    imageUrl: isImage(hero) ? hero.url : galleryImage?.url,
    imageAlt: (isImage(hero) ? hero.alt : galleryImage?.alt) ?? product.name,
    heroVideoUrl: isVideo(hero) ? hero.url : null,
    modes: modes(product),
    stockState: product.stock_state,
    campaign: campaign
      ? {
          id: campaign.id,
          title: campaign.title,
          minimumCommitments: Number(campaign.minimum_commitments ?? 0),
          paidCommitments: Number(campaign.paid_commitments ?? 0),
          deadline: campaign.deadline,
          progressVisibility: campaign.progress_visibility ?? "hidden"
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
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
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
      card(product, await activeCampaignFor(product.id))
    )
  );

  return {
    products,
    drops: (dropsResult.docs as AnyDoc[]).map((drop) => ({
      title: drop.title,
      slug: drop.slug,
      kicker: drop.kicker,
      lede: drop.lede
    }))
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
    ...card(product, await activeCampaignFor(product.id)),
    details: product.details,
    care: product.care,
    shippingReturns: product.shipping_returns,
    gallery,
    privatePresetPriceEnabled: Boolean(product.private_preset_price_enabled),
    privateUnitAmount:
      typeof product.private_unit_amount === "number"
        ? product.private_unit_amount
        : null
  };
}

export async function getLostCollectionBySlug(slug: string): Promise<{
  title: string;
  kicker?: string;
  lede?: string;
  products: LostProductCard[];
} | null> {
  const payload = await getPayload({ config });
  const dropResult = await payload.find({
    collection: "product-drops" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [{ slug: { equals: slug } }, { active: { equals: true } }]
    } as never
  });
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
      card(product, await activeCampaignFor(product.id))
    )
  );

  return {
    title: drop.title,
    kicker: drop.kicker,
    lede: drop.lede,
    products
  };
}
