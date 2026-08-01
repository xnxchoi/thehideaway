import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "products_stock_state_idx";
  DROP INDEX IF EXISTS "products_inventory_idx";
  DROP INDEX IF EXISTS "products_variant_source_idx";
  DROP INDEX IF EXISTS "product_variants_legacy_variant_ref_idx";
  DROP INDEX IF EXISTS "product_variants_legacy_key_idx";
  DROP INDEX IF EXISTS "product_variants_inventory_idx";
  DROP INDEX IF EXISTS "product_variants_stock_state_idx";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "stock_state";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "inventory";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "variant_source";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "variants";
  ALTER TABLE IF EXISTS "product_variants" DROP COLUMN IF EXISTS "legacy_variant_ref";
  ALTER TABLE IF EXISTS "product_variants" DROP COLUMN IF EXISTS "legacy_key";
  ALTER TABLE IF EXISTS "product_variants" DROP COLUMN IF EXISTS "inventory";
  ALTER TABLE IF EXISTS "product_variants" DROP COLUMN IF EXISTS "stock_state";
  DROP TYPE IF EXISTS "public"."enum_products_stock_state";
  DROP TYPE IF EXISTS "public"."enum_products_variant_source";
  DROP TYPE IF EXISTS "public"."enum_product_variants_stock_state";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_products_stock_state" AS ENUM('in_stock', 'out_of_stock', 'pre_order', 'on_request');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_products_variant_source" AS ENUM('legacy', 'relational');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_product_variants_stock_state" AS ENUM('in_stock', 'out_of_stock', 'pre_order', 'on_request');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "stock_state" "enum_products_stock_state" DEFAULT 'on_request' NOT NULL;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "inventory" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "variant_source" "enum_products_variant_source" DEFAULT 'legacy' NOT NULL;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "variants" jsonb;
  ALTER TABLE IF EXISTS "product_variants" ADD COLUMN IF NOT EXISTS "legacy_variant_ref" varchar;
  ALTER TABLE IF EXISTS "product_variants" ADD COLUMN IF NOT EXISTS "legacy_key" varchar;
  ALTER TABLE IF EXISTS "product_variants" ADD COLUMN IF NOT EXISTS "inventory" numeric;
  ALTER TABLE IF EXISTS "product_variants" ADD COLUMN IF NOT EXISTS "stock_state" "enum_product_variants_stock_state";
  CREATE INDEX IF NOT EXISTS "products_stock_state_idx" ON "products" USING btree ("stock_state");
  CREATE INDEX IF NOT EXISTS "products_inventory_idx" ON "products" USING btree ("inventory");
  CREATE INDEX IF NOT EXISTS "products_variant_source_idx" ON "products" USING btree ("variant_source");
  CREATE INDEX IF NOT EXISTS "product_variants_legacy_variant_ref_idx" ON "product_variants" USING btree ("legacy_variant_ref");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_legacy_key_idx" ON "product_variants" USING btree ("legacy_key");
  CREATE INDEX IF NOT EXISTS "product_variants_inventory_idx" ON "product_variants" USING btree ("inventory");
  CREATE INDEX IF NOT EXISTS "product_variants_stock_state_idx" ON "product_variants" USING btree ("stock_state");`);
}
