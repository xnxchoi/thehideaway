import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_products_variant_source" AS ENUM('legacy', 'relational');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_product_variants_stock_state" AS ENUM('in_stock', 'out_of_stock', 'pre_order', 'on_request');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "product_variants_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
	-- WHY-OVERRIDE-PAYLOAD: Payload 3.86 writes 24-character array-row IDs at
	-- runtime. This mirrors src/payload-generated-schema.ts and prevents writes
	-- from failing even though migrate:create emitted UUID here.
	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "product_variants" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"product_id" uuid NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"sku" varchar,
  	"label" varchar,
  	"option_key" varchar NOT NULL,
  	"price_override_amount" numeric,
  	"barcode" varchar,
  	"weight_grams" numeric,
  	"length_mm" numeric,
  	"width_mm" numeric,
  	"height_mm" numeric,
  	"tax_category" varchar,
  	"legacy_variant_ref" varchar,
  	"legacy_key" varchar,
  	"inventory" numeric,
  	"stock_state" "enum_product_variants_stock_state",
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "product_order_campaigns_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"product_variants_id" uuid
  );
  
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "variant_source" "enum_products_variant_source" DEFAULT 'legacy' NOT NULL;
  ALTER TABLE IF EXISTS "product_carts" ADD COLUMN IF NOT EXISTS "line_schema_version" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE IF EXISTS "product_orders" ADD COLUMN IF NOT EXISTS "line_snapshot_version" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_variants_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_options_parent_id_fk') THEN
      ALTER TABLE "product_variants_options" ADD CONSTRAINT "product_variants_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_products_id_fk') THEN
      ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_order_campaigns_rels_parent_fk') THEN
      ALTER TABLE "product_order_campaigns_rels" ADD CONSTRAINT "product_order_campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_order_campaigns"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_order_campaigns_rels_product_variants_fk') THEN
      ALTER TABLE "product_order_campaigns_rels" ADD CONSTRAINT "product_order_campaigns_rels_product_variants_fk" FOREIGN KEY ("product_variants_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "product_variants_options_order_idx" ON "product_variants_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "product_variants_options_parent_id_idx" ON "product_variants_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "product_variants_active_idx" ON "product_variants" USING btree ("active");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants" USING btree ("sku");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_option_key_idx" ON "product_variants" USING btree ("option_key");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_barcode_idx" ON "product_variants" USING btree ("barcode");
  CREATE INDEX IF NOT EXISTS "product_variants_legacy_variant_ref_idx" ON "product_variants" USING btree ("legacy_variant_ref");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_legacy_key_idx" ON "product_variants" USING btree ("legacy_key");
  CREATE INDEX IF NOT EXISTS "product_variants_inventory_idx" ON "product_variants" USING btree ("inventory");
  CREATE INDEX IF NOT EXISTS "product_variants_stock_state_idx" ON "product_variants" USING btree ("stock_state");
  CREATE INDEX IF NOT EXISTS "product_variants_sort_idx" ON "product_variants" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "product_variants_updated_at_idx" ON "product_variants" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "product_variants_created_at_idx" ON "product_variants" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "product_order_campaigns_rels_order_idx" ON "product_order_campaigns_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "product_order_campaigns_rels_parent_idx" ON "product_order_campaigns_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "product_order_campaigns_rels_path_idx" ON "product_order_campaigns_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "product_order_campaigns_rels_product_variants_id_idx" ON "product_order_campaigns_rels" USING btree ("product_variants_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_product_variants_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_variants_fk" FOREIGN KEY ("product_variants_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "products_variant_source_idx" ON "products" USING btree ("variant_source");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("product_variants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "product_variants_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "product_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "product_order_campaigns_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "product_variants_options" CASCADE;
  DROP TABLE IF EXISTS "product_variants" CASCADE;
  DROP TABLE IF EXISTS "product_order_campaigns_rels" CASCADE;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_variants_fk";
  
  DROP INDEX IF EXISTS "products_variant_source_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_product_variants_id_idx";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "variant_source";
  ALTER TABLE IF EXISTS "product_carts" DROP COLUMN IF EXISTS "line_schema_version";
  ALTER TABLE IF EXISTS "product_orders" DROP COLUMN IF EXISTS "line_snapshot_version";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_variants_id";
  DROP TYPE IF EXISTS "public"."enum_products_variant_source";
  DROP TYPE IF EXISTS "public"."enum_product_variants_stock_state";`)
}
