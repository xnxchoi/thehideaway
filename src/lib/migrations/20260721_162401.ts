import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_levels_disposition" AS ENUM('available', 'quarantine', 'damaged', 'inspection_pending', 'returned_pending_release', 'discarded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_movements_kind" AS ENUM('inbound', 'outbound', 'transfer');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_movements_from_disposition" AS ENUM('available', 'quarantine', 'damaged', 'inspection_pending', 'returned_pending_release', 'discarded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_movements_to_disposition" AS ENUM('available', 'quarantine', 'damaged', 'inspection_pending', 'returned_pending_release', 'discarded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_movements_source_type" AS ENUM('inventory_command');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "stock_locations" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_levels" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"aggregate_key" varchar NOT NULL,
  	"sku_id" uuid NOT NULL,
  	"location_id" uuid NOT NULL,
  	"disposition" "enum_inventory_levels_disposition" NOT NULL,
  	"quantity" numeric DEFAULT 0 NOT NULL,
  	"movement_count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_movements" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"request_hash" varchar NOT NULL,
  	"sku_id" uuid NOT NULL,
  	"kind" "enum_inventory_movements_kind" NOT NULL,
  	"quantity" numeric NOT NULL,
  	"from_location_id" uuid,
  	"from_disposition" "enum_inventory_movements_from_disposition",
  	"to_location_id" uuid,
  	"to_disposition" "enum_inventory_movements_to_disposition",
  	"reason_code" varchar NOT NULL,
  	"source_type" "enum_inventory_movements_source_type" NOT NULL,
  	"source_ref" varchar,
  	"actor" varchar,
  	"effective_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  -- WHY-OVERRIDE-PAYLOAD: ProductVariant array row IDs intentionally remain
  -- varchar because Payload 3.86 writes 24-character IDs at runtime.
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "stock_locations_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_levels_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_levels_sku_id_product_variants_id_fk') THEN
      ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_sku_id_product_variants_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_levels_location_id_stock_locations_id_fk') THEN
      ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_sku_id_product_variants_id_fk') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_sku_id_product_variants_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_from_location_id_stock_locations_id_fk') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_from_location_id_stock_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_to_location_id_stock_locations_id_fk') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_to_location_id_stock_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Payload number fields use numeric columns and cannot
  -- express integer-only or cross-field inventory invariants.
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_levels_nonnegative_integer_check') THEN
      ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_nonnegative_integer_check"
        CHECK (
          "quantity" >= 0
          AND "quantity" <= 9007199254740991
          AND "quantity" = trunc("quantity")
          AND "movement_count" >= 0
          AND "movement_count" <= 9007199254740991
          AND "movement_count" = trunc("movement_count")
        );
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_levels_aggregate_key_check') THEN
      ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_aggregate_key_check"
        CHECK ("aggregate_key" = "sku_id"::text || ':' || "location_id"::text || ':' || "disposition"::text);
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_positive_integer_quantity_check') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_positive_integer_quantity_check"
        CHECK ("quantity" > 0 AND "quantity" <= 9007199254740991 AND "quantity" = trunc("quantity"));
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_endpoint_shape_check') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_endpoint_shape_check"
        CHECK (
          ("kind" = 'inbound' AND "from_location_id" IS NULL AND "from_disposition" IS NULL AND "to_location_id" IS NOT NULL AND "to_disposition" IS NOT NULL)
          OR ("kind" = 'outbound' AND "from_location_id" IS NOT NULL AND "from_disposition" IS NOT NULL AND "to_location_id" IS NULL AND "to_disposition" IS NULL)
          OR ("kind" = 'transfer' AND "from_location_id" IS NOT NULL AND "from_disposition" IS NOT NULL AND "to_location_id" IS NOT NULL AND "to_disposition" IS NOT NULL)
        );
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_transfer_endpoints_differ_check') THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_transfer_endpoints_differ_check"
        CHECK ("kind" <> 'transfer' OR "from_location_id" <> "to_location_id" OR "from_disposition"::text <> "to_disposition"::text);
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Collection hooks cannot protect the append-only
  -- ledger from direct SQL UPDATE, DELETE, or TRUNCATE operations.
  CREATE OR REPLACE FUNCTION "public"."prevent_inventory_movement_mutation"()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$ BEGIN
    RAISE EXCEPTION 'inventory movements are append-only' USING ERRCODE = '55000';
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'inventory_movements_prevent_row_mutation'
        AND tgrelid = 'inventory_movements'::regclass
    ) THEN
      CREATE TRIGGER "inventory_movements_prevent_row_mutation"
        BEFORE UPDATE OR DELETE ON "inventory_movements"
        FOR EACH ROW EXECUTE FUNCTION "public"."prevent_inventory_movement_mutation"();
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'inventory_movements_prevent_truncate'
        AND tgrelid = 'inventory_movements'::regclass
    ) THEN
      CREATE TRIGGER "inventory_movements_prevent_truncate"
        BEFORE TRUNCATE ON "inventory_movements"
        FOR EACH STATEMENT EXECUTE FUNCTION "public"."prevent_inventory_movement_mutation"();
    END IF;
  END $$;
  CREATE UNIQUE INDEX IF NOT EXISTS "stock_locations_code_idx" ON "stock_locations" USING btree ("code");
  CREATE INDEX IF NOT EXISTS "stock_locations_active_idx" ON "stock_locations" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "stock_locations_updated_at_idx" ON "stock_locations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "stock_locations_created_at_idx" ON "stock_locations" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_levels_aggregate_key_idx" ON "inventory_levels" USING btree ("aggregate_key");
  CREATE INDEX IF NOT EXISTS "inventory_levels_sku_idx" ON "inventory_levels" USING btree ("sku_id");
  CREATE INDEX IF NOT EXISTS "inventory_levels_location_idx" ON "inventory_levels" USING btree ("location_id");
  CREATE INDEX IF NOT EXISTS "inventory_levels_disposition_idx" ON "inventory_levels" USING btree ("disposition");
  CREATE INDEX IF NOT EXISTS "inventory_levels_updated_at_idx" ON "inventory_levels" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_levels_created_at_idx" ON "inventory_levels" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "sku_location_disposition_idx" ON "inventory_levels" USING btree ("sku_id","location_id","disposition");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_movements_idempotency_key_idx" ON "inventory_movements" USING btree ("idempotency_key");
  CREATE INDEX IF NOT EXISTS "inventory_movements_sku_idx" ON "inventory_movements" USING btree ("sku_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_kind_idx" ON "inventory_movements" USING btree ("kind");
  CREATE INDEX IF NOT EXISTS "inventory_movements_from_location_idx" ON "inventory_movements" USING btree ("from_location_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_from_disposition_idx" ON "inventory_movements" USING btree ("from_disposition");
  CREATE INDEX IF NOT EXISTS "inventory_movements_to_location_idx" ON "inventory_movements" USING btree ("to_location_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_to_disposition_idx" ON "inventory_movements" USING btree ("to_disposition");
  CREATE INDEX IF NOT EXISTS "inventory_movements_updated_at_idx" ON "inventory_movements" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_movements_created_at_idx" ON "inventory_movements" USING btree ("created_at");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_stock_locations_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_locations_fk" FOREIGN KEY ("stock_locations_id") REFERENCES "public"."stock_locations"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_inventory_levels_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_levels_fk" FOREIGN KEY ("inventory_levels_id") REFERENCES "public"."inventory_levels"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_stock_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("stock_locations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_levels_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_levels_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_stock_locations_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_levels_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_stock_locations_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_levels_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "stock_locations_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_levels_id";
  DO $$ BEGIN
    IF to_regclass('public.inventory_movements') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS "inventory_movements_prevent_row_mutation" ON "inventory_movements";
      DROP TRIGGER IF EXISTS "inventory_movements_prevent_truncate" ON "inventory_movements";
    END IF;
  END $$;
  DROP FUNCTION IF EXISTS "public"."prevent_inventory_movement_mutation"();
  ALTER TABLE IF EXISTS "stock_locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_levels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_movements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "inventory_movements" CASCADE;
  DROP TABLE IF EXISTS "inventory_levels" CASCADE;
  DROP TABLE IF EXISTS "stock_locations" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_inventory_levels_disposition";
  DROP TYPE IF EXISTS "public"."enum_inventory_movements_kind";
  DROP TYPE IF EXISTS "public"."enum_inventory_movements_from_disposition";
  DROP TYPE IF EXISTS "public"."enum_inventory_movements_to_disposition";
  DROP TYPE IF EXISTS "public"."enum_inventory_movements_source_type";`);
}
