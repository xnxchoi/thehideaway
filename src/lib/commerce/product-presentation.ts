import config from "@payload-config";
import { getPayload } from "payload";

import { formatLostMoney } from "@/lib/lost-commerce/format";
import type { LostProductDetail } from "@/lib/lost-commerce/queries";

type MediaView = { url: string; alt?: string | null };

function mediaView(value: unknown): MediaView | null {
  if (!value || typeof value === "string" || typeof value !== "object") {
    return null;
  }
  const media = value as {
    alt?: unknown;
    filename?: unknown;
    url?: unknown;
  };
  const filename = typeof media.filename === "string" ? media.filename : null;
  const rawUrl = typeof media.url === "string" ? media.url : null;
  const url =
    rawUrl?.includes("/api/media/file/") && filename
      ? `/media/${filename}`
      : (rawUrl ?? (filename ? `/media/${filename}` : null));
  if (!url) return null;
  return {
    url,
    alt: typeof media.alt === "string" ? media.alt : filename
  };
}

function toPresentationProduct(
  doc: Record<string, unknown>
): LostProductDetail {
  const name = String(doc.name ?? "");
  const hero = mediaView(doc.hero_media);
  const gallery = Array.isArray(doc.gallery)
    ? doc.gallery.flatMap((item) => {
        const media = mediaView(item);
        return media ? [media] : [];
      })
    : [];
  const images = [hero, ...gallery].filter(
    (item): item is MediaView => item !== null
  );
  const unitAmount = Number(doc.unit_amount);

  return Object.freeze({
    id: String(doc.id),
    name,
    slug: String(doc.slug),
    summary: typeof doc.summary === "string" ? doc.summary : null,
    description: doc.description as LostProductDetail["description"],
    details: typeof doc.details === "string" ? doc.details : null,
    care: typeof doc.care === "string" ? doc.care : null,
    shippingReturns:
      typeof doc.shipping_returns === "string" ? doc.shipping_returns : null,
    currency: "KRW",
    unitAmount,
    price: formatLostMoney(unitAmount, "KRW"),
    displayPrice: null,
    imageUrl: images[0]?.url ?? null,
    imageAlt: images[0]?.alt ?? name,
    galleryPreview: images.slice(0, 5),
    gallery: images,
    heroVideoUrl: null,
    modes: [],
    stockState: null,
    campaign: null,
    privatePresetPriceEnabled: false,
    privateUnitAmount: null,
    variants: []
  });
}

export async function getCommerceProductPresentation(
  slug: string
): Promise<LostProductDetail | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "commerce-products",
    depth: 1,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [{ slug: { equals: slug } }, { active: { equals: true } }]
    }
  });
  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined;
  return doc ? toPresentationProduct(doc) : null;
}

export async function getCommerceFragrancePresentation(): Promise<LostProductDetail | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "commerce-products",
    depth: 1,
    limit: 24,
    overrideAccess: true,
    sort: "sort",
    where: { active: { equals: true } }
  });
  const doc = (result.docs as unknown as Record<string, unknown>[]).find(
    (product) =>
      /fragrance|perfume|parfum|향/i.test(
        `${String(product.slug ?? "")} ${String(product.name ?? "")}`
      )
  );
  return doc ? toPresentationProduct(doc) : null;
}
