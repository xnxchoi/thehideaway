import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: generated CREATE/DROP/ALTER statements are wrapped
// with IF NOT EXISTS / IF EXISTS / duplicate_object guards so this file can
// be re-run. See readmes/MIGRATIONS.md.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_carts_items_mode" AS ENUM('standard_purchase', 'request_to_order', 'private_order');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_carts_items_currency" AS ENUM('KRW', 'USD', 'JPY', 'EUR');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "mode" "enum_carts_items_mode" DEFAULT 'standard_purchase' NOT NULL;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "campaign" varchar;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "schema_version" numeric DEFAULT 3;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "product_name" varchar;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "product_slug" varchar;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "sku" varchar;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "sku_label" varchar;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "options" jsonb;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "currency" "enum_carts_items_currency" DEFAULT 'KRW';
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "unit_amount" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "line_amount" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "weight_grams" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "length_mm" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "width_mm" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "height_mm" numeric;
  ALTER TABLE IF EXISTS "carts_items" ADD COLUMN IF NOT EXISTS "tax_category" varchar;
  CREATE INDEX IF NOT EXISTS "carts_items_mode_idx" ON "carts_items" USING btree ("mode");
  CREATE INDEX IF NOT EXISTS "carts_items_campaign_idx" ON "carts_items" USING btree ("campaign");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "carts_items_mode_idx";
  DROP INDEX IF EXISTS "carts_items_campaign_idx";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "mode";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "campaign";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "schema_version";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "product_name";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "product_slug";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "sku";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "sku_label";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "options";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "currency";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "unit_amount";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "line_amount";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "weight_grams";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "length_mm";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "width_mm";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "height_mm";
  ALTER TABLE IF EXISTS "carts_items" DROP COLUMN IF EXISTS "tax_category";
  DROP TYPE IF EXISTS "public"."enum_carts_items_mode";
  DROP TYPE IF EXISTS "public"."enum_carts_items_currency";`)
}
