import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_receipts_status" AS ENUM('draft', 'open', 'closed', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_cycle_counts_status" AS ENUM('draft', 'submitted', 'applied', 'rejected', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_cycle_count_lines_disposition" AS ENUM('available', 'quarantine', 'damaged', 'inspection_pending', 'returned_pending_release', 'discarded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TYPE "public"."enum_inventory_movements_source_type" ADD VALUE IF NOT EXISTS 'inventory_receipt';
  ALTER TYPE "public"."enum_inventory_movements_source_type" ADD VALUE IF NOT EXISTS 'inventory_lot_release';
  ALTER TYPE "public"."enum_inventory_movements_source_type" ADD VALUE IF NOT EXISTS 'inventory_adjustment';
  ALTER TYPE "public"."enum_inventory_movements_source_type" ADD VALUE IF NOT EXISTS 'inventory_cycle_count';
  CREATE TABLE IF NOT EXISTS "inventory_receipts" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"location_id" uuid NOT NULL,
  	"status" "enum_inventory_receipts_status" DEFAULT 'draft' NOT NULL,
  	"supplier_name" varchar,
  	"external_reference" varchar,
  	"opened_at" timestamp(3) with time zone,
  	"opened_by_id" uuid,
  	"closed_at" timestamp(3) with time zone,
  	"closed_by_id" uuid,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancelled_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_receipt_lines" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"receipt_sku_key" varchar NOT NULL,
  	"receipt_id" uuid NOT NULL,
  	"sku_id" uuid NOT NULL,
  	"expected_quantity" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_lots" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"operation_key" varchar NOT NULL,
  	"receipt_line_id" uuid NOT NULL,
  	"external_lot_code" varchar,
  	"received_quantity" numeric NOT NULL,
  	"received_at" timestamp(3) with time zone NOT NULL,
  	"actor_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_cycle_counts" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"location_id" uuid NOT NULL,
  	"status" "enum_inventory_cycle_counts_status" DEFAULT 'draft' NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"submitted_by_id" uuid,
  	"applied_at" timestamp(3) with time zone,
  	"applied_by_id" uuid,
  	"rejected_at" timestamp(3) with time zone,
  	"rejected_by_id" uuid,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancelled_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "inventory_cycle_count_lines" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"count_aggregate_key" varchar NOT NULL,
  	"count_id" uuid NOT NULL,
  	"sku_id" uuid NOT NULL,
  	"disposition" "enum_inventory_cycle_count_lines_disposition" NOT NULL,
  	"counted_quantity" numeric NOT NULL,
  	"system_quantity" numeric NOT NULL,
  	"movement_count_snapshot" numeric NOT NULL,
  	"variance" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  -- MIGRATION-SAFETY: Payload's generated table definitions above remain the
  -- schema authority. Re-entry after a partial CREATE mirrors every generated
  -- non-ID column exactly so subsequent constraints and indexes can self-repair.
  DO $$ DECLARE target text; definitions text[]; definition text; BEGIN
    FOR target, definitions IN SELECT * FROM (VALUES
      ('inventory_receipts', ARRAY['"location_id" uuid NOT NULL','"status" enum_inventory_receipts_status DEFAULT ''draft'' NOT NULL','"supplier_name" varchar','"external_reference" varchar','"opened_at" timestamp(3) with time zone','"opened_by_id" uuid','"closed_at" timestamp(3) with time zone','"closed_by_id" uuid','"cancelled_at" timestamp(3) with time zone','"cancelled_by_id" uuid','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL','"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL']),
      ('inventory_receipt_lines', ARRAY['"receipt_sku_key" varchar NOT NULL','"receipt_id" uuid NOT NULL','"sku_id" uuid NOT NULL','"expected_quantity" numeric','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL','"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL']),
      ('inventory_lots', ARRAY['"operation_key" varchar NOT NULL','"receipt_line_id" uuid NOT NULL','"external_lot_code" varchar','"received_quantity" numeric NOT NULL','"received_at" timestamp(3) with time zone NOT NULL','"actor_id" uuid NOT NULL','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL','"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL']),
      ('inventory_cycle_counts', ARRAY['"location_id" uuid NOT NULL','"status" enum_inventory_cycle_counts_status DEFAULT ''draft'' NOT NULL','"submitted_at" timestamp(3) with time zone','"submitted_by_id" uuid','"applied_at" timestamp(3) with time zone','"applied_by_id" uuid','"rejected_at" timestamp(3) with time zone','"rejected_by_id" uuid','"cancelled_at" timestamp(3) with time zone','"cancelled_by_id" uuid','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL','"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL']),
      ('inventory_cycle_count_lines', ARRAY['"count_aggregate_key" varchar NOT NULL','"count_id" uuid NOT NULL','"sku_id" uuid NOT NULL','"disposition" enum_inventory_cycle_count_lines_disposition NOT NULL','"counted_quantity" numeric NOT NULL','"system_quantity" numeric NOT NULL','"movement_count_snapshot" numeric NOT NULL','"variance" numeric NOT NULL','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL','"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL'])
    ) AS repairs(table_name, column_definitions) LOOP
      FOREACH definition IN ARRAY definitions LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %s', target, definition);
      END LOOP;
    END LOOP;
  END $$;
  
  -- WHY-OVERRIDE-PAYLOAD: migrate:create attempts to change the array-row ID
  -- below to UUID, but Payload 3.86 writes 24-character IDs at runtime and
  -- generate:db-schema correctly emits varchar. Keep the established shape.
  ALTER TABLE IF EXISTS "inventory_movements" ADD COLUMN IF NOT EXISTS "receipt_id" uuid;
  ALTER TABLE IF EXISTS "inventory_movements" ADD COLUMN IF NOT EXISTS "receipt_line_id" uuid;
  ALTER TABLE IF EXISTS "inventory_movements" ADD COLUMN IF NOT EXISTS "lot_id" uuid;
  ALTER TABLE IF EXISTS "inventory_movements" ADD COLUMN IF NOT EXISTS "cycle_count_id" uuid;
  ALTER TABLE IF EXISTS "inventory_movements" ADD COLUMN IF NOT EXISTS "cycle_count_line_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_receipts_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_receipt_lines_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_cycle_counts_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_cycle_count_lines_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipts_location_id_stock_locations_id_fk' AND conrelid = 'public.inventory_receipts'::regclass) THEN
      ALTER TABLE "inventory_receipts" ADD CONSTRAINT "inventory_receipts_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipts_opened_by_id_users_id_fk' AND conrelid = 'public.inventory_receipts'::regclass) THEN
      ALTER TABLE "inventory_receipts" ADD CONSTRAINT "inventory_receipts_opened_by_id_users_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipts_closed_by_id_users_id_fk' AND conrelid = 'public.inventory_receipts'::regclass) THEN
      ALTER TABLE "inventory_receipts" ADD CONSTRAINT "inventory_receipts_closed_by_id_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipts_cancelled_by_id_users_id_fk' AND conrelid = 'public.inventory_receipts'::regclass) THEN
      ALTER TABLE "inventory_receipts" ADD CONSTRAINT "inventory_receipts_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipt_lines_receipt_id_inventory_receipts_id_fk' AND conrelid = 'public.inventory_receipt_lines'::regclass) THEN
      ALTER TABLE "inventory_receipt_lines" ADD CONSTRAINT "inventory_receipt_lines_receipt_id_inventory_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."inventory_receipts"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipt_lines_sku_id_product_variants_id_fk' AND conrelid = 'public.inventory_receipt_lines'::regclass) THEN
      ALTER TABLE "inventory_receipt_lines" ADD CONSTRAINT "inventory_receipt_lines_sku_id_product_variants_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_lots_receipt_line_id_inventory_receipt_lines_id_fk' AND conrelid = 'public.inventory_lots'::regclass) THEN
      ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_receipt_line_id_inventory_receipt_lines_id_fk" FOREIGN KEY ("receipt_line_id") REFERENCES "public"."inventory_receipt_lines"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_lots_actor_id_users_id_fk' AND conrelid = 'public.inventory_lots'::regclass) THEN
      ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_location_id_stock_locations_id_fk' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_submitted_by_id_users_id_fk' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_applied_by_id_users_id_fk' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_applied_by_id_users_id_fk" FOREIGN KEY ("applied_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_rejected_by_id_users_id_fk' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_cancelled_by_id_users_id_fk' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_count_lines_count_id_inventory_cycle_counts_id_fk' AND conrelid = 'public.inventory_cycle_count_lines'::regclass) THEN
      ALTER TABLE "inventory_cycle_count_lines" ADD CONSTRAINT "inventory_cycle_count_lines_count_id_inventory_cycle_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_cycle_counts"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_count_lines_sku_id_product_variants_id_fk' AND conrelid = 'public.inventory_cycle_count_lines'::regclass) THEN
      ALTER TABLE "inventory_cycle_count_lines" ADD CONSTRAINT "inventory_cycle_count_lines_sku_id_product_variants_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Payload number fields cannot express safe-integer
  -- bounds, integral values, or a cross-field variance invariant.
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipt_lines_expected_quantity_check' AND conrelid = 'public.inventory_receipt_lines'::regclass) THEN
      ALTER TABLE "inventory_receipt_lines" ADD CONSTRAINT "inventory_receipt_lines_expected_quantity_check"
        CHECK (
          "expected_quantity" IS NULL OR (
            "expected_quantity" = trunc("expected_quantity")
            AND "expected_quantity" BETWEEN 1 AND 9007199254740991
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_lots_received_quantity_check' AND conrelid = 'public.inventory_lots'::regclass) THEN
      ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_received_quantity_check"
        CHECK (
          "received_quantity" = trunc("received_quantity")
          AND "received_quantity" BETWEEN 1 AND 9007199254740991
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_count_lines_quantities_check' AND conrelid = 'public.inventory_cycle_count_lines'::regclass) THEN
      ALTER TABLE "inventory_cycle_count_lines" ADD CONSTRAINT "inventory_cycle_count_lines_quantities_check"
        CHECK (
          "counted_quantity" = trunc("counted_quantity")
          AND "system_quantity" = trunc("system_quantity")
          AND "movement_count_snapshot" = trunc("movement_count_snapshot")
          AND "variance" = trunc("variance")
          AND "counted_quantity" BETWEEN 0 AND 9007199254740991
          AND "system_quantity" BETWEEN 0 AND 9007199254740991
          AND "movement_count_snapshot" BETWEEN 0 AND 9007199254740991
          AND "variance" BETWEEN -9007199254740991 AND 9007199254740991
          AND "variance" = "counted_quantity" - "system_quantity"
        );
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Payload field config cannot express lifecycle
  -- evidence consistency across status, timestamps, and actor relations.
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_receipts_lifecycle_evidence_check' AND conrelid = 'public.inventory_receipts'::regclass) THEN
      ALTER TABLE "inventory_receipts" ADD CONSTRAINT "inventory_receipts_lifecycle_evidence_check"
        CHECK (
          (
            "status" = 'draft'
            AND "opened_at" IS NULL AND "opened_by_id" IS NULL
            AND "closed_at" IS NULL AND "closed_by_id" IS NULL
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'open'
            AND "opened_at" IS NOT NULL AND "opened_by_id" IS NOT NULL
            AND "closed_at" IS NULL AND "closed_by_id" IS NULL
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'closed'
            AND "opened_at" IS NOT NULL AND "opened_by_id" IS NOT NULL
            AND "closed_at" IS NOT NULL AND "closed_by_id" IS NOT NULL
            AND "closed_at" >= "opened_at"
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'cancelled'
            AND "closed_at" IS NULL AND "closed_by_id" IS NULL
            AND "cancelled_at" IS NOT NULL AND "cancelled_by_id" IS NOT NULL
            AND (("opened_at" IS NULL AND "opened_by_id" IS NULL)
              OR ("opened_at" IS NOT NULL AND "opened_by_id" IS NOT NULL
                AND "cancelled_at" >= "opened_at"))
          )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_cycle_counts_lifecycle_evidence_check' AND conrelid = 'public.inventory_cycle_counts'::regclass) THEN
      ALTER TABLE "inventory_cycle_counts" ADD CONSTRAINT "inventory_cycle_counts_lifecycle_evidence_check"
        CHECK (
          (
            "status" = 'draft'
            AND "submitted_at" IS NULL AND "submitted_by_id" IS NULL
            AND "applied_at" IS NULL AND "applied_by_id" IS NULL
            AND "rejected_at" IS NULL AND "rejected_by_id" IS NULL
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'submitted'
            AND "submitted_at" IS NOT NULL AND "submitted_by_id" IS NOT NULL
            AND "applied_at" IS NULL AND "applied_by_id" IS NULL
            AND "rejected_at" IS NULL AND "rejected_by_id" IS NULL
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'applied'
            AND "submitted_at" IS NOT NULL AND "submitted_by_id" IS NOT NULL
            AND "applied_at" IS NOT NULL AND "applied_by_id" IS NOT NULL
            AND "applied_at" >= "submitted_at"
            AND "rejected_at" IS NULL AND "rejected_by_id" IS NULL
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'rejected'
            AND "submitted_at" IS NOT NULL AND "submitted_by_id" IS NOT NULL
            AND "applied_at" IS NULL AND "applied_by_id" IS NULL
            AND "rejected_at" IS NOT NULL AND "rejected_by_id" IS NOT NULL
            AND "rejected_at" >= "submitted_at"
            AND "cancelled_at" IS NULL AND "cancelled_by_id" IS NULL
          ) OR (
            "status" = 'cancelled'
            AND "applied_at" IS NULL AND "applied_by_id" IS NULL
            AND "rejected_at" IS NULL AND "rejected_by_id" IS NULL
            AND "cancelled_at" IS NOT NULL AND "cancelled_by_id" IS NOT NULL
            AND (("submitted_at" IS NULL AND "submitted_by_id" IS NULL)
              OR ("submitted_at" IS NOT NULL AND "submitted_by_id" IS NOT NULL
                AND "cancelled_at" >= "submitted_at"))
          )
        );
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Access rules and hooks do not protect immutable
  -- receipt/count evidence from direct SQL UPDATE, DELETE, or TRUNCATE.
  CREATE OR REPLACE FUNCTION "public"."prevent_inventory_operation_evidence_mutation"()
  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    RAISE EXCEPTION 'inventory operation evidence is immutable' USING ERRCODE = '55000';
  END $$;
  CREATE OR REPLACE FUNCTION "public"."protect_inventory_receipt_lifecycle"()
  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status <> 'draft'
        OR NEW.opened_at IS NOT NULL OR NEW.opened_by_id IS NOT NULL
        OR NEW.closed_at IS NOT NULL OR NEW.closed_by_id IS NOT NULL
        OR NEW.cancelled_at IS NOT NULL OR NEW.cancelled_by_id IS NOT NULL THEN
        RAISE EXCEPTION 'inventory receipts must start as draft without transition evidence' USING ERRCODE = '55000';
      END IF;
      RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'inventory receipt evidence cannot be deleted' USING ERRCODE = '55000';
    END IF;
    IF OLD.id IS DISTINCT FROM NEW.id
      OR OLD.location_id IS DISTINCT FROM NEW.location_id
      OR OLD.supplier_name IS DISTINCT FROM NEW.supplier_name
      OR OLD.external_reference IS DISTINCT FROM NEW.external_reference
      OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'inventory receipt identity is immutable' USING ERRCODE = '55000';
    END IF;
    IF (OLD.opened_at IS NOT NULL AND OLD.opened_at IS DISTINCT FROM NEW.opened_at)
      OR (OLD.opened_by_id IS NOT NULL AND OLD.opened_by_id IS DISTINCT FROM NEW.opened_by_id)
      OR (OLD.closed_at IS NOT NULL AND OLD.closed_at IS DISTINCT FROM NEW.closed_at)
      OR (OLD.closed_by_id IS NOT NULL AND OLD.closed_by_id IS DISTINCT FROM NEW.closed_by_id)
      OR (OLD.cancelled_at IS NOT NULL AND OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at)
      OR (OLD.cancelled_by_id IS NOT NULL AND OLD.cancelled_by_id IS DISTINCT FROM NEW.cancelled_by_id) THEN
      RAISE EXCEPTION 'inventory receipt transition evidence is immutable' USING ERRCODE = '55000';
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
      (OLD.status = 'draft' AND NEW.status IN ('open', 'cancelled'))
      OR (OLD.status = 'open' AND NEW.status IN ('closed', 'cancelled'))
    ) THEN
      RAISE EXCEPTION 'invalid inventory receipt transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.opened_at IS DISTINCT FROM NEW.opened_at
        OR OLD.opened_by_id IS DISTINCT FROM NEW.opened_by_id)
      AND NOT (OLD.status = 'draft' AND NEW.status = 'open') THEN
      RAISE EXCEPTION 'inventory receipt transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.closed_at IS DISTINCT FROM NEW.closed_at
        OR OLD.closed_by_id IS DISTINCT FROM NEW.closed_by_id)
      AND NOT (OLD.status = 'open' AND NEW.status = 'closed') THEN
      RAISE EXCEPTION 'inventory receipt transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at
        OR OLD.cancelled_by_id IS DISTINCT FROM NEW.cancelled_by_id)
      AND NOT (OLD.status IN ('draft', 'open') AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'inventory receipt transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF OLD.status = 'draft' AND NEW.status = 'cancelled'
      AND (NEW.opened_at IS NOT NULL OR NEW.opened_by_id IS NOT NULL) THEN
      RAISE EXCEPTION 'draft receipt cancellation cannot invent open evidence' USING ERRCODE = '55000';
    END IF;
    IF OLD.status = 'open' AND NEW.status = 'cancelled' AND (
      EXISTS (SELECT 1 FROM inventory_movements WHERE receipt_id = OLD.id)
      OR EXISTS (SELECT 1 FROM inventory_lots lot JOIN inventory_receipt_lines line
        ON line.id = lot.receipt_line_id WHERE line.receipt_id = OLD.id)
    ) THEN
      RAISE EXCEPTION 'inventory-receipt-cancel-has-receipts' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  END $$;
  CREATE OR REPLACE FUNCTION "public"."protect_inventory_cycle_count_lifecycle"()
  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status <> 'draft'
        OR NEW.submitted_at IS NOT NULL OR NEW.submitted_by_id IS NOT NULL
        OR NEW.applied_at IS NOT NULL OR NEW.applied_by_id IS NOT NULL
        OR NEW.rejected_at IS NOT NULL OR NEW.rejected_by_id IS NOT NULL
        OR NEW.cancelled_at IS NOT NULL OR NEW.cancelled_by_id IS NOT NULL THEN
        RAISE EXCEPTION 'inventory cycle counts must start as draft without transition evidence' USING ERRCODE = '55000';
      END IF;
      RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'inventory cycle count evidence cannot be deleted' USING ERRCODE = '55000';
    END IF;
    IF OLD.id IS DISTINCT FROM NEW.id
      OR OLD.location_id IS DISTINCT FROM NEW.location_id
      OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'inventory cycle count identity is immutable' USING ERRCODE = '55000';
    END IF;
    IF (OLD.submitted_at IS NOT NULL AND OLD.submitted_at IS DISTINCT FROM NEW.submitted_at)
      OR (OLD.submitted_by_id IS NOT NULL AND OLD.submitted_by_id IS DISTINCT FROM NEW.submitted_by_id)
      OR (OLD.applied_at IS NOT NULL AND OLD.applied_at IS DISTINCT FROM NEW.applied_at)
      OR (OLD.applied_by_id IS NOT NULL AND OLD.applied_by_id IS DISTINCT FROM NEW.applied_by_id)
      OR (OLD.rejected_at IS NOT NULL AND OLD.rejected_at IS DISTINCT FROM NEW.rejected_at)
      OR (OLD.rejected_by_id IS NOT NULL AND OLD.rejected_by_id IS DISTINCT FROM NEW.rejected_by_id)
      OR (OLD.cancelled_at IS NOT NULL AND OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at)
      OR (OLD.cancelled_by_id IS NOT NULL AND OLD.cancelled_by_id IS DISTINCT FROM NEW.cancelled_by_id) THEN
      RAISE EXCEPTION 'inventory cycle count transition evidence is immutable' USING ERRCODE = '55000';
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
      (OLD.status = 'draft' AND NEW.status IN ('submitted', 'cancelled'))
      OR (OLD.status = 'submitted' AND NEW.status IN ('applied', 'rejected'))
    ) THEN
      RAISE EXCEPTION 'invalid inventory cycle count transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.submitted_at IS DISTINCT FROM NEW.submitted_at
        OR OLD.submitted_by_id IS DISTINCT FROM NEW.submitted_by_id)
      AND NOT (OLD.status = 'draft' AND NEW.status = 'submitted') THEN
      RAISE EXCEPTION 'inventory cycle count transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.applied_at IS DISTINCT FROM NEW.applied_at
        OR OLD.applied_by_id IS DISTINCT FROM NEW.applied_by_id)
      AND NOT (OLD.status = 'submitted' AND NEW.status = 'applied') THEN
      RAISE EXCEPTION 'inventory cycle count transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.rejected_at IS DISTINCT FROM NEW.rejected_at
        OR OLD.rejected_by_id IS DISTINCT FROM NEW.rejected_by_id)
      AND NOT (OLD.status = 'submitted' AND NEW.status = 'rejected') THEN
      RAISE EXCEPTION 'inventory cycle count transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF (OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at
        OR OLD.cancelled_by_id IS DISTINCT FROM NEW.cancelled_by_id)
      AND NOT (OLD.status = 'draft' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'inventory cycle count transition evidence requires its status transition' USING ERRCODE = '55000';
    END IF;
    IF OLD.status = 'submitted' AND NEW.status = 'rejected'
      AND EXISTS (
        SELECT 1 FROM inventory_movements movement
        WHERE movement.cycle_count_id = OLD.id
          AND movement.source_type::text = 'inventory_cycle_count'
      ) THEN
      RAISE EXCEPTION 'cycle count movement evidence requires application' USING ERRCODE = '55000';
    END IF;
    IF OLD.status = 'submitted' AND NEW.status = 'applied' THEN
      IF NOT EXISTS (
        SELECT 1 FROM inventory_cycle_count_lines WHERE count_id = OLD.id
      ) THEN
        RAISE EXCEPTION 'cycle count requires at least one line' USING ERRCODE = '55000';
      END IF;
      IF EXISTS (
        SELECT 1 FROM inventory_cycle_count_lines line
        WHERE line.count_id = OLD.id AND line.variance > 0
      ) AND NEW.applied_by_id = OLD.submitted_by_id THEN
        RAISE EXCEPTION 'positive variance requires a different checker' USING ERRCODE = '55000';
      END IF;
      IF EXISTS (
        SELECT 1
        FROM inventory_cycle_count_lines line
        WHERE line.count_id = OLD.id
          AND (
            (line.variance = 0 AND EXISTS (
              SELECT 1 FROM inventory_movements movement
              WHERE movement.cycle_count_line_id = line.id
                AND movement.source_type::text = 'inventory_cycle_count'
            ))
            OR (line.variance <> 0 AND (
              SELECT count(*) FROM inventory_movements movement
              WHERE movement.cycle_count_id = OLD.id
                AND movement.cycle_count_line_id = line.id
                AND movement.source_type::text = 'inventory_cycle_count'
                AND movement.sku_id = line.sku_id
                AND movement.quantity = abs(line.variance)
                AND movement.actor = NEW.applied_by_id::text
                AND movement.effective_at = NEW.applied_at
                AND (
                  (line.variance > 0
                    AND movement.kind = 'inbound'
                    AND movement.to_location_id = OLD.location_id
                    AND movement.to_disposition::text = line.disposition::text)
                  OR (line.variance < 0
                    AND movement.kind = 'outbound'
                    AND movement.from_location_id = OLD.location_id
                    AND movement.from_disposition::text = line.disposition::text)
                )
            ) <> 1)
          )
      ) THEN
        RAISE EXCEPTION 'cycle count movement evidence mismatch' USING ERRCODE = '55000';
      END IF;
    END IF;
    IF OLD.status = 'draft' AND NEW.status = 'cancelled'
      AND (NEW.submitted_at IS NOT NULL OR NEW.submitted_by_id IS NOT NULL) THEN
      RAISE EXCEPTION 'draft count cancellation cannot invent submit evidence' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  END $$;
  CREATE OR REPLACE FUNCTION "public"."validate_inventory_evidence_insert"()
  RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE parent_status text; BEGIN
    IF TG_TABLE_NAME = 'inventory_receipt_lines' THEN
      SELECT status::text INTO parent_status FROM inventory_receipts
      WHERE id = NEW.receipt_id FOR UPDATE;
      IF parent_status IS DISTINCT FROM 'draft' THEN
        RAISE EXCEPTION 'receipt lines require a draft receipt' USING ERRCODE = '23514';
      END IF;
    ELSIF TG_TABLE_NAME = 'inventory_lots' THEN
      SELECT receipt.status::text INTO parent_status FROM inventory_receipts receipt
      JOIN inventory_receipt_lines line ON line.receipt_id = receipt.id
      WHERE line.id = NEW.receipt_line_id FOR UPDATE OF receipt, line;
      IF parent_status IS DISTINCT FROM 'open' THEN
        RAISE EXCEPTION 'inventory lots require an open receipt' USING ERRCODE = '23514';
      END IF;
    ELSE
      SELECT status::text INTO parent_status FROM inventory_cycle_counts
      WHERE id = NEW.count_id FOR UPDATE;
      IF parent_status IS DISTINCT FROM 'draft' THEN
        RAISE EXCEPTION 'count lines require a draft count' USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END $$;
  DO $$ DECLARE target text; BEGIN
    FOREACH target IN ARRAY ARRAY['inventory_receipt_lines','inventory_lots','inventory_cycle_count_lines'] LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', target || '_prevent_row_mutation', target);
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.prevent_inventory_operation_evidence_mutation()', target || '_prevent_row_mutation', target);
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', target || '_prevent_truncate', target);
      EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_inventory_operation_evidence_mutation()', target || '_prevent_truncate', target);
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', target || '_validate_insert', target);
      EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_evidence_insert()', target || '_validate_insert', target);
    END LOOP;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_receipts_protect_lifecycle" ON "inventory_receipts";
  CREATE TRIGGER "inventory_receipts_protect_lifecycle" BEFORE INSERT OR UPDATE OR DELETE ON "inventory_receipts" FOR EACH ROW EXECUTE FUNCTION "public"."protect_inventory_receipt_lifecycle"();
  DROP TRIGGER IF EXISTS "inventory_receipts_prevent_truncate" ON "inventory_receipts";
  CREATE TRIGGER "inventory_receipts_prevent_truncate" BEFORE TRUNCATE ON "inventory_receipts" FOR EACH STATEMENT EXECUTE FUNCTION "public"."prevent_inventory_operation_evidence_mutation"();
  DROP TRIGGER IF EXISTS "inventory_cycle_counts_protect_lifecycle" ON "inventory_cycle_counts";
  CREATE TRIGGER "inventory_cycle_counts_protect_lifecycle" BEFORE INSERT OR UPDATE OR DELETE ON "inventory_cycle_counts" FOR EACH ROW EXECUTE FUNCTION "public"."protect_inventory_cycle_count_lifecycle"();
  DROP TRIGGER IF EXISTS "inventory_cycle_counts_prevent_truncate" ON "inventory_cycle_counts";
  CREATE TRIGGER "inventory_cycle_counts_prevent_truncate" BEFORE TRUNCATE ON "inventory_cycle_counts" FOR EACH STATEMENT EXECUTE FUNCTION "public"."prevent_inventory_operation_evidence_mutation"();
  -- WHY-OVERRIDE-PAYLOAD: Payload cannot express a deferred cross-table
  -- invariant. A cycle-count movement and the parent applied transition must
  -- commit atomically, so no submitted/rejected/cancelled parent can retain it.
  CREATE OR REPLACE FUNCTION "public"."require_applied_cycle_count_movement_parent"()
  RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE
    parent_status text;
    parent_actor uuid;
    parent_effective_at timestamp with time zone;
  BEGIN
    SELECT status::text, applied_by_id, applied_at
    INTO parent_status, parent_actor, parent_effective_at
    FROM inventory_cycle_counts
    WHERE id = NEW.cycle_count_id;
    IF parent_status IS DISTINCT FROM 'applied' THEN
      RAISE EXCEPTION 'cycle count movement parent must be applied' USING ERRCODE = '23514';
    END IF;
    IF NEW.actor IS DISTINCT FROM parent_actor::text
      OR NEW.effective_at IS DISTINCT FROM parent_effective_at THEN
      RAISE EXCEPTION 'cycle count movement audit evidence mismatch' USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_movements_require_applied_cycle_count" ON "inventory_movements";
  CREATE CONSTRAINT TRIGGER "inventory_movements_require_applied_cycle_count"
    AFTER INSERT ON "inventory_movements"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (NEW.cycle_count_line_id IS NOT NULL)
    EXECUTE FUNCTION "public"."require_applied_cycle_count_movement_parent"();
  -- WHY-OVERRIDE-PAYLOAD: Receipt creation writes the immutable lot before its
  -- inbound movement in one transaction. A deferred constraint preserves that
  -- order while preventing an orphan lot from committing.
  CREATE OR REPLACE FUNCTION "public"."require_inventory_lot_receipt_movement"()
  RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE movement_count bigint; BEGIN
    SELECT count(*) INTO movement_count
    FROM inventory_movements movement
    WHERE movement.source_type::text = 'inventory_receipt'
      AND movement.lot_id = NEW.id
      AND movement.receipt_line_id = NEW.receipt_line_id
      AND movement.quantity = NEW.received_quantity
      AND movement.actor = NEW.actor_id::text
      AND movement.effective_at = NEW.received_at;
    IF movement_count <> 1 THEN
      RAISE EXCEPTION 'inventory lot requires exactly one receipt movement' USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_lots_require_receipt_movement" ON "inventory_lots";
  CREATE CONSTRAINT TRIGGER "inventory_lots_require_receipt_movement"
    AFTER INSERT ON "inventory_lots"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION "public"."require_inventory_lot_receipt_movement"();
  -- WHY-OVERRIDE-PAYLOAD: Foreign keys prove that referenced rows exist, but
  -- cannot prove that receipt, lot, count, SKU, location, and quantity evidence
  -- belongs to one coherent inventory operation.
  CREATE OR REPLACE FUNCTION "public"."validate_inventory_movement_provenance"()
  RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE
    evidence_location uuid;
    evidence_sku uuid;
    evidence_quantity numeric;
    evidence_disposition text;
    evidence_variance numeric;
    evidence_status text;
    evidence_actor uuid;
    evidence_effective_at timestamp with time zone;
    released_quantity numeric;
  BEGIN
    IF NEW.source_type::text IN (
      'inventory_receipt', 'inventory_lot_release',
      'inventory_adjustment', 'inventory_cycle_count'
    ) AND (NEW.actor IS NULL OR NEW.effective_at IS NULL) THEN
      RAISE EXCEPTION 'inventory workflow movement requires actor and effective timestamp' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product_variants sku
      WHERE sku.id = NEW.sku_id AND sku.identity_locked = true) THEN
      RAISE EXCEPTION 'inventory movement SKU identity is unlocked' USING ERRCODE = '23514';
    END IF;
    IF NEW.kind = 'inbound' AND NOT EXISTS (
      SELECT 1 FROM product_variants sku
      WHERE sku.id = NEW.sku_id AND sku.active = true
    ) THEN
      RAISE EXCEPTION 'inventory movement SKU is inactive' USING ERRCODE = '23514';
    END IF;
    IF NEW.to_location_id IS NOT NULL
      AND (NEW.kind = 'inbound' OR (NEW.kind = 'transfer'
        AND NEW.from_location_id IS DISTINCT FROM NEW.to_location_id))
      AND NOT EXISTS (
      SELECT 1 FROM stock_locations location
      WHERE location.id = NEW.to_location_id AND location.active = true
    ) THEN
      RAISE EXCEPTION 'inventory destination location is inactive' USING ERRCODE = '23514';
    END IF;
    IF NEW.source_type::text = 'inventory_command' AND NEW.kind = 'inbound' THEN
      RAISE EXCEPTION 'inventory command inbound is forbidden' USING ERRCODE = '23514';
    END IF;
    IF NEW.source_type::text <> 'inventory_lot_release'
      AND NEW.kind = 'transfer'
      AND NEW.from_disposition::text = 'quarantine'
      AND NEW.to_disposition::text = 'available' THEN
      RAISE EXCEPTION 'quarantine release requires lot evidence' USING ERRCODE = '23514';
    END IF;
    IF NEW.source_type::text IN ('inventory_receipt', 'inventory_lot_release') THEN
      SELECT receipt.location_id, line.sku_id, lot.received_quantity,
        receipt.status::text, lot.actor_id, lot.received_at
      INTO evidence_location, evidence_sku, evidence_quantity, evidence_status,
        evidence_actor, evidence_effective_at
      FROM inventory_receipts receipt
      JOIN inventory_receipt_lines line
        ON line.receipt_id = receipt.id AND line.id = NEW.receipt_line_id
      JOIN inventory_lots lot
        ON lot.receipt_line_id = line.id AND lot.id = NEW.lot_id
      WHERE receipt.id = NEW.receipt_id
      FOR UPDATE OF receipt, line, lot;
      IF NOT FOUND
        OR evidence_sku IS DISTINCT FROM NEW.sku_id
        OR evidence_location IS DISTINCT FROM NEW.to_location_id
        OR NEW.source_ref IS DISTINCT FROM NEW.lot_id::text THEN
        RAISE EXCEPTION 'receipt provenance chain mismatch' USING ERRCODE = '23514';
      END IF;
      IF NEW.source_type::text = 'inventory_receipt' AND (
        evidence_status <> 'open'
        OR evidence_quantity IS DISTINCT FROM NEW.quantity
        OR NEW.actor IS DISTINCT FROM evidence_actor::text
        OR NEW.effective_at IS DISTINCT FROM evidence_effective_at
        OR EXISTS (
          SELECT 1 FROM inventory_movements movement
          WHERE movement.lot_id = NEW.lot_id
            AND movement.source_type::text = 'inventory_receipt'
        )
      ) THEN
        RAISE EXCEPTION 'receipt provenance chain mismatch' USING ERRCODE = '23514';
      END IF;
      IF NEW.source_type::text = 'inventory_lot_release' THEN
        SELECT count(*) INTO released_quantity FROM inventory_movements movement
        WHERE movement.source_type::text = 'inventory_receipt'
          AND movement.receipt_id = NEW.receipt_id
          AND movement.receipt_line_id = NEW.receipt_line_id
          AND movement.lot_id = NEW.lot_id AND movement.sku_id = NEW.sku_id
          AND movement.quantity = evidence_quantity
          AND movement.to_location_id = evidence_location
          AND movement.to_disposition::text = 'quarantine';
        IF released_quantity <> 1 THEN
          RAISE EXCEPTION 'lot release requires receipt evidence' USING ERRCODE = '23514';
        END IF;
        SELECT COALESCE(sum(movement.quantity), 0)
        INTO released_quantity
        FROM inventory_movements movement
        WHERE movement.lot_id = NEW.lot_id
          AND movement.source_type::text = 'inventory_lot_release';
        IF released_quantity + NEW.quantity > evidence_quantity THEN
          RAISE EXCEPTION 'lot release exceeds received quantity' USING ERRCODE = '23514';
        END IF;
      END IF;
    END IF;
    IF NEW.source_type::text = 'inventory_cycle_count' THEN
      SELECT count_doc.location_id, line.sku_id, line.disposition::text,
        line.variance, count_doc.status::text
      INTO evidence_location, evidence_sku, evidence_disposition,
        evidence_variance, evidence_status
      FROM inventory_cycle_counts count_doc
      JOIN inventory_cycle_count_lines line
        ON line.count_id = count_doc.id AND line.id = NEW.cycle_count_line_id
      WHERE count_doc.id = NEW.cycle_count_id
      FOR UPDATE OF count_doc, line;
      IF NOT FOUND
        OR evidence_status <> 'submitted'
        OR evidence_sku IS DISTINCT FROM NEW.sku_id
        OR NEW.source_ref IS DISTINCT FROM NEW.cycle_count_line_id::text
        OR abs(evidence_variance) IS DISTINCT FROM NEW.quantity
        OR NOT (
          (evidence_variance > 0
            AND NEW.kind = 'inbound'
            AND NEW.to_location_id = evidence_location
            AND NEW.to_disposition::text = evidence_disposition)
          OR (evidence_variance < 0
            AND NEW.kind = 'outbound'
            AND NEW.from_location_id = evidence_location
            AND NEW.from_disposition::text = evidence_disposition)
        ) THEN
        RAISE EXCEPTION 'cycle count provenance chain mismatch' USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_movements_validate_pr5_provenance" ON "inventory_movements";
  CREATE TRIGGER "inventory_movements_validate_pr5_provenance"
    BEFORE INSERT ON "inventory_movements"
    FOR EACH ROW EXECUTE FUNCTION "public"."validate_inventory_movement_provenance"();
  CREATE INDEX IF NOT EXISTS "inventory_receipts_location_idx" ON "inventory_receipts" USING btree ("location_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_status_idx" ON "inventory_receipts" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_external_reference_idx" ON "inventory_receipts" USING btree ("external_reference");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_opened_at_idx" ON "inventory_receipts" USING btree ("opened_at");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_opened_by_idx" ON "inventory_receipts" USING btree ("opened_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_closed_at_idx" ON "inventory_receipts" USING btree ("closed_at");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_closed_by_idx" ON "inventory_receipts" USING btree ("closed_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_cancelled_at_idx" ON "inventory_receipts" USING btree ("cancelled_at");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_cancelled_by_idx" ON "inventory_receipts" USING btree ("cancelled_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_updated_at_idx" ON "inventory_receipts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_receipts_created_at_idx" ON "inventory_receipts" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_receipt_lines_receipt_sku_key_idx" ON "inventory_receipt_lines" USING btree ("receipt_sku_key");
  CREATE INDEX IF NOT EXISTS "inventory_receipt_lines_receipt_idx" ON "inventory_receipt_lines" USING btree ("receipt_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipt_lines_sku_idx" ON "inventory_receipt_lines" USING btree ("sku_id");
  CREATE INDEX IF NOT EXISTS "inventory_receipt_lines_updated_at_idx" ON "inventory_receipt_lines" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_receipt_lines_created_at_idx" ON "inventory_receipt_lines" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "receipt_sku_idx" ON "inventory_receipt_lines" USING btree ("receipt_id","sku_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_lots_operation_key_idx" ON "inventory_lots" USING btree ("operation_key");
  CREATE INDEX IF NOT EXISTS "inventory_lots_receipt_line_idx" ON "inventory_lots" USING btree ("receipt_line_id");
  CREATE INDEX IF NOT EXISTS "inventory_lots_external_lot_code_idx" ON "inventory_lots" USING btree ("external_lot_code");
  CREATE INDEX IF NOT EXISTS "inventory_lots_received_at_idx" ON "inventory_lots" USING btree ("received_at");
  CREATE INDEX IF NOT EXISTS "inventory_lots_actor_idx" ON "inventory_lots" USING btree ("actor_id");
  CREATE INDEX IF NOT EXISTS "inventory_lots_updated_at_idx" ON "inventory_lots" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_lots_created_at_idx" ON "inventory_lots" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_location_idx" ON "inventory_cycle_counts" USING btree ("location_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_status_idx" ON "inventory_cycle_counts" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_submitted_at_idx" ON "inventory_cycle_counts" USING btree ("submitted_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_submitted_by_idx" ON "inventory_cycle_counts" USING btree ("submitted_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_applied_at_idx" ON "inventory_cycle_counts" USING btree ("applied_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_applied_by_idx" ON "inventory_cycle_counts" USING btree ("applied_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_rejected_at_idx" ON "inventory_cycle_counts" USING btree ("rejected_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_rejected_by_idx" ON "inventory_cycle_counts" USING btree ("rejected_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_cancelled_at_idx" ON "inventory_cycle_counts" USING btree ("cancelled_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_cancelled_by_idx" ON "inventory_cycle_counts" USING btree ("cancelled_by_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_updated_at_idx" ON "inventory_cycle_counts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_counts_created_at_idx" ON "inventory_cycle_counts" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_cycle_count_lines_count_aggregate_key_idx" ON "inventory_cycle_count_lines" USING btree ("count_aggregate_key");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_count_lines_count_idx" ON "inventory_cycle_count_lines" USING btree ("count_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_count_lines_sku_idx" ON "inventory_cycle_count_lines" USING btree ("sku_id");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_count_lines_disposition_idx" ON "inventory_cycle_count_lines" USING btree ("disposition");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_count_lines_updated_at_idx" ON "inventory_cycle_count_lines" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_cycle_count_lines_created_at_idx" ON "inventory_cycle_count_lines" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "count_sku_disposition_idx" ON "inventory_cycle_count_lines" USING btree ("count_id","sku_id","disposition");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_receipt_id_inventory_receipts_id_fk' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_receipt_id_inventory_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."inventory_receipts"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_receipt_line_id_inventory_receipt_lines_id_fk' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_receipt_line_id_inventory_receipt_lines_id_fk" FOREIGN KEY ("receipt_line_id") REFERENCES "public"."inventory_receipt_lines"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_lot_id_inventory_lots_id_fk' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_lot_id_inventory_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."inventory_lots"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_cycle_count_id_inventory_cycle_counts_id_fk' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_cycle_count_id_inventory_cycle_counts_id_fk" FOREIGN KEY ("cycle_count_id") REFERENCES "public"."inventory_cycle_counts"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_cycle_count_line_id_inventory_cycle_count_lines_id_fk' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_cycle_count_line_id_inventory_cycle_count_lines_id_fk" FOREIGN KEY ("cycle_count_line_id") REFERENCES "public"."inventory_cycle_count_lines"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_inventory_receipts_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_receipts_fk" FOREIGN KEY ("inventory_receipts_id") REFERENCES "public"."inventory_receipts"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_inventory_receipt_lines_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_receipt_lines_fk" FOREIGN KEY ("inventory_receipt_lines_id") REFERENCES "public"."inventory_receipt_lines"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_inventory_cycle_counts_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_cycle_counts_fk" FOREIGN KEY ("inventory_cycle_counts_id") REFERENCES "public"."inventory_cycle_counts"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_inventory_cycle_count_lines_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_cycle_count_lines_fk" FOREIGN KEY ("inventory_cycle_count_lines_id") REFERENCES "public"."inventory_cycle_count_lines"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  -- WHY-OVERRIDE-PAYLOAD: Relationship fields cannot express conditional
  -- requiredness or forbid cross-family provenance for direct SQL inserts.
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_provenance_shape_check' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_provenance_shape_check"
        CHECK (
          (
            "source_type"::text = 'inventory_command'
            AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
            AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
          ) OR (
            "source_type"::text = 'inventory_adjustment'
            AND "kind" IN ('outbound', 'transfer')
            AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
            AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
          ) OR (
            "source_type"::text = 'inventory_receipt'
            AND "kind" = 'inbound'
            AND "from_location_id" IS NULL AND "from_disposition" IS NULL
            AND "to_location_id" IS NOT NULL AND "to_disposition" = 'quarantine'
            AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL
            AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
          ) OR (
            "source_type"::text = 'inventory_lot_release'
            AND "kind" = 'transfer'
            AND "from_location_id" = "to_location_id"
            AND "from_disposition" = 'quarantine' AND "to_disposition" = 'available'
            AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL
            AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
          ) OR (
            "source_type"::text = 'inventory_cycle_count'
            AND "kind" IN ('inbound', 'outbound')
            AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
            AND "cycle_count_id" IS NOT NULL AND "cycle_count_line_id" IS NOT NULL
          )
        );
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "inventory_movements_receipt_idx" ON "inventory_movements" USING btree ("receipt_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_receipt_line_idx" ON "inventory_movements" USING btree ("receipt_line_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_lot_idx" ON "inventory_movements" USING btree ("lot_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_cycle_count_idx" ON "inventory_movements" USING btree ("cycle_count_id");
  CREATE INDEX IF NOT EXISTS "inventory_movements_cycle_count_line_idx" ON "inventory_movements" USING btree ("cycle_count_line_id");
  -- WHY-OVERRIDE-PAYLOAD: Payload relationship fields cannot make a nullable
  -- relation unique only when evidence exists. One count line produces at most
  -- one immutable movement, including under concurrent/retried application.
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_movements_cycle_count_line_once_idx"
    ON "inventory_movements" USING btree ("cycle_count_line_id")
    WHERE "cycle_count_line_id" IS NOT NULL;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_receipts_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_receipts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_receipt_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_receipt_lines_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_cycle_counts_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_cycle_counts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_cycle_count_line_idx" ON "payload_locked_documents_rels" USING btree ("inventory_cycle_count_lines_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- WHY-OVERRIDE-PAYLOAD: The rollback evidence scan and destructive DDL must
  -- share one write barrier. Fixed-order SHARE locks prevent a concurrent
  -- insert from committing after its table was scanned but before it is dropped.
  DO $$ DECLARE
    evidence boolean := false;
    inventory_claim boolean := false;
    target text;
  BEGIN
    FOREACH target IN ARRAY ARRAY['commerce_commands', 'inventory_receipts',
      'inventory_receipt_lines', 'inventory_lots', 'inventory_movements',
      'inventory_cycle_counts', 'inventory_cycle_count_lines'] LOOP
      IF to_regclass('public.' || target) IS NOT NULL THEN
        EXECUTE format('LOCK TABLE public.%I IN SHARE MODE', target);
      END IF;
    END LOOP;
    IF to_regclass('public.commerce_commands') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM commerce_commands
        WHERE status::text = ''in_progress''
          AND business_key LIKE ''inventory:%''
          AND (lease_expires_at IS NULL OR lease_expires_at > now()))'
        INTO inventory_claim;
    END IF;
    IF inventory_claim THEN
      RAISE EXCEPTION 'PR5 inventory command is in progress; refusing rollback' USING ERRCODE = '55000';
    END IF;
    FOREACH target IN ARRAY ARRAY['inventory_receipts', 'inventory_receipt_lines',
      'inventory_lots', 'inventory_cycle_counts', 'inventory_cycle_count_lines'] LOOP
      IF to_regclass('public.' || target) IS NOT NULL THEN
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I)', target) INTO evidence;
        EXIT WHEN evidence;
      END IF;
    END LOOP;
    IF NOT evidence AND to_regclass('public.inventory_movements') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_movements
        WHERE source_type::text <> ''inventory_command'')' INTO evidence;
    END IF;
    IF evidence THEN
      RAISE EXCEPTION 'PR5 inventory evidence exists; refusing rollback' USING ERRCODE = '55000';
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.inventory_lots') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS "inventory_lots_require_receipt_movement" ON "inventory_lots";
    END IF;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_movements_validate_pr5_provenance" ON "inventory_movements";
  DROP TRIGGER IF EXISTS "inventory_movements_require_applied_cycle_count" ON "inventory_movements";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_receipt_id_inventory_receipts_id_fk";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_receipt_line_id_inventory_receipt_lines_id_fk";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_lot_id_inventory_lots_id_fk";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_cycle_count_id_inventory_cycle_counts_id_fk";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_cycle_count_line_id_inventory_cycle_count_lines_id_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_receipts_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_receipt_lines_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_cycle_counts_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_cycle_count_lines_fk";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_provenance_shape_check";

  DROP INDEX IF EXISTS "inventory_movements_receipt_idx";
  DROP INDEX IF EXISTS "inventory_movements_receipt_line_idx";
  DROP INDEX IF EXISTS "inventory_movements_lot_idx";
  DROP INDEX IF EXISTS "inventory_movements_cycle_count_idx";
  DROP INDEX IF EXISTS "inventory_movements_cycle_count_line_idx";
  DROP INDEX IF EXISTS "inventory_movements_cycle_count_line_once_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_receipts_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_receipt_lines_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_cycle_counts_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_cycle_count_line_idx";

  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'inventory_movements'
        AND column_name = 'source_type'
        AND udt_name = 'enum_inventory_movements_source_type'
    ) THEN
      ALTER TABLE "inventory_movements"
        ALTER COLUMN "source_type" SET DATA TYPE text
        USING "source_type"::text;
    END IF;
  END $$;
  DROP TYPE IF EXISTS "public"."enum_inventory_movements_source_type";
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_movements_source_type" AS ENUM('inventory_command');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'inventory_movements'
        AND column_name = 'source_type'
        AND data_type = 'text'
    ) THEN
      ALTER TABLE "inventory_movements"
        ALTER COLUMN "source_type" SET DATA TYPE "public"."enum_inventory_movements_source_type"
        USING "source_type"::"public"."enum_inventory_movements_source_type";
    END IF;
  END $$;

  ALTER TABLE IF EXISTS "inventory_movements" DROP COLUMN IF EXISTS "receipt_id";
  ALTER TABLE IF EXISTS "inventory_movements" DROP COLUMN IF EXISTS "receipt_line_id";
  ALTER TABLE IF EXISTS "inventory_movements" DROP COLUMN IF EXISTS "lot_id";
  ALTER TABLE IF EXISTS "inventory_movements" DROP COLUMN IF EXISTS "cycle_count_id";
  ALTER TABLE IF EXISTS "inventory_movements" DROP COLUMN IF EXISTS "cycle_count_line_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_receipts_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_receipt_lines_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_cycle_counts_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_cycle_count_lines_id";

  ALTER TABLE IF EXISTS "inventory_cycle_count_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_cycle_counts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_lots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_receipt_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_receipts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "inventory_cycle_count_lines" CASCADE;
  DROP TABLE IF EXISTS "inventory_cycle_counts" CASCADE;
  DROP TABLE IF EXISTS "inventory_lots" CASCADE;
  DROP TABLE IF EXISTS "inventory_receipt_lines" CASCADE;
  DROP TABLE IF EXISTS "inventory_receipts" CASCADE;
  DROP FUNCTION IF EXISTS "public"."prevent_inventory_operation_evidence_mutation"();
  DROP FUNCTION IF EXISTS "public"."protect_inventory_receipt_lifecycle"();
  DROP FUNCTION IF EXISTS "public"."protect_inventory_cycle_count_lifecycle"();
  DROP FUNCTION IF EXISTS "public"."validate_inventory_evidence_insert"();
  DROP FUNCTION IF EXISTS "public"."validate_inventory_movement_provenance"();
  DROP FUNCTION IF EXISTS "public"."require_applied_cycle_count_movement_parent"();
  DROP FUNCTION IF EXISTS "public"."require_inventory_lot_receipt_movement"();
  DROP TYPE IF EXISTS "public"."enum_inventory_receipts_status";
  DROP TYPE IF EXISTS "public"."enum_inventory_cycle_counts_status";
  DROP TYPE IF EXISTS "public"."enum_inventory_cycle_count_lines_disposition";`);
}
