import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: generated CREATE/DROP/ALTER statements are wrapped
// with IF NOT EXISTS / IF EXISTS / duplicate_object guards. See readmes/MIGRATIONS.md.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_items_mode" AS ENUM('standard_purchase', 'request_to_order', 'private_order'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_items_currency" AS ENUM('KRW', 'USD', 'JPY', 'EUR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_order_mode" AS ENUM('standard_purchase', 'request_to_order', 'private_order'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_lifecycle_status" AS ENUM('draft', 'quote_requested', 'quote_ready', 'pending_payment', 'paid', 'paid_inventory_review', 'committed', 'confirmed', 'converted', 'failed', 'canceled', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('unpaid', 'pending', 'paid', 'pending_manual', 'failed', 'refunded', 'partially_refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_orders_fulfillment_status" AS ENUM('unfulfilled', 'reserved', 'in_production', 'fulfilled', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_transactions_items_mode" AS ENUM('standard_purchase', 'request_to_order', 'private_order'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_transactions_items_currency" AS ENUM('KRW', 'USD', 'JPY', 'EUR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "mode" "enum_orders_items_mode" DEFAULT 'standard_purchase' NOT NULL;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "campaign" varchar;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "schema_version" numeric DEFAULT 3;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "product_name" varchar;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "product_slug" varchar;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "sku" varchar;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "sku_label" varchar;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "options" jsonb;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "currency" "enum_orders_items_currency" DEFAULT 'KRW';
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "unit_amount" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "line_amount" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "weight_grams" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "length_mm" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "width_mm" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "height_mm" numeric;
  ALTER TABLE IF EXISTS "orders_items" ADD COLUMN IF NOT EXISTS "tax_category" varchar;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "order_ref" varchar NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "order_mode" "enum_orders_order_mode" DEFAULT 'standard_purchase' NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "lifecycle_status" "enum_orders_lifecycle_status" DEFAULT 'pending_payment' NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "fulfillment_status" "enum_orders_fulfillment_status" DEFAULT 'unfulfilled' NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "campaign" varchar;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "quote" jsonb;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "contact" jsonb;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "line_snapshot_version" numeric DEFAULT 3 NOT NULL;
  ALTER TABLE IF EXISTS "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp(3) with time zone;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "mode" "enum_transactions_items_mode" DEFAULT 'standard_purchase' NOT NULL;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "campaign" varchar;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "schema_version" numeric DEFAULT 3;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "product_name" varchar;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "product_slug" varchar;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "sku" varchar;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "sku_label" varchar;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "options" jsonb;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "currency" "enum_transactions_items_currency" DEFAULT 'KRW';
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "unit_amount" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "line_amount" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "weight_grams" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "length_mm" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "width_mm" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "height_mm" numeric;
  ALTER TABLE IF EXISTS "transactions_items" ADD COLUMN IF NOT EXISTS "tax_category" varchar;
  CREATE INDEX IF NOT EXISTS "orders_items_mode_idx" ON "orders_items" USING btree ("mode");
  CREATE INDEX IF NOT EXISTS "orders_items_campaign_idx" ON "orders_items" USING btree ("campaign");
  CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_ref_idx" ON "orders" USING btree ("order_ref");
  CREATE INDEX IF NOT EXISTS "orders_order_mode_idx" ON "orders" USING btree ("order_mode");
  CREATE INDEX IF NOT EXISTS "orders_lifecycle_status_idx" ON "orders" USING btree ("lifecycle_status");
  CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
  CREATE INDEX IF NOT EXISTS "orders_fulfillment_status_idx" ON "orders" USING btree ("fulfillment_status");
  CREATE INDEX IF NOT EXISTS "orders_campaign_idx" ON "orders" USING btree ("campaign");
  CREATE INDEX IF NOT EXISTS "orders_paid_at_idx" ON "orders" USING btree ("paid_at");
  CREATE INDEX IF NOT EXISTS "transactions_items_mode_idx" ON "transactions_items" USING btree ("mode");
  CREATE INDEX IF NOT EXISTS "transactions_items_campaign_idx" ON "transactions_items" USING btree ("campaign");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "orders_items_mode_idx";
  DROP INDEX IF EXISTS "orders_items_campaign_idx";
  DROP INDEX IF EXISTS "orders_order_ref_idx";
  DROP INDEX IF EXISTS "orders_order_mode_idx";
  DROP INDEX IF EXISTS "orders_lifecycle_status_idx";
  DROP INDEX IF EXISTS "orders_payment_status_idx";
  DROP INDEX IF EXISTS "orders_fulfillment_status_idx";
  DROP INDEX IF EXISTS "orders_campaign_idx";
  DROP INDEX IF EXISTS "orders_paid_at_idx";
  DROP INDEX IF EXISTS "transactions_items_mode_idx";
  DROP INDEX IF EXISTS "transactions_items_campaign_idx";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "mode";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "campaign";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "schema_version";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "product_name";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "product_slug";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "sku";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "sku_label";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "options";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "currency";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "unit_amount";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "line_amount";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "weight_grams";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "length_mm";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "width_mm";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "height_mm";
  ALTER TABLE IF EXISTS "orders_items" DROP COLUMN IF EXISTS "tax_category";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "order_ref";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "order_mode";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "lifecycle_status";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "payment_status";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "fulfillment_status";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "campaign";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "quote";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "contact";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "line_snapshot_version";
  ALTER TABLE IF EXISTS "orders" DROP COLUMN IF EXISTS "paid_at";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "mode";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "campaign";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "schema_version";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "product_name";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "product_slug";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "sku";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "sku_label";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "options";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "currency";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "unit_amount";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "line_amount";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "weight_grams";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "length_mm";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "width_mm";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "height_mm";
  ALTER TABLE IF EXISTS "transactions_items" DROP COLUMN IF EXISTS "tax_category";
  DROP TYPE IF EXISTS "public"."enum_orders_items_mode";
  DROP TYPE IF EXISTS "public"."enum_orders_items_currency";
  DROP TYPE IF EXISTS "public"."enum_orders_order_mode";
  DROP TYPE IF EXISTS "public"."enum_orders_lifecycle_status";
  DROP TYPE IF EXISTS "public"."enum_orders_payment_status";
  DROP TYPE IF EXISTS "public"."enum_orders_fulfillment_status";
  DROP TYPE IF EXISTS "public"."enum_transactions_items_mode";
  DROP TYPE IF EXISTS "public"."enum_transactions_items_currency";`)
}
