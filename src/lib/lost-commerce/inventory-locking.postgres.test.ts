import { randomUUID } from "node:crypto";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type Payload
} from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import { releaseStandardInventory } from "./inventory";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

const TestProducts: CollectionConfig = {
  slug: "products",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    { name: "unit_amount", type: "number", required: true, defaultValue: 0 },
    { name: "variants", type: "json" }
  ]
};

describeWithPostgres.sequential(
  "commerce inventory locking with PostgreSQL",
  () => {
    let payload: Payload;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      const config = buildConfig({
        secret: "commerce-inventory-lock-test-32-bytes",
        db: postgresAdapter({
          push: false,
          idType: "uuid",
          pool: { connectionString: testDatabaseUri }
        }),
        collections: [TestProducts, ProductVariants]
      });
      payload = await getPayload({ config });
    }, 60_000);

    it("serializes a release against a concurrent staff SKU update", async () => {
      const suffix = randomUUID();
      const product = await payload.create({
        collection: "products",
        overrideAccess: true,
        data: {
          name: `Inventory lock ${suffix}`,
          slug: `inventory-lock-${suffix}`,
          currency: "KRW",
          unit_amount: 120_000
        }
      });
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-${suffix}`.toUpperCase(),
          inventory: 0,
          stock_state: "out_of_stock"
        }
      });

      const transactionID = await payload.db.beginTransaction();
      if (!transactionID)
        throw new Error("inventory-lock-test-transaction-failed");

      let allowReleaseRead: (() => void) | undefined;
      const releaseReadGate = new Promise<void>((resolve) => {
        allowReleaseRead = resolve;
      });
      let markReleaseRead: (() => void) | undefined;
      const releaseReadStarted = new Promise<void>((resolve) => {
        markReleaseRead = resolve;
      });
      const releasePayload = new Proxy(payload, {
        get(target, property) {
          if (property === "findByID") {
            return async (args: Parameters<Payload["findByID"]>[0]) => {
              const result = await target.findByID(args);
              if (args.collection === "product-variants") {
                markReleaseRead?.();
                await releaseReadGate;
              }
              return result;
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        }
      });
      const txReq = { payload, transactionID, context: {} };

      const release = releaseStandardInventory({
        payload: releasePayload,
        req: txReq,
        order: {
          order_mode: "standard_purchase",
          payment_status: "failed",
          lines: [
            {
              schemaVersion: 2,
              mode: "standard_purchase",
              productId: String(product.id),
              skuId: String(sku.id),
              quantity: 1
            }
          ]
        }
      });

      await releaseReadStarted;
      const staffUpdate = payload.update({
        collection: "product-variants",
        id: String(sku.id),
        overrideAccess: true,
        data: { inventory: 10, stock_state: "in_stock" }
      });

      try {
        const staffState = await Promise.race([
          staffUpdate.then(() => "finished" as const),
          new Promise<"waiting">((resolve) =>
            setTimeout(() => resolve("waiting"), 50)
          )
        ]);
        expect(staffState).toBe("waiting");

        allowReleaseRead?.();
        await release;
        await payload.db.commitTransaction(transactionID);
        await staffUpdate;
      } catch (error) {
        allowReleaseRead?.();
        await payload.db
          .rollbackTransaction(transactionID)
          .catch(() => undefined);
        await staffUpdate.catch(() => undefined);
        throw error;
      }

      await expect(
        payload.findByID({
          collection: "product-variants",
          id: String(sku.id),
          overrideAccess: true
        })
      ).resolves.toMatchObject({ inventory: 10, stock_state: "in_stock" });
    });
  }
);
