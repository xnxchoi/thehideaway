import { postgresAdapter, sql } from "@payloadcms/db-postgres";
import {
  buildConfig,
  createLocalReq,
  getPayload,
  type CollectionConfig,
  type Payload,
  type PayloadRequest
} from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  down as revertCatalogCleanup,
  up as applyCatalogCleanup
} from "@/lib/migrations/20260801_165327";

const testDatabaseUri = process.env.CATALOG_CLEANUP_MIGRATION_TEST_DATABASE_URI;
const describeWithPostgres = testDatabaseUri ? describe : describe.skip;
const originalDatabaseUri = process.env.DATABASE_URI;

const TestDocuments: CollectionConfig = {
  slug: "migration-test-documents",
  fields: [{ name: "name", type: "text" }]
};

describeWithPostgres.sequential("product catalog cleanup migration", () => {
  let payload: Payload;
  let req: PayloadRequest;

  beforeAll(async () => {
    process.env.DATABASE_URI = testDatabaseUri;
    payload = await getPayload({
      config: buildConfig({
        secret: "catalog-cleanup-migration-test-secret",
        db: postgresAdapter({
          push: false,
          idType: "uuid",
          pool: { connectionString: testDatabaseUri }
        }),
        collections: [TestDocuments]
      })
    });
    req = await createLocalReq({}, payload);
  }, 60_000);

  afterAll(async () => {
    await payload?.destroy();
    if (originalDatabaseUri === undefined) delete process.env.DATABASE_URI;
    else process.env.DATABASE_URI = originalDatabaseUri;
  });

  const migrationArgs = () => ({
    db: payload.db.drizzle,
    payload,
    req
  });

  async function schemaEvidence() {
    const result = await payload.db.drizzle.execute<{
      compatibility_columns: string;
      compatibility_indexes: string;
      compatibility_types: string;
    }>(sql`
      SELECT
        (SELECT count(*)::text
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND (
             (table_name = 'products' AND column_name IN (
               'stock_state', 'inventory', 'variant_source', 'variants'
             ))
             OR
             (table_name = 'product_variants' AND column_name IN (
               'legacy_variant_ref', 'legacy_key', 'inventory', 'stock_state'
             ))
           )) AS compatibility_columns,
        (SELECT count(*)::text
         FROM pg_indexes
         WHERE schemaname = 'public'
           AND indexname IN (
             'products_stock_state_idx',
             'products_inventory_idx',
             'products_variant_source_idx',
             'product_variants_legacy_variant_ref_idx',
             'product_variants_legacy_key_idx',
             'product_variants_inventory_idx',
             'product_variants_stock_state_idx'
           )) AS compatibility_indexes,
        (SELECT count(*)::text
         FROM pg_type
         WHERE typname IN (
           'enum_products_stock_state',
           'enum_products_variant_source',
           'enum_product_variants_stock_state'
         )) AS compatibility_types
    `);
    return result.rows[0];
  }

  it("removes the retired catalog shape and re-enters in both directions", async () => {
    await payload.db.drizzle.execute(sql`
      CREATE TYPE "public"."enum_products_stock_state" AS ENUM(
        'in_stock', 'out_of_stock', 'pre_order', 'on_request'
      );
      CREATE TYPE "public"."enum_products_variant_source" AS ENUM(
        'legacy', 'relational'
      );
      CREATE TYPE "public"."enum_product_variants_stock_state" AS ENUM(
        'in_stock', 'out_of_stock', 'pre_order', 'on_request'
      );
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY,
        "stock_state" "enum_products_stock_state" DEFAULT 'on_request' NOT NULL,
        "inventory" numeric DEFAULT 0,
        "variant_source" "enum_products_variant_source" DEFAULT 'legacy' NOT NULL,
        "variants" jsonb
      );
      CREATE TABLE "product_variants" (
        "id" uuid PRIMARY KEY,
        "legacy_variant_ref" varchar,
        "legacy_key" varchar,
        "inventory" numeric,
        "stock_state" "enum_product_variants_stock_state"
      );
      CREATE INDEX "products_stock_state_idx" ON "products" ("stock_state");
      CREATE INDEX "products_inventory_idx" ON "products" ("inventory");
      CREATE INDEX "products_variant_source_idx" ON "products" ("variant_source");
      CREATE INDEX "product_variants_legacy_variant_ref_idx" ON "product_variants" ("legacy_variant_ref");
      CREATE UNIQUE INDEX "product_variants_legacy_key_idx" ON "product_variants" ("legacy_key");
      CREATE INDEX "product_variants_inventory_idx" ON "product_variants" ("inventory");
      CREATE INDEX "product_variants_stock_state_idx" ON "product_variants" ("stock_state");
    `);

    expect(await schemaEvidence()).toEqual({
      compatibility_columns: "8",
      compatibility_indexes: "7",
      compatibility_types: "3"
    });

    await applyCatalogCleanup(migrationArgs());
    await applyCatalogCleanup(migrationArgs());
    expect(await schemaEvidence()).toEqual({
      compatibility_columns: "0",
      compatibility_indexes: "0",
      compatibility_types: "0"
    });

    await revertCatalogCleanup(migrationArgs());
    await revertCatalogCleanup(migrationArgs());
    expect(await schemaEvidence()).toEqual({
      compatibility_columns: "8",
      compatibility_indexes: "7",
      compatibility_types: "3"
    });

    await applyCatalogCleanup(migrationArgs());
    expect(await schemaEvidence()).toEqual({
      compatibility_columns: "0",
      compatibility_indexes: "0",
      compatibility_types: "0"
    });
  });
});
