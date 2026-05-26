import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * LOSTINSEOUL Commerce V1.
 *
 * Host-routed storefront catalog + cart/order/payment tables. This is a
 * separate commerce surface from membership billing, but it shares the same
 * Users, Media, Payload admin, and PostgreSQL database.
 *
 * Re-runnable per readmes/MIGRATIONS.md: all CREATE/DROP/ALTER operations are
 * guarded with IF EXISTS / IF NOT EXISTS or pg_constraint checks.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_products_currency" AS ENUM ('KRW', 'USD', 'JPY', 'EUR');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_products_stock_state" AS ENUM ('in_stock', 'out_of_stock', 'pre_order', 'on_request');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_products_private_tier_gate" AS ENUM ('anyone', 'resident', 'patron', 'cofounder', 'staff');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_order_campaigns_state" AS ENUM ('draft', 'open', 'met', 'failed', 'converted', 'canceled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_order_campaigns_progress_visibility" AS ENUM ('hidden', 'percentage', 'count');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_carts_status" AS ENUM ('active', 'converted', 'abandoned');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_carts_currency" AS ENUM ('KRW', 'USD', 'JPY', 'EUR');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_orders_order_mode" AS ENUM ('standard_purchase', 'request_to_order', 'private_order');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_orders_status" AS ENUM ('draft', 'quote_requested', 'quote_ready', 'pending_payment', 'paid', 'committed', 'confirmed', 'converted', 'failed', 'canceled', 'refunded');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_orders_payment_status" AS ENUM ('unpaid', 'pending', 'pending_manual', 'paid', 'failed', 'refunded', 'partially_refunded');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_orders_fulfillment_status" AS ENUM ('unfulfilled', 'reserved', 'in_production', 'fulfilled', 'canceled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_orders_currency" AS ENUM ('KRW', 'USD', 'JPY', 'EUR');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_payments_provider" AS ENUM ('portone', 'manual');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_payments_status" AS ENUM ('initiated', 'pending', 'manual_pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'canceled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_product_payments_currency" AS ENUM ('KRW', 'USD', 'JPY', 'EUR');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "product_category" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "sort" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "product_sub" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "product_drops" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "active" boolean DEFAULT false NOT NULL,
      "kicker" varchar,
      "lede" varchar,
      "hero_media_id" uuid,
      "sort" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "products" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "active" boolean DEFAULT false NOT NULL,
      "storefront" varchar DEFAULT 'lostinseoul' NOT NULL,
      "drop_id" uuid,
      "category_id" uuid,
      "summary" varchar,
      "description" jsonb,
      "details" varchar,
      "care" varchar,
      "shipping_returns" varchar,
      "hero_media_id" uuid,
      "currency" "enum_products_currency" DEFAULT 'KRW' NOT NULL,
      "unit_amount" numeric DEFAULT 0 NOT NULL,
      "compare_at_amount" numeric,
      "stock_state" "enum_products_stock_state" DEFAULT 'on_request' NOT NULL,
      "inventory" numeric DEFAULT 0,
      "max_order_quantity" numeric DEFAULT 1 NOT NULL,
      "min_order_quantity" numeric DEFAULT 1 NOT NULL,
      "variants" jsonb,
      "standard_enabled" boolean DEFAULT true NOT NULL,
      "request_to_order_enabled" boolean DEFAULT false NOT NULL,
      "private_order_enabled" boolean DEFAULT false NOT NULL,
      "private_preset_price_enabled" boolean DEFAULT false NOT NULL,
      "private_unit_amount" numeric,
      "private_tier_gate" "enum_products_private_tier_gate" DEFAULT 'anyone' NOT NULL,
      "sort" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "products_rels" (
      "id" serial PRIMARY KEY,
      "order" integer,
      "parent_id" uuid NOT NULL,
      "path" varchar NOT NULL,
      "media_id" uuid
    );

    CREATE TABLE IF NOT EXISTS "product_order_campaigns" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "title" varchar NOT NULL,
      "product_id" uuid NOT NULL,
      "state" "enum_product_order_campaigns_state" DEFAULT 'draft' NOT NULL,
      "minimum_commitments" numeric NOT NULL,
      "maximum_commitments" numeric,
      "paid_commitments" numeric DEFAULT 0 NOT NULL,
      "deadline" timestamp(3) with time zone NOT NULL,
      "progress_visibility" "enum_product_order_campaigns_progress_visibility" DEFAULT 'hidden' NOT NULL,
      "eligible_variants" jsonb,
      "refund_policy" varchar,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "product_carts" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "user_id" uuid NOT NULL,
      "storefront" varchar DEFAULT 'lostinseoul' NOT NULL,
      "status" "enum_product_carts_status" DEFAULT 'active' NOT NULL,
      "currency" "enum_product_carts_currency" DEFAULT 'KRW' NOT NULL,
      "lines" jsonb,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "product_orders" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "order_ref" varchar NOT NULL,
      "user_id" uuid NOT NULL,
      "storefront" varchar DEFAULT 'lostinseoul' NOT NULL,
      "order_mode" "enum_product_orders_order_mode" DEFAULT 'standard_purchase' NOT NULL,
      "status" "enum_product_orders_status" DEFAULT 'draft' NOT NULL,
      "payment_status" "enum_product_orders_payment_status" DEFAULT 'unpaid' NOT NULL,
      "fulfillment_status" "enum_product_orders_fulfillment_status" DEFAULT 'unfulfilled' NOT NULL,
      "currency" "enum_product_orders_currency" DEFAULT 'KRW' NOT NULL,
      "subtotal_amount" numeric DEFAULT 0 NOT NULL,
      "total_amount" numeric DEFAULT 0 NOT NULL,
      "campaign_id" uuid,
      "lines" jsonb,
      "shipping" jsonb,
      "contact" jsonb,
      "quote" jsonb,
      "paid_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS "product_payments" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7(),
      "payment_ref" varchar NOT NULL,
      "order_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "provider" "enum_product_payments_provider" DEFAULT 'manual' NOT NULL,
      "status" "enum_product_payments_status" DEFAULT 'initiated' NOT NULL,
      "amount" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_product_payments_currency" DEFAULT 'KRW' NOT NULL,
      "portone_order_ref" varchar,
      "portone_transaction_ref" varchar,
      "payment_channel" varchar,
      "payment_method" varchar,
      "request_payload" jsonb,
      "events" jsonb,
      "paid_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_drops_hero_media_id_media_id_fk') THEN
        ALTER TABLE "product_drops" ADD CONSTRAINT "product_drops_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_drop_id_product_drops_id_fk') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_drop_id_product_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "product_drops"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_product_category_id_fk') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_hero_media_id_media_id_fk') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_parent_fk') THEN
        ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_media_fk') THEN
        ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_order_campaigns_product_id_products_id_fk') THEN
        ALTER TABLE "product_order_campaigns" ADD CONSTRAINT "product_order_campaigns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_carts_user_id_users_id_fk') THEN
        ALTER TABLE "product_carts" ADD CONSTRAINT "product_carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_orders_user_id_users_id_fk') THEN
        ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_orders_campaign_id_product_order_campaigns_id_fk') THEN
        ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_campaign_id_product_order_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "product_order_campaigns"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_payments_order_id_product_orders_id_fk') THEN
        ALTER TABLE "product_payments" ADD CONSTRAINT "product_payments_order_id_product_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "product_orders"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_payments_user_id_users_id_fk') THEN
        ALTER TABLE "product_payments" ADD CONSTRAINT "product_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "product_category_slug_idx" ON "product_category" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "product_category_sort_idx" ON "product_category" USING btree ("sort");
    CREATE INDEX IF NOT EXISTS "product_category_updated_at_idx" ON "product_category" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_category_created_at_idx" ON "product_category" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_sub_slug_idx" ON "product_sub" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "product_sub_updated_at_idx" ON "product_sub" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_sub_created_at_idx" ON "product_sub" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_drops_slug_idx" ON "product_drops" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "product_drops_active_idx" ON "product_drops" USING btree ("active");
    CREATE INDEX IF NOT EXISTS "product_drops_hero_media_idx" ON "product_drops" USING btree ("hero_media_id");
    CREATE INDEX IF NOT EXISTS "product_drops_sort_idx" ON "product_drops" USING btree ("sort");
    CREATE INDEX IF NOT EXISTS "product_drops_updated_at_idx" ON "product_drops" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_drops_created_at_idx" ON "product_drops" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_name_idx" ON "products" USING btree ("name");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "products_active_idx" ON "products" USING btree ("active");
    CREATE INDEX IF NOT EXISTS "products_storefront_idx" ON "products" USING btree ("storefront");
    CREATE INDEX IF NOT EXISTS "products_drop_idx" ON "products" USING btree ("drop_id");
    CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category_id");
    CREATE INDEX IF NOT EXISTS "products_hero_media_idx" ON "products" USING btree ("hero_media_id");
    CREATE INDEX IF NOT EXISTS "products_currency_idx" ON "products" USING btree ("currency");
    CREATE INDEX IF NOT EXISTS "products_unit_amount_idx" ON "products" USING btree ("unit_amount");
    CREATE INDEX IF NOT EXISTS "products_stock_state_idx" ON "products" USING btree ("stock_state");
    CREATE INDEX IF NOT EXISTS "products_inventory_idx" ON "products" USING btree ("inventory");
    CREATE INDEX IF NOT EXISTS "products_standard_enabled_idx" ON "products" USING btree ("standard_enabled");
    CREATE INDEX IF NOT EXISTS "products_request_to_order_enabled_idx" ON "products" USING btree ("request_to_order_enabled");
    CREATE INDEX IF NOT EXISTS "products_private_order_enabled_idx" ON "products" USING btree ("private_order_enabled");
    CREATE INDEX IF NOT EXISTS "products_private_tier_gate_idx" ON "products" USING btree ("private_tier_gate");
    CREATE INDEX IF NOT EXISTS "products_sort_idx" ON "products" USING btree ("sort");
    CREATE INDEX IF NOT EXISTS "products_updated_at_idx" ON "products" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "products_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
    CREATE INDEX IF NOT EXISTS "product_order_campaigns_product_idx" ON "product_order_campaigns" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_order_campaigns_state_idx" ON "product_order_campaigns" USING btree ("state");
    CREATE INDEX IF NOT EXISTS "product_order_campaigns_deadline_idx" ON "product_order_campaigns" USING btree ("deadline");
    CREATE INDEX IF NOT EXISTS "product_order_campaigns_updated_at_idx" ON "product_order_campaigns" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_order_campaigns_created_at_idx" ON "product_order_campaigns" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "product_carts_user_idx" ON "product_carts" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "product_carts_storefront_idx" ON "product_carts" USING btree ("storefront");
    CREATE INDEX IF NOT EXISTS "product_carts_status_idx" ON "product_carts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "product_carts_updated_at_idx" ON "product_carts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_carts_created_at_idx" ON "product_carts" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_orders_order_ref_idx" ON "product_orders" USING btree ("order_ref");
    CREATE INDEX IF NOT EXISTS "product_orders_user_idx" ON "product_orders" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "product_orders_storefront_idx" ON "product_orders" USING btree ("storefront");
    CREATE INDEX IF NOT EXISTS "product_orders_order_mode_idx" ON "product_orders" USING btree ("order_mode");
    CREATE INDEX IF NOT EXISTS "product_orders_status_idx" ON "product_orders" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "product_orders_payment_status_idx" ON "product_orders" USING btree ("payment_status");
    CREATE INDEX IF NOT EXISTS "product_orders_campaign_idx" ON "product_orders" USING btree ("campaign_id");
    CREATE INDEX IF NOT EXISTS "product_orders_paid_at_idx" ON "product_orders" USING btree ("paid_at");
    CREATE INDEX IF NOT EXISTS "product_orders_expires_at_idx" ON "product_orders" USING btree ("expires_at");
    CREATE INDEX IF NOT EXISTS "product_orders_updated_at_idx" ON "product_orders" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_orders_created_at_idx" ON "product_orders" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_payments_payment_ref_idx" ON "product_payments" USING btree ("payment_ref");
    CREATE INDEX IF NOT EXISTS "product_payments_order_idx" ON "product_payments" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "product_payments_user_idx" ON "product_payments" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "product_payments_provider_idx" ON "product_payments" USING btree ("provider");
    CREATE INDEX IF NOT EXISTS "product_payments_status_idx" ON "product_payments" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "product_payments_portone_order_ref_idx" ON "product_payments" USING btree ("portone_order_ref");
    CREATE INDEX IF NOT EXISTS "product_payments_portone_transaction_ref_idx" ON "product_payments" USING btree ("portone_transaction_ref");
    CREATE INDEX IF NOT EXISTS "product_payments_updated_at_idx" ON "product_payments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_payments_created_at_idx" ON "product_payments" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_category_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_sub_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_drops_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "products_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_order_campaigns_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_carts_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_orders_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_payments_id" uuid;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_category_id_idx" ON "payload_locked_documents_rels" USING btree ("product_category_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_sub_id_idx" ON "payload_locked_documents_rels" USING btree ("product_sub_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_drops_id_idx" ON "payload_locked_documents_rels" USING btree ("product_drops_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_order_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("product_order_campaigns_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("product_carts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("product_orders_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("product_payments_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_payments_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_orders_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_carts_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_order_campaigns_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_products_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_drops_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_sub_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_category_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_payments_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_orders_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_carts_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_order_campaigns_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "products_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_drops_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_sub_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_category_id";

    DROP TABLE IF EXISTS "product_payments" CASCADE;
    DROP TABLE IF EXISTS "product_orders" CASCADE;
    DROP TABLE IF EXISTS "product_carts" CASCADE;
    DROP TABLE IF EXISTS "product_order_campaigns" CASCADE;
    DROP TABLE IF EXISTS "products_rels" CASCADE;
    DROP TABLE IF EXISTS "products" CASCADE;
    DROP TABLE IF EXISTS "product_drops" CASCADE;
    DROP TABLE IF EXISTS "product_sub" CASCADE;
    DROP TABLE IF EXISTS "product_category" CASCADE;

    DROP TYPE IF EXISTS "enum_product_payments_currency";
    DROP TYPE IF EXISTS "enum_product_payments_status";
    DROP TYPE IF EXISTS "enum_product_payments_provider";
    DROP TYPE IF EXISTS "enum_product_orders_currency";
    DROP TYPE IF EXISTS "enum_product_orders_fulfillment_status";
    DROP TYPE IF EXISTS "enum_product_orders_payment_status";
    DROP TYPE IF EXISTS "enum_product_orders_status";
    DROP TYPE IF EXISTS "enum_product_orders_order_mode";
    DROP TYPE IF EXISTS "enum_product_carts_currency";
    DROP TYPE IF EXISTS "enum_product_carts_status";
    DROP TYPE IF EXISTS "enum_product_order_campaigns_progress_visibility";
    DROP TYPE IF EXISTS "enum_product_order_campaigns_state";
    DROP TYPE IF EXISTS "enum_products_private_tier_gate";
    DROP TYPE IF EXISTS "enum_products_stock_state";
    DROP TYPE IF EXISTS "enum_products_currency";
  `);
}
