import { randomUUID } from "node:crypto";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sql } from "drizzle-orm";
import {
  buildConfig,
  getPayload,
  type CollectionConfig,
  type Payload
} from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { ProductOrderCampaigns } from "@/payload/collections/(consumption)/ProductOrderCampaigns";
import { ProductOrders } from "@/payload/collections/(consumption)/ProductOrders";
import { lockProductUpdate } from "@/payload/collections/(consumption)/Products/lockProductUpdate";
import { ProductVariants } from "@/payload/collections/(consumption)/ProductVariants";
import {
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";
import { up as applySkuMigration } from "@/lib/migrations/20260721_091634";
import { up as applySkuIdentityMigration } from "@/lib/migrations/20260721_094720";
import { claimRequestOrderCapacity } from "./campaigns";
import { buildCommerceSkuSnapshot } from "./product-skus";

const testDatabaseUri = process.env.COMMERCE_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;

let identityRaceEnabled = false;
let identityRaceArrivals = 0;
let releaseIdentityRace: (() => void) | null = null;

const TestProductVariants: CollectionConfig = {
  ...ProductVariants,
  hooks: {
    ...ProductVariants.hooks,
    beforeValidate: [
      ...(ProductVariants.hooks?.beforeValidate ?? []),
      async ({ operation }) => {
        if (!identityRaceEnabled || operation !== "update") return;

        identityRaceArrivals += 1;
        if (identityRaceArrivals === 2) {
          releaseIdentityRace?.();
          return;
        }

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 75);
          releaseIdentityRace = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
      }
    ]
  }
};

const TestProducts: CollectionConfig = {
  slug: "products",
  hooks: { beforeOperation: [lockProductUpdate] },
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
    { name: "active", type: "checkbox", required: true, defaultValue: true },
    {
      name: "request_to_order_enabled",
      type: "checkbox",
      required: true,
      defaultValue: true
    }
  ]
};

const TestUsers: CollectionConfig = {
  slug: "users",
  auth: true,
  fields: []
};

type CreatedProduct = {
  id: string;
  name: string;
  slug: string;
  currency: "KRW";
  unit_amount: number;
};

