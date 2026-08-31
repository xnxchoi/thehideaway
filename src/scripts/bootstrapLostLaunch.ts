import config from "@payload-config";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  createLocalReq,
  getPayload,
  type Payload,
  type PayloadRequest
} from "payload";

import {
  closeInventoryReceipt,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  releaseInventoryLot,
  type InventoryOperationResult
} from "@/lib/lost-commerce/inventory-operations";
import {
  DEFAULT_VARIANT_OPTION,
  DEFAULT_VARIANT_TYPE,
  inventoryCollectionsReady,
  pluginLaunchProductData,
  pluginLaunchVariantData
} from "@/payload/plugins/ecommerce/seed-catalog";

import { LOST_LAUNCH_PRODUCTS } from "./lostLaunchCatalog";
import {
  lostLaunchInventoryAction,
  type LostLaunchReceiptStatus
} from "./lostLaunchInventory";
import {
  isLostLaunchMediaReceipt,
  lostLaunchMediaDigest,
  lostLaunchStagedFilename
} from "./lostLaunchMedia";

type DocumentWithId = { id: string | number; status?: unknown };

function relationshipId(value: string | number): string {
  return String(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function operationResourceId(result: InventoryOperationResult): string {
  if (result.kind === "succeeded") return result.resourceId;
  if (result.kind === "replay") {
    const response = result.response;
    if (isRecord(response) && typeof response.resourceId === "string") {
      return response.resourceId;
    }
  }
  throw new Error(`lost-launch-inventory-${result.kind}`);
}

async function transactional<T>(
  payload: Payload,
  baseReq: PayloadRequest,
  run: (req: PayloadRequest) => Promise<T>
): Promise<T> {
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) throw new Error("lost-launch-transaction-failed");
  const req = { ...baseReq, payload, transactionID } as PayloadRequest;

  try {
    const result = await run(req);
    await payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}

async function findOne(
  payload: Payload,
  collection: string,
  where: Record<string, unknown>,
  req?: PayloadRequest
): Promise<DocumentWithId | null> {
  const result = await payload.find({
    collection: collection as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where
  } as never);
  return (result.docs[0] as DocumentWithId | undefined) ?? null;
}

async function ensureMedia(
  payload: Payload,
  req: PayloadRequest,
  adminId: string,
  assetPath: string
): Promise<string> {
  const absolutePath = resolve(process.cwd(), assetPath);
  const sourceData = await readFile(absolutePath);
  const sourceDigest = lostLaunchMediaDigest(sourceData);
  const stagedFilename = lostLaunchStagedFilename(assetPath, sourceData);
  const candidates = await payload.find({
    collection: "media",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: { filename: { contains: sourceDigest } }
  });
  for (const candidate of candidates.docs) {
    if (
      typeof candidate.filename !== "string" ||
      candidate.filename !== basename(candidate.filename) ||
      !candidate.filename.includes(sourceDigest)
    ) {
      continue;
    }
    try {
      const receipt = JSON.parse(
        await readFile(
          resolve(
            process.cwd(),
            "public/media",
            `.lost-launch-${relationshipId(candidate.id)}.json`
          ),
          "utf8"
        )
      );
      if (
        !isLostLaunchMediaReceipt(receipt) ||
        receipt.filename !== candidate.filename ||
        receipt.sourceDigest !== sourceDigest
      ) {
        continue;
      }
      const storedData = await readFile(
        resolve(process.cwd(), "public/media", candidate.filename)
      );
      if (lostLaunchMediaDigest(storedData) === receipt.storedDigest) {
        return relationshipId(candidate.id);
      }
    } catch {
      continue;
    }
  }

  const stageDir = await mkdtemp(join(tmpdir(), "lost-launch-media-"));
  const stagedPath = join(stageDir, stagedFilename);
  try {
    await writeFile(stagedPath, sourceData);
    const media = await payload.create({
      collection: "media",
      data: { author: adminId },
      filePath: stagedPath,
      overrideAccess: true,
      req
    } as never);
    const mediaDoc = media as DocumentWithId & { filename?: unknown };
    if (typeof mediaDoc.filename !== "string") {
      throw new Error("lost-launch-media-filename-missing");
    }
    const storedData = await readFile(
      resolve(process.cwd(), "public/media", mediaDoc.filename)
    );
    await writeFile(
      resolve(
        process.cwd(),
        "public/media",
        `.lost-launch-${relationshipId(mediaDoc.id)}.json`
      ),
      `${JSON.stringify({
        filename: mediaDoc.filename,
        sourceDigest,
        storedDigest: lostLaunchMediaDigest(storedData)
      })}\n`,
      { flag: "wx" }
    );
    return relationshipId(mediaDoc.id);
  } finally {
    await rm(stageDir, { force: true, recursive: true });
  }
}

async function ensureCategory(
  payload: Payload,
  req: PayloadRequest,
  category: { name: string; slug: string },
  sort: number
): Promise<string> {
  const existing = await findOne(
    payload,
    "product-category",
    { slug: { equals: category.slug } },
    req
  );
  if (existing) return relationshipId(existing.id);

  const created = await payload.create({
    collection: "product-category",
    data: { ...category, sort },
    overrideAccess: true,
    req
  });
  return relationshipId(created.id);
}

async function ensureDefaultVariantTaxonomy(
  payload: Payload,
  req: PayloadRequest
): Promise<{ typeId: string; optionId: string }> {
  const existingType = await findOne(
    payload,
    "variantTypes",
    { name: { equals: DEFAULT_VARIANT_TYPE.name } },
    req
  );
  const typeDoc = existingType
    ? existingType
    : ((await payload.create({
        collection: "variantTypes",
        data: { ...DEFAULT_VARIANT_TYPE },
        overrideAccess: true,
        req
      } as never)) as DocumentWithId);
  const typeId = relationshipId(typeDoc.id);
  const existingOption = await findOne(
    payload,
    "variantOptions",
    {
      and: [
        { label: { equals: DEFAULT_VARIANT_OPTION.label } },
        { variantType: { equals: typeId } }
      ]
    },
    req
  );
  const optionDoc = existingOption
    ? existingOption
    : ((await payload.create({
        collection: "variantOptions",
        data: {
          ...DEFAULT_VARIANT_OPTION,
          variantType: typeId
        },
        overrideAccess: true,
        req
      } as never)) as DocumentWithId);
  return { typeId, optionId: relationshipId(optionDoc.id) };
}

async function upsertCatalog(
  payload: Payload,
  baseReq: PayloadRequest,
  mediaIds: Map<string, string>
): Promise<Map<string, string>> {
  const catalog = await transactional(payload, baseReq, async (req) => {
    const taxonomy = await ensureDefaultVariantTaxonomy(payload, req);
    const productIds = new Map<string, string>();

    for (const product of LOST_LAUNCH_PRODUCTS) {
      const categoryId = await ensureCategory(
        payload,
        req,
        product.category,
        product.sort
      );
      const heroMedia = product.heroAsset
        ? (mediaIds.get(product.heroAsset) ?? null)
        : null;
      const gallery = product.galleryAssets.map((asset) => {
        const mediaId = mediaIds.get(asset);
        if (!mediaId) throw new Error(`lost-launch-media-missing:${asset}`);
        return mediaId;
      });
      const productData = {
        ...pluginLaunchProductData(product, categoryId, {
          heroMedia,
          gallery
        }),
        variantTypes: [taxonomy.typeId]
      };
      const existingProduct = await findOne(
        payload,
        "products",
        { slug: { equals: product.slug } },
        req
      );
      const productDoc = existingProduct
        ? await payload.update({
            collection: "products",
            id: existingProduct.id,
            data: productData,
            draft: false,
            overrideAccess: true,
            req
          } as never)
        : await payload.create({
            collection: "products",
            data: productData,
            draft: false,
            overrideAccess: true,
            req
          } as never);
      productIds.set(
        product.slug,
        relationshipId((productDoc as DocumentWithId).id)
      );
    }

    return { productIds, optionId: taxonomy.optionId };
  });

  return transactional(payload, baseReq, async (req) => {
    const skuIds = new Map<string, string>();
    for (const product of LOST_LAUNCH_PRODUCTS) {
      const productId = catalog.productIds.get(product.slug);
      if (!productId) throw new Error(`lost-launch-product-missing:${product.slug}`);
      const existingSku = await findOne(
        payload,
        "variants",
        {
          and: [
            { sku: { equals: product.sku } },
            { product: { equals: productId } }
          ]
        },
        req
      );
      const variantData = pluginLaunchVariantData(product, productId, [
        catalog.optionId
      ]);
      const skuDoc = existingSku
        ? await payload.update({
            collection: "variants",
            id: existingSku.id,
            data: variantData,
            draft: false,
            overrideAccess: true,
            req
          } as never)
        : await payload.create({
            collection: "variants",
            data: variantData,
            draft: false,
            overrideAccess: true,
            req
          } as never);
      skuIds.set(product.slug, relationshipId((skuDoc as DocumentWithId).id));
    }
    return skuIds;
  });
}

async function ensureStockLocation(
  payload: Payload,
  baseReq: PayloadRequest
): Promise<string> {
  const existing = await findOne(payload, "stock-locations", {
    code: { equals: "SEOUL" }
  });
  if (existing) return relationshipId(existing.id);

  return transactional(payload, baseReq, async (req) => {
    const created = await payload.create({
      collection: "stock-locations" as never,
      data: { code: "SEOUL", name: "Seoul", active: true },
      overrideAccess: true,
      req
    });
    return relationshipId(created.id);
  });
}

async function ensureHoodieInventory(
  payload: Payload,
  req: PayloadRequest,
  skuId: string,
  locationId: string
): Promise<void> {
  const levels = await payload.find({
    collection: "inventory-levels" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { sku: { equals: skuId } },
        { location: { equals: locationId } },
        { disposition: { equals: "available" } }
      ]
    }
  });
  const quantity = Number(
    (levels.docs[0] as { quantity?: unknown } | undefined)?.quantity ?? 0
  );
  const existingReceipt = await findOne(payload, "inventory-receipts", {
    external_reference: { equals: "lost-launch-hoodie-v1" }
  });
  const receiptStatus =
    existingReceipt?.status === "draft" ||
    existingReceipt?.status === "open" ||
    existingReceipt?.status === "closed"
      ? (existingReceipt.status as LostLaunchReceiptStatus)
      : null;
  const recoveryAction = lostLaunchInventoryAction(quantity, receiptStatus);

  if (recoveryAction === "complete") return;
  if (recoveryAction === "close_receipt") {
    if (!existingReceipt) {
      throw new Error("lost-launch-hoodie-receipt-missing");
    }
    operationResourceId(
      await closeInventoryReceipt({
        payload,
        req,
        commandKey: "lost-launch-hoodie-receipt-close-v1",
        input: { receiptId: relationshipId(existingReceipt.id) }
      })
    );
    await assertHoodieInventoryComplete(payload, skuId, locationId);
    return;
  }

  const receiptId = operationResourceId(
    await createInventoryReceipt({
      payload,
      req,
      commandKey: "lost-launch-hoodie-receipt-create-v1",
      input: {
        locationId,
        supplierName: "LOSTINSEOUL",
        externalReference: "lost-launch-hoodie-v1",
        lines: [{ skuId, expectedQuantity: 5 }]
      }
    })
  );
  const line = await findOne(payload, "inventory-receipt-lines", {
    and: [{ receipt: { equals: receiptId } }, { sku: { equals: skuId } }]
  });
  if (!line) throw new Error("lost-launch-hoodie-receipt-line-missing");

  operationResourceId(
    await openInventoryReceipt({
      payload,
      req,
      commandKey: "lost-launch-hoodie-receipt-open-v1",
      input: { receiptId }
    })
  );
  const lotId = operationResourceId(
    await receiveInventoryReceipt({
      payload,
      req,
      commandKey: "lost-launch-hoodie-receive-v1",
      input: {
        receiptId,
        receiptLineId: relationshipId(line.id),
        quantity: 5,
        externalLotCode: "lost-launch-hoodie-v1"
      }
    })
  );
  operationResourceId(
    await releaseInventoryLot({
      payload,
      req,
      commandKey: "lost-launch-hoodie-release-v1",
      input: { lotId, quantity: 5 }
    })
  );
  operationResourceId(
    await closeInventoryReceipt({
      payload,
      req,
      commandKey: "lost-launch-hoodie-receipt-close-v1",
      input: { receiptId }
    })
  );
  await assertHoodieInventoryComplete(payload, skuId, locationId);
}

