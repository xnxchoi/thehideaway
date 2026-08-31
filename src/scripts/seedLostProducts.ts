/**
 * Development-only LOSTINSEOUL catalog seed.
 *
 * Product drafts contain only confirmed structural facts. They remain inactive
 * and have no SKU rows until reviewed SKU, price, and stock facts are supplied.
 */
import config from "@payload-config";
import { getPayload, type Payload, type PayloadRequest } from "payload";

import { pluginDraftProductData } from "@/payload/plugins/ecommerce/seed-catalog";

import { LOST_FRAGRANCE_SEED_PRODUCTS } from "./seedLostProductCatalog";

async function withTransaction<T>(
  payload: Payload,
  run: (req: PayloadRequest) => Promise<T>
): Promise<T> {
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) throw new Error("lost-seed-transaction-failed");
  const req = { payload, transactionID } as PayloadRequest;
  try {
    const result = await run(req);
    await payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}

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
  await withTransaction(payload, async (req) => {
    for (const product of LOST_FRAGRANCE_SEED_PRODUCTS) {
      const data = pluginDraftProductData(product, categoryId);
      const found = await payload.find({
        collection: "products",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req,
        where: { slug: { equals: product.slug } }
      });
      if (found.docs[0]) {
        await payload.update({
          collection: "products",
          id: found.docs[0].id,
          overrideAccess: true,
          req,
          draft: true,
          data
        });
      } else {
        await payload.create({
          collection: "products",
          overrideAccess: true,
          req,
          draft: true,
          data
        });
      }
    }
  });
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