describeWithPostgres.sequential(
  "commerce SKU durability with PostgreSQL",
  () => {
    let payload: Payload;

    beforeAll(async () => {
      process.env.DATABASE_URI = testDatabaseUri;
      const config = buildConfig({
        secret: "commerce-sku-postgres-test-secret-32-bytes",
        db: postgresAdapter({
          push: false,
          idType: "uuid",
          pool: { connectionString: testDatabaseUri }
        }),
        collections: [
          TestUsers,
          TestProducts,
          TestProductVariants,
          ProductOrderCampaigns,
          ProductOrders
        ]
      });
      payload = await getPayload({ config });
    }, 60_000);

    async function createProduct(input?: {
      unitAmount?: number;
    }): Promise<CreatedProduct> {
      const suffix = randomUUID();
      return (await payload.create({
        collection: "products",
        overrideAccess: true,
        data: {
          name: `SKU test ${suffix}`,
          slug: `sku-test-${suffix}`,
          currency: "KRW",
          unit_amount: input?.unitAmount ?? 120_000
        }
      } as never)) as CreatedProduct;
    }

    async function createTestUser(): Promise<string> {
      const result = await payload.db.drizzle.execute<{ id: string }>(sql`
        INSERT INTO users DEFAULT VALUES
        RETURNING id
      `);
      const userId = result.rows[0]?.id;
      if (!userId) throw new Error("commerce-test-user-create-failed");
      return userId;
    }

    async function expectStillWaiting(
      promise: Promise<unknown>
    ): Promise<void> {
      const state = await Promise.race([
        promise.then(
          () => "settled" as const,
          () => "settled" as const
        ),
        new Promise<"waiting">((resolve) =>
          setTimeout(() => resolve("waiting"), 50)
        )
      ]);
      expect(state).toBe("waiting");
    }

    it("rejects concurrent duplicate SKU codes", async () => {
      const [firstProduct, secondProduct] = await Promise.all([
        createProduct(),
        createProduct()
      ]);
      const sku = `LIS-${randomUUID()}`.toUpperCase();

      const results = await Promise.allSettled([
        payload.create({
          collection: "product-variants",
          overrideAccess: true,
          data: { product: firstProduct.id, active: true, sku }
        }),
        payload.create({
          collection: "product-variants",
          overrideAccess: true,
          data: { product: secondProduct.id, active: true, sku }
        })
      ]);

      expect(
        results.filter(({ status }) => status === "fulfilled")
      ).toHaveLength(1);
      expect(
        results.filter(({ status }) => status === "rejected")
      ).toHaveLength(1);
    });

    it("rejects duplicate option identities within one product", async () => {
      const product = await createProduct();
      const options = [{ key: "size", value: "confirmed-test-size" }];

      const results = await Promise.allSettled([
        payload.create({
          collection: "product-variants",
          overrideAccess: true,
          data: {
            product: product.id,
            active: true,
            sku: `LIS-${randomUUID()}`.toUpperCase(),
            options
          }
        }),
        payload.create({
          collection: "product-variants",
          overrideAccess: true,
          data: {
            product: product.id,
            active: true,
            sku: `LIS-${randomUUID()}`.toUpperCase(),
            options: [...options]
          }
        })
      ]);

      expect(
        results.filter(({ status }) => status === "fulfilled")
      ).toHaveLength(1);
      expect(
        results.filter(({ status }) => status === "rejected")
      ).toHaveLength(1);
    });

    it("enforces the SKU product foreign key", async () => {
      await expect(
        payload.db.drizzle.execute(sql`
        INSERT INTO product_variants (product_id, active, option_key)
        VALUES (${randomUUID()}, false, ${`missing:${randomUUID()}`})
      `)
      ).rejects.toThrow();
    });

    it("prevents deleting a product that still owns SKU records", async () => {
      const product = await createProduct();
      await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: false,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });

      await expect(
        payload.delete({
          collection: "products",
          id: product.id,
          overrideAccess: true
        })
      ).rejects.toThrow();
      await expect(
        payload.findByID({
          collection: "products",
          id: product.id,
          overrideAccess: true
        })
      ).resolves.toMatchObject({ id: product.id });
    });

    it("persists the identity lock after activation and deactivation", async () => {
      const product = await createProduct();
      const originalSku = `LIS-${randomUUID()}`.toUpperCase();
      const created = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: { product: product.id, active: false, sku: originalSku }
      });

      await payload.update({
        collection: "product-variants",
        id: String(created.id),
        overrideAccess: true,
        data: { active: true }
      });
      await expect(
        payload.findByID({
          collection: "product-variants",
          id: String(created.id),
          overrideAccess: true
        })
      ).resolves.toMatchObject({ active: true, identity_locked: true });

      await payload.update({
        collection: "product-variants",
        id: String(created.id),
        overrideAccess: true,
        data: { active: false }
      });
      await expect(
        payload.findByID({
          collection: "product-variants",
          id: String(created.id),
          overrideAccess: true
        })
      ).resolves.toMatchObject({ active: false, identity_locked: true });
      await expect(
        payload.update({
          collection: "product-variants",
          id: String(created.id),
          overrideAccess: true,
          data: { sku: `LIS-${randomUUID()}`.toUpperCase() }
        })
      ).rejects.toThrow("sku-identity-immutable");
    });

    it("serializes first activation against a concurrent identity change", async () => {
      const product = await createProduct();
      const originalSku = `LIS-${randomUUID()}`.toUpperCase();
      const correctedSku = `LIS-${randomUUID()}`.toUpperCase();
      const created = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: { product: product.id, active: false, sku: originalSku }
      });

      identityRaceArrivals = 0;
      releaseIdentityRace = null;
      identityRaceEnabled = true;
      const results = await Promise.allSettled([
        payload.update({
          collection: "product-variants",
          id: String(created.id),
          overrideAccess: true,
          data: { active: true }
        }),
        payload.update({
          collection: "product-variants",
          id: String(created.id),
          overrideAccess: true,
          data: { sku: correctedSku }
        })
      ]);
      identityRaceEnabled = false;
      releaseIdentityRace = null;

      const persisted = await payload.findByID({
        collection: "product-variants",
        id: String(created.id),
        overrideAccess: true
      });

      expect(results.some(({ status }) => status === "fulfilled")).toBe(true);
      expect(persisted).toMatchObject({ active: true, identity_locked: true });
      expect([originalSku, correctedSku]).toContain(persisted.sku);
    });

    it("prevents campaign ownership from racing an SKU product correction", async () => {
      const [campaignProduct, correctedProduct] = await Promise.all([
        createProduct(),
        createProduct()
      ]);
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: campaignProduct.id,
          active: false,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });
      const campaignTitle = `Campaign race ${randomUUID()}`;
      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("campaign-race-transaction-failed");

      let committed = false;
      let reassignment: Promise<unknown> | undefined;
      try {
        await payload.create({
          collection: "product-order-campaigns",
          overrideAccess: true,
          req: { payload, transactionID, context: {} } as never,
          data: {
            title: campaignTitle,
            product: campaignProduct.id,
            state: "draft",
            minimum_commitments: 1,
            paid_commitments: 0,
            deadline: new Date(Date.now() + 86_400_000).toISOString(),
            progress_visibility: "hidden",
            eligible_skus: [sku.id]
          }
        });

        reassignment = payload.update({
          collection: "product-variants",
          id: String(sku.id),
          overrideAccess: true,
          data: { product: correctedProduct.id }
        });
        await expectStillWaiting(reassignment);

        await payload.db.commitTransaction(transactionID);
        committed = true;
        await expect(reassignment).rejects.toThrow(
          "sku-product-referenced-by-campaign"
        );
      } catch (error) {
        if (!committed) {
          await payload.db
            .rollbackTransaction(transactionID)
            .catch(() => undefined);
        }
        await reassignment?.catch(() => undefined);
        throw error;
      }

      await expect(
        payload.findByID({
          collection: "product-variants",
          id: String(sku.id),
          depth: 0,
          overrideAccess: true
        })
      ).resolves.toMatchObject({ product: campaignProduct.id });
      await expect(
        payload.find({
          collection: "product-order-campaigns",
          where: { title: { equals: campaignTitle } },
          depth: 0,
          limit: 1,
          overrideAccess: true
        })
      ).resolves.toMatchObject({
        docs: [
          expect.objectContaining({
            product: campaignProduct.id,
            eligible_skus: expect.arrayContaining([sku.id])
          })
        ]
      });
    });

    it("revalidates a waiting campaign after an SKU product correction wins", async () => {
      const [campaignProduct, correctedProduct] = await Promise.all([
        createProduct(),
        createProduct()
      ]);
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: campaignProduct.id,
          active: false,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });
      const campaignTitle = `Campaign revalidation ${randomUUID()}`;
      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("sku-race-transaction-failed");

      let committed = false;
      let campaignCreate: Promise<unknown> | undefined;
      try {
        await payload.update({
          collection: "product-variants",
          id: String(sku.id),
          overrideAccess: true,
          req: { payload, transactionID, context: {} } as never,
          data: { product: correctedProduct.id }
        });

        campaignCreate = payload.create({
          collection: "product-order-campaigns",
          overrideAccess: true,
          data: {
            title: campaignTitle,
            product: campaignProduct.id,
            state: "draft",
            minimum_commitments: 1,
            paid_commitments: 0,
            deadline: new Date(Date.now() + 86_400_000).toISOString(),
            progress_visibility: "hidden",
            eligible_skus: [sku.id]
          }
        });
        await expectStillWaiting(campaignCreate);

        await payload.db.commitTransaction(transactionID);
        committed = true;
        await expect(campaignCreate).rejects.toThrow(
          "campaign-sku-product-mismatch"
        );
      } catch (error) {
        if (!committed) {
          await payload.db
            .rollbackTransaction(transactionID)
            .catch(() => undefined);
        }
        await campaignCreate?.catch(() => undefined);
        throw error;
      }

      await expect(
        payload.findByID({
          collection: "product-variants",
          id: String(sku.id),
          depth: 0,
          overrideAccess: true
        })
      ).resolves.toMatchObject({ product: correctedProduct.id });
      await expect(
        payload.find({
          collection: "product-order-campaigns",
          where: { title: { equals: campaignTitle } },
          depth: 0,
          limit: 1,
          overrideAccess: true
        })
      ).resolves.toMatchObject({ docs: [] });
    });

    it("rejects finite capacity and allows an unbounded campaign order", async () => {
      const userId = await createTestUser();
      const product = await createProduct();
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });
      const finiteCampaign = await payload.create({
        collection: "product-order-campaigns",
        overrideAccess: true,
        data: {
          title: `Finite capacity ${randomUUID()}`,
          product: product.id,
          state: "open",
          minimum_commitments: 1,
          maximum_commitments: 1,
          paid_commitments: 0,
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          progress_visibility: "hidden",
          eligible_skus: [sku.id]
        }
      });
      const unboundedCampaign = await payload.create({
        collection: "product-order-campaigns",
        overrideAccess: true,
        data: {
          title: `Unbounded capacity ${randomUUID()}`,
          product: product.id,
          state: "open",
          minimum_commitments: 1,
          paid_commitments: 0,
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          progress_visibility: "hidden",
          eligible_skus: [sku.id]
        }
      });

      async function createOrder(
        campaignId: string,
        req: {
          payload: Payload;
          transactionID: string | number;
          context: Record<string, never>;
        }
      ): Promise<unknown> {
        return payload.create({
          collection: "product-orders",
          overrideAccess: true,
          depth: 0,
          req: req as never,
          data: {
            order_ref: `lis_capacity_${randomUUID()}`,
            user: userId,
            storefront: "lostinseoul",
            order_mode: "request_to_order",
            status: "pending_payment",
            payment_status: "pending_manual",
            fulfillment_status: "reserved",
            currency: "KRW",
            subtotal_amount: 120_000,
            total_amount: 120_000,
            campaign: campaignId,
            line_snapshot_version: 3,
            lines: []
          }
        });
      }

      const finiteTransactionID = await payload.db.beginTransaction();
      if (!finiteTransactionID) {
        throw new Error("finite-capacity-transaction-failed");
      }
      const finiteReq = {
        payload,
        transactionID: finiteTransactionID,
        context: {}
      };
      try {
        await expect(
          claimRequestOrderCapacity({
            payload,
            campaignId: String(finiteCampaign.id),
            productId: String(product.id),
            skuIds: [String(sku.id)],
            req: finiteReq
          })
        ).rejects.toThrow("campaign-capacity-reservations-unavailable");
      } finally {
        await payload.db
          .rollbackTransaction(finiteTransactionID)
          .catch(() => undefined);
      }

      await expect(
        payload.count({
          collection: "product-orders",
          where: { campaign: { equals: finiteCampaign.id } },
          overrideAccess: true
        })
      ).resolves.toMatchObject({ totalDocs: 0 });

      const unboundedTransactionID = await payload.db.beginTransaction();
      if (!unboundedTransactionID) {
        throw new Error("unbounded-capacity-transaction-failed");
      }
      const unboundedReq = {
        payload,
        transactionID: unboundedTransactionID,
        context: {}
      };
      let committed = false;
      try {
        await claimRequestOrderCapacity({
          payload,
          campaignId: String(unboundedCampaign.id),
          productId: String(product.id),
          skuIds: [String(sku.id)],
          req: unboundedReq
        });
        await createOrder(String(unboundedCampaign.id), unboundedReq);
        await payload.db.commitTransaction(unboundedTransactionID);
        committed = true;
      } catch (error) {
        if (!committed) {
          await payload.db
            .rollbackTransaction(unboundedTransactionID)
            .catch(() => undefined);
        }
        throw error;
      }

      await expect(
        payload.count({
          collection: "product-orders",
          where: { campaign: { equals: unboundedCampaign.id } },
          overrideAccess: true
        })
      ).resolves.toMatchObject({ totalDocs: 1 });
    });

    it("serializes campaign eligibility edits against capacity claims", async () => {
      const product = await createProduct();
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });
      const campaign = await payload.create({
        collection: "product-order-campaigns",
        overrideAccess: true,
        data: {
          title: `Eligibility race ${randomUUID()}`,
          product: product.id,
          state: "open",
          minimum_commitments: 1,
          paid_commitments: 0,
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          progress_visibility: "hidden",
          eligible_skus: [sku.id]
        }
      });

      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("campaign-claim-transaction-failed");
      const req = { payload, transactionID, context: {} };
      let rolledBack = false;
      let eligibilityUpdate: Promise<unknown> | undefined;
      try {
        await claimRequestOrderCapacity({
          payload,
          campaignId: String(campaign.id),
          productId: String(product.id),
          skuIds: [String(sku.id)],
          req
        });

        eligibilityUpdate = payload.update({
          collection: "product-order-campaigns",
          id: String(campaign.id),
          overrideAccess: true,
          data: { eligible_skus: [] }
        });
        await expectStillWaiting(eligibilityUpdate);

        await payload.db.rollbackTransaction(transactionID);
        rolledBack = true;
        await expect(eligibilityUpdate).resolves.toMatchObject({
          eligible_skus: []
        });
      } catch (error) {
        if (!rolledBack) {
          await payload.db
            .rollbackTransaction(transactionID)
            .catch(() => undefined);
        }
        await eligibilityUpdate?.catch(() => undefined);
        throw error;
      }
    });

    it("serializes request-order catalog edits behind product and SKU locks", async () => {
      const product = await createProduct();
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-${randomUUID()}`.toUpperCase()
        }
      });

      const transactionID = await payload.db.beginTransaction();
      if (!transactionID) throw new Error("catalog-lock-transaction-failed");
      let rolledBack = false;
      let productUpdate: Promise<unknown> | undefined;
      let skuUpdate: Promise<unknown> | undefined;
      try {
        await productInventoryLock(payload, transactionID, String(product.id));
        await productSkuMutationLock(payload, transactionID, String(sku.id));

        productUpdate = payload.update({
          collection: "products",
          id: String(product.id),
          overrideAccess: true,
          data: { request_to_order_enabled: false }
        });
        skuUpdate = payload.update({
          collection: "product-variants",
          id: String(sku.id),
          overrideAccess: true,
          data: { active: false }
        });

        await expectStillWaiting(productUpdate);
        await expectStillWaiting(skuUpdate);

        await payload.db.rollbackTransaction(transactionID);
        rolledBack = true;
        await expect(productUpdate).resolves.toMatchObject({
          request_to_order_enabled: false
        });
        await expect(skuUpdate).resolves.toMatchObject({ active: false });
      } catch (error) {
        if (!rolledBack) {
          await payload.db
            .rollbackTransaction(transactionID)
            .catch(() => undefined);
        }
        await productUpdate?.catch(() => undefined);
        await skuUpdate?.catch(() => undefined);
        throw error;
      }
    });

    it("keeps an order line snapshot unchanged after catalog edits", async () => {
      const product = await createProduct({ unitAmount: 120_000 });
      const sku = await payload.create({
        collection: "product-variants",
        overrideAccess: true,
        data: {
          product: product.id,
          active: true,
          sku: `LIS-${randomUUID()}`.toUpperCase(),
          label: "Original label",
          price_override_amount: 135_000,
          options: [{ key: "size", value: "confirmed-test-size" }]
        }
      });
      const snapshot = buildCommerceSkuSnapshot({
        product,
        sku: {
          id: String(sku.id),
          product: product.id,
          sku: String(sku.sku),
          label: sku.label,
          options: sku.options,
          price_override_amount: sku.price_override_amount
        },
        quantity: 1,
        mode: "standard_purchase"
      });
      const userResult = await payload.db.drizzle.execute<{ id: string }>(sql`
      INSERT INTO users DEFAULT VALUES
      RETURNING id
    `);
      const userId = userResult.rows[0]?.id;
      if (!userId) throw new Error("commerce-test-user-create-failed");
      const orderRef = `lis_sku_test_${randomUUID()}`;
      await payload.db.drizzle.execute(sql`
      INSERT INTO product_orders (
        order_ref,
        user_id,
        line_snapshot_version,
        lines
      ) VALUES (
        ${orderRef},
        ${userId},
        3,
        ${JSON.stringify([snapshot])}::jsonb
      )
    `);

      await payload.update({
        collection: "product-variants",
        id: String(sku.id),
        overrideAccess: true,
        data: { label: "Changed label", price_override_amount: 150_000 }
      });

      const stored = await payload.db.drizzle.execute<{ lines: unknown }>(sql`
      SELECT lines
      FROM product_orders
      WHERE order_ref = ${orderRef}
    `);
      expect(stored.rows[0]?.lines).toEqual([snapshot]);
    });

    it("re-enters the generated SKU migration safely", async () => {
      const args = {
        db: payload.db.drizzle,
        payload,
        req: { payload }
      } as never;

      await expect(applySkuMigration(args)).resolves.toBeUndefined();
      await expect(applySkuMigration(args)).resolves.toBeUndefined();
      await expect(applySkuIdentityMigration(args)).resolves.toBeUndefined();
      await expect(applySkuIdentityMigration(args)).resolves.toBeUndefined();
    });
  }
);