async function assertHoodieInventoryComplete(
  payload: Payload,
  skuId: string,
  locationId: string
): Promise<void> {
  const [levels, receipt] = await Promise.all([
    payload.find({
      collection: "inventory-levels" as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { sku: { equals: skuId } },
          { location: { equals: locationId } },
          { disposition: { equals: "available" } }
        ]
      }
    }),
    findOne(payload, "inventory-receipts", {
      external_reference: { equals: "lost-launch-hoodie-v1" }
    })
  ]);
  const quantity = Number(
    (levels.docs[0] as { quantity?: unknown } | undefined)?.quantity ?? 0
  );
  if (quantity !== 5 || receipt?.status !== "closed") {
    throw new Error(
      `lost-launch-hoodie-postcondition:${quantity}:${String(receipt?.status ?? "none")}`
    );
  }
}

export async function bootstrapLostLaunch(payload: Payload): Promise<void> {
  const admins = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { role: { equals: "admin" } }
  });
  const admin = admins.docs[0];
  if (!admin) throw new Error("lost-launch-admin-required");
  const adminId = relationshipId(admin.id);
  const req = (await createLocalReq(
    { user: { ...admin, collection: "users" } as never },
    payload
  )) as PayloadRequest;

  const mediaIds = new Map<string, string>();
  for (const product of LOST_LAUNCH_PRODUCTS) {
    for (const asset of product.galleryAssets) {
      if (!mediaIds.has(asset)) {
        mediaIds.set(asset, await ensureMedia(payload, req, adminId, asset));
      }
    }
  }

  const skuIds = await upsertCatalog(payload, req, mediaIds);
  const hoodieSkuId = skuIds.get("damaged-love-the-damaged");
  if (!hoodieSkuId) throw new Error("lost-launch-hoodie-sku-missing");

  if (inventoryCollectionsReady(payload)) {
    const locationId = await ensureStockLocation(payload, req);
    await ensureHoodieInventory(payload, req, hoodieSkuId, locationId);
    payload.logger.info(
      "[bootstrap:lost-launch] catalog ready; hoodie stock=5; pre-orders remain campaign-gated"
    );
    return;
  }

  payload.logger.info(
    "[bootstrap:lost-launch] catalog ready; inventory collections unregistered, skipping stock"
  );
}

const payload = await getPayload({ config });

bootstrapLostLaunch(payload)
  .then(() => process.exit(0))
  .catch((error) => {
    payload.logger.error(error);
    process.exit(1);
  });
