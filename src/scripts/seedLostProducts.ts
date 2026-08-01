/**
 * Development-only LOSTINSEOUL catalog seed.
 *
 * Product drafts contain only confirmed structural facts. They remain inactive
 * and have no SKU rows until reviewed SKU, price, and stock facts are supplied.
 */
import config from "@payload-config";
import { getPayload, type Payload } from "payload";

import { LOST_FRAGRANCE_SEED_PRODUCTS } from "./seedLostProductCatalog";

async function ensureFragranceCategory(payload: Payload): Promise<string> {
  const found = await payload.find({
    collection: "product-category",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "fragrance" } }
  });
  if (found.docs[0]) return found.docs[0].id;
  const created = await payload.create({
    collection: "product-category",
    overrideAccess: true,
    data: { name: "Fragrance", slug: "fragrance", sort: 10 }
  });
  return created.id;
}

async function ensureProductDrafts(
  payload: Payload,
  categoryId: string
): Promise<void> {
  for (const product of LOST_FRAGRANCE_SEED_PRODUCTS) {
    const data = {
      name: product.name,
      slug: product.slug,
      summary: product.summary,
      category: categoryId,
      storefront: "lostinseoul",
      active: product.active,
      currency: product.currency,
      unit_amount: product.unit_amount,
      standard_enabled: product.standard_enabled,
      request_to_order_enabled: product.request_to_order_enabled,
      private_order_enabled: product.private_order_enabled,
      private_preset_price_enabled: product.private_preset_price_enabled,
      private_tier_gate: product.private_tier_gate,
      min_order_quantity: product.min_order_quantity,
      max_order_quantity: product.max_order_quantity,
      sort: product.sort
    } as const;
    const found = await payload.find({
      collection: "products",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: product.slug } }
    });
    if (found.docs[0]) {
      await payload.update({
        collection: "products",
        id: found.docs[0].id,
        overrideAccess: true,
        data
      });
    } else {
      await payload.create({
        collection: "products",
        overrideAccess: true,
        data
      });
    }
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed LOSTINSEOUL dev products in production.");
  }
  const payload = await getPayload({ config });
  const categoryId = await ensureFragranceCategory(payload);
  await ensureProductDrafts(payload, categoryId);
  payload.logger.info("[seed:lost-products] done");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed:lost-products] failed:", error);
    process.exit(1);
  });
