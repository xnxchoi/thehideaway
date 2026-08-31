import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: copy Stack A commerce rows into plugin tables
// before DROP, and wrap every DROP/ALTER with IF EXISTS / duplicate_object
// guards. See readmes/MIGRATIONS.md.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF to_regclass('public.commerce_products') IS NULL THEN
      RETURN;
    END IF;

    INSERT INTO "products" (
      "id",
      "name",
      "slug",
      "active",
      "storefront",
      "summary",
      "description",
      "details",
      "care",
      "shipping_returns",
      "hero_media_id",
      "price_in_k_r_w_enabled",
      "price_in_k_r_w",
      "max_order_quantity",
      "min_order_quantity",
      "standard_enabled",
      "request_to_order_enabled",
      "private_order_enabled",
      "private_preset_price_enabled",
      "private_tier_gate",
      "enable_variants",
      "sort",
      "_status",
      "updated_at",
      "created_at"
    )
    SELECT
      cp."id",
      cp."name",
      cp."slug",
      cp."active",
      'lostinseoul',
      cp."summary",
      cp."description",
      cp."details",
      cp."care",
      cp."shipping_returns",
      cp."hero_media_id",
      (cp."unit_amount" >= 1),
      CASE WHEN cp."unit_amount" >= 1 THEN cp."unit_amount" ELSE NULL END,
      cp."max_quantity",
      1,
      true,
      false,
      false,
      false,
      'anyone'::"enum_products_private_tier_gate",
      false,
      cp."sort",
      CASE WHEN cp."active" THEN 'published'::"enum_products_status" ELSE 'draft'::"enum_products_status" END,
      cp."updated_at",
      cp."created_at"
    FROM "commerce_products" cp
    WHERE NOT EXISTS (SELECT 1 FROM "products" p WHERE p."id" = cp."id")
      AND NOT EXISTS (SELECT 1 FROM "products" p WHERE p."slug" = cp."slug");

    IF to_regclass('public.commerce_products_rels') IS NOT NULL THEN
      INSERT INTO "products_rels" ("order", "parent_id", "path", "media_id")
      SELECT r."order", r."parent_id", r."path", r."media_id"
      FROM "commerce_products_rels" r
      WHERE r."path" = 'gallery'
        AND EXISTS (SELECT 1 FROM "products" p WHERE p."id" = r."parent_id")
        AND NOT EXISTS (
          SELECT 1 FROM "products_rels" pr
          WHERE pr."parent_id" = r."parent_id"
            AND pr."path" = r."path"
            AND pr."media_id" IS NOT DISTINCT FROM r."media_id"
        );
    END IF;
  END $$;

  DO $$ BEGIN
    IF to_regclass('public.commerce_orders') IS NULL THEN
      RETURN;
    END IF;

    INSERT INTO "orders" (
      "id",
      "customer_id",
      "customer_email",
      "amount",
      "currency",
      "status",
      "order_ref",
      "order_mode",
      "lifecycle_status",
      "payment_status",
      "fulfillment_status",
      "contact",
      "shipping_address_title",
      "shipping_address_first_name",
      "shipping_address_last_name",
      "shipping_address_company",
      "shipping_address_address_line1",
      "shipping_address_address_line2",
      "shipping_address_city",
      "shipping_address_state",
      "shipping_address_postal_code",
      "shipping_address_country",
      "shipping_address_phone",
      "line_snapshot_version",
      "paid_at",
      "updated_at",
      "created_at"
    )
    SELECT
      co."id",
      co."user_id",
      co."contact" ->> 'email',
      co."total_amount",
      'KRW'::"enum_orders_currency",
      CASE co."status"
        WHEN 'completed' THEN 'completed'
        WHEN 'canceled' THEN 'cancelled'
        ELSE 'processing'
      END::"enum_orders_status",
      co."ref",
      'standard_purchase'::"enum_orders_order_mode",
      CASE co."status"
        WHEN 'awaiting_payment' THEN 'pending_payment'
        WHEN 'paid' THEN 'paid'
        WHEN 'preparing' THEN 'committed'
        WHEN 'shipped' THEN 'confirmed'
        WHEN 'completed' THEN 'converted'
        WHEN 'canceled' THEN 'canceled'
        ELSE 'pending_payment'
      END::"enum_orders_lifecycle_status",
      CASE co."payment_status"
        WHEN 'paid' THEN 'paid'
        WHEN 'failed' THEN 'failed'
        WHEN 'pending' THEN 'pending'
        ELSE 'unpaid'
      END::"enum_orders_payment_status",
      CASE co."status"
        WHEN 'paid' THEN 'reserved'
        WHEN 'preparing' THEN 'in_production'
        WHEN 'shipped' THEN 'fulfilled'
        WHEN 'completed' THEN 'fulfilled'
        WHEN 'canceled' THEN 'canceled'
        ELSE 'unfulfilled'
      END::"enum_orders_fulfillment_status",
      CASE
        WHEN jsonb_typeof(co."contact") = 'object'
          THEN co."contact" || jsonb_build_object('shipping', co."shipping")
        ELSE jsonb_build_object('shipping', co."shipping")
      END,
      co."shipping" ->> 'title',
      COALESCE(co."shipping" ->> 'firstName', co."shipping" ->> 'first_name'),
      COALESCE(co."shipping" ->> 'lastName', co."shipping" ->> 'last_name'),
      co."shipping" ->> 'company',
      COALESCE(
        co."shipping" ->> 'addressLine1',
        co."shipping" ->> 'address_line1',
        co."shipping" ->> 'address'
      ),
      COALESCE(co."shipping" ->> 'addressLine2', co."shipping" ->> 'address_line2'),
      co."shipping" ->> 'city',
      co."shipping" ->> 'state',
      COALESCE(
        co."shipping" ->> 'postalCode',
        co."shipping" ->> 'postal_code',
        co."shipping" ->> 'zip'
      ),
      co."shipping" ->> 'country',
      co."shipping" ->> 'phone',
      3,
      co."paid_at",
      co."updated_at",
      co."created_at"
    FROM "commerce_orders" co
    WHERE NOT EXISTS (SELECT 1 FROM "orders" o WHERE o."id" = co."id")
      AND NOT EXISTS (SELECT 1 FROM "orders" o WHERE o."order_ref" = co."ref");

    INSERT INTO "orders_items" (
      "_order",
      "_parent_id",
      "product_id",
      "quantity",
      "mode",
      "product_name",
      "product_slug",
      "currency",
      "unit_amount",
      "line_amount",
      "schema_version"
    )
    SELECT
      1,
      co."id",
      CASE WHEN EXISTS (SELECT 1 FROM "products" p WHERE p."id" = co."product_id")
        THEN co."product_id" ELSE NULL END,
      co."quantity",
      'standard_purchase'::"enum_orders_items_mode",
      co."product_name_snapshot",
      co."product_slug_snapshot",
      'KRW'::"enum_orders_items_currency",
      co."unit_amount_snapshot",
      co."total_amount",
      3
    FROM "commerce_orders" co
    WHERE EXISTS (SELECT 1 FROM "orders" o WHERE o."id" = co."id")
      AND NOT EXISTS (
        SELECT 1 FROM "orders_items" oi WHERE oi."_parent_id" = co."id"
      );
  END $$;

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commerce_products_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commerce_orders_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_commerce_products_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_commerce_orders_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "commerce_products_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "commerce_orders_id";
  DROP TABLE IF EXISTS "commerce_orders" CASCADE;
  DROP TABLE IF EXISTS "commerce_products_rels" CASCADE;
  DROP TABLE IF EXISTS "commerce_products" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_commerce_products_currency";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_currency";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_payment_method";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_payment_status";
  DROP TYPE IF EXISTS "public"."enum_commerce_orders_status";

  DROP TABLE IF EXISTS "product_carts" CASCADE;
  DROP TABLE IF EXISTS "product_orders" CASCADE;
  DROP TABLE IF EXISTS "product_payments" CASCADE;
  DROP TABLE IF EXISTS "product_order_campaigns" CASCADE;
  DO $$ BEGIN
    IF to_regclass('public.inventory_levels') IS NULL THEN
      DROP TABLE IF EXISTS "product_variants" CASCADE;
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN CREATE TYPE "public"."enum_commerce_products_currency" AS ENUM('KRW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_commerce_orders_currency" AS ENUM('KRW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_commerce_orders_payment_method" AS ENUM('card', 'bank_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_commerce_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_commerce_orders_status" AS ENUM('awaiting_payment', 'paid', 'preparing', 'shipped', 'completed', 'canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS "commerce_products" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"unit_amount" numeric NOT NULL,
  	"currency" "enum_commerce_products_currency" DEFAULT 'KRW' NOT NULL,
  	"max_quantity" numeric DEFAULT 1 NOT NULL,
  	"summary" varchar,
  	"description" jsonb,
  	"details" varchar,
  	"care" varchar,
  	"shipping_returns" varchar,
  	"hero_media_id" varchar,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "commerce_products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" varchar
  );

  CREATE TABLE IF NOT EXISTS "commerce_orders" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"ref" varchar NOT NULL,
  	"user_id" uuid NOT NULL,
  	"product_id" uuid NOT NULL,
  	"product_name_snapshot" varchar NOT NULL,
  	"product_slug_snapshot" varchar NOT NULL,
  	"quantity" numeric NOT NULL,
  	"unit_amount_snapshot" numeric NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"currency" "enum_commerce_orders_currency" DEFAULT 'KRW' NOT NULL,
  	"payment_method" "enum_commerce_orders_payment_method" NOT NULL,
  	"payment_status" "enum_commerce_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"status" "enum_commerce_orders_status" DEFAULT 'awaiting_payment' NOT NULL,
  	"contact" jsonb NOT NULL,
  	"shipping" jsonb NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"request_hash" varchar NOT NULL,
  	"provider_payment_id" varchar,
  	"provider_transaction_id" varchar,
  	"bank_transfer_reference" varchar,
  	"tracking_number" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"shipped_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "commerce_products_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "commerce_orders_id" uuid;
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_products_slug_idx" ON "commerce_products" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "commerce_products_active_idx" ON "commerce_products" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "commerce_products_hero_media_idx" ON "commerce_products" USING btree ("hero_media_id");
  CREATE INDEX IF NOT EXISTS "commerce_products_sort_idx" ON "commerce_products" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "commerce_products_updated_at_idx" ON "commerce_products" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commerce_products_created_at_idx" ON "commerce_products" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_order_idx" ON "commerce_products_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_parent_idx" ON "commerce_products_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_path_idx" ON "commerce_products_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "commerce_products_rels_media_id_idx" ON "commerce_products_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_ref_idx" ON "commerce_orders" USING btree ("ref");
  CREATE INDEX IF NOT EXISTS "commerce_orders_user_idx" ON "commerce_orders" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_product_idx" ON "commerce_orders" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_payment_status_idx" ON "commerce_orders" USING btree ("payment_status");
  CREATE INDEX IF NOT EXISTS "commerce_orders_status_idx" ON "commerce_orders" USING btree ("status");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_idempotency_key_idx" ON "commerce_orders" USING btree ("idempotency_key");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_provider_payment_id_idx" ON "commerce_orders" USING btree ("provider_payment_id");
  CREATE INDEX IF NOT EXISTS "commerce_orders_provider_transaction_id_idx" ON "commerce_orders" USING btree ("provider_transaction_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_bank_transfer_reference_idx" ON "commerce_orders" USING btree ("bank_transfer_reference");
  CREATE INDEX IF NOT EXISTS "commerce_orders_paid_at_idx" ON "commerce_orders" USING btree ("paid_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_shipped_at_idx" ON "commerce_orders" USING btree ("shipped_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_completed_at_idx" ON "commerce_orders" USING btree ("completed_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_updated_at_idx" ON "commerce_orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "commerce_orders_created_at_idx" ON "commerce_orders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_products_id_idx" ON "payload_locked_documents_rels" USING btree ("commerce_products_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_commerce_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("commerce_orders_id");
  `)
}
