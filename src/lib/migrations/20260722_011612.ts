import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_status" AS ENUM('active', 'consumed', 'released', 'expired');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_consume_point" AS ENUM('payment_confirmed');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_expiry_boundary" AS ENUM('at_or_after');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_payment_time_source" AS ENUM('provider_paid_at');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_late_payment_policy" AS ENUM('manual_review');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservations_backorder_mode" AS ENUM('disabled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservation_entries_operation" AS ENUM('reserve', 'consume', 'release', 'expire', 'late_payment_detected');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_inventory_reservation_entries_evidence_code" AS ENUM('provider_timestamp_missing', 'provider_timestamp_before_reservation', 'provider_payment_late', 'physical_inventory_unavailable');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TYPE "public"."enum_inventory_reservations_status" ADD VALUE IF NOT EXISTS 'active';
  ALTER TYPE "public"."enum_inventory_reservations_status" ADD VALUE IF NOT EXISTS 'consumed';
  ALTER TYPE "public"."enum_inventory_reservations_status" ADD VALUE IF NOT EXISTS 'released';
  ALTER TYPE "public"."enum_inventory_reservations_status" ADD VALUE IF NOT EXISTS 'expired';
  ALTER TYPE "public"."enum_inventory_reservations_consume_point" ADD VALUE IF NOT EXISTS 'payment_confirmed';
  ALTER TYPE "public"."enum_inventory_reservations_expiry_boundary" ADD VALUE IF NOT EXISTS 'at_or_after';
  ALTER TYPE "public"."enum_inventory_reservations_payment_time_source" ADD VALUE IF NOT EXISTS 'provider_paid_at';
  ALTER TYPE "public"."enum_inventory_reservations_late_payment_policy" ADD VALUE IF NOT EXISTS 'manual_review';
  ALTER TYPE "public"."enum_inventory_reservations_backorder_mode" ADD VALUE IF NOT EXISTS 'disabled';
  ALTER TYPE "public"."enum_inventory_reservation_entries_operation" ADD VALUE IF NOT EXISTS 'reserve';
  ALTER TYPE "public"."enum_inventory_reservation_entries_operation" ADD VALUE IF NOT EXISTS 'consume';
  ALTER TYPE "public"."enum_inventory_reservation_entries_operation" ADD VALUE IF NOT EXISTS 'release';
  ALTER TYPE "public"."enum_inventory_reservation_entries_operation" ADD VALUE IF NOT EXISTS 'expire';
  ALTER TYPE "public"."enum_inventory_reservation_entries_operation" ADD VALUE IF NOT EXISTS 'late_payment_detected';
  ALTER TYPE "public"."enum_inventory_reservation_entries_evidence_code" ADD VALUE IF NOT EXISTS 'provider_timestamp_missing';
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_inventory_reservation_entries_evidence_code'
        AND e.enumlabel = 'provider_timestamp_before_reservation'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_inventory_reservation_entries_evidence_code'
          AND e.enumlabel = 'provider_payment_late'
      ) THEN
        ALTER TYPE "public"."enum_inventory_reservation_entries_evidence_code"
          ADD VALUE 'provider_timestamp_before_reservation'
          BEFORE 'provider_payment_late';
      ELSE
        ALTER TYPE "public"."enum_inventory_reservation_entries_evidence_code"
          ADD VALUE 'provider_timestamp_before_reservation';
      END IF;
    END IF;
  END $$;
  ALTER TYPE "public"."enum_inventory_reservation_entries_evidence_code" ADD VALUE IF NOT EXISTS 'provider_payment_late';
  ALTER TYPE "public"."enum_inventory_reservation_entries_evidence_code" ADD VALUE IF NOT EXISTS 'physical_inventory_unavailable';
  ALTER TYPE "public"."enum_product_orders_status" ADD VALUE IF NOT EXISTS 'paid_inventory_review' BEFORE 'committed';
  ALTER TYPE "public"."enum_inventory_movements_source_type" ADD VALUE IF NOT EXISTS 'inventory_reservation';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'expireInventoryReservations' BEFORE 'welcomeUser';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'expireInventoryReservations' BEFORE 'welcomeUser';

  CREATE TABLE IF NOT EXISTS "inventory_reservations" (
    "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
    "reservation_key" varchar NOT NULL,
    "request_hash" varchar NOT NULL,
    "order_id" uuid NOT NULL,
    "sku_id" uuid NOT NULL,
    "location_id" uuid NOT NULL,
    "quantity" numeric NOT NULL,
    "status" "enum_inventory_reservations_status" DEFAULT 'active' NOT NULL,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "reserved_at" timestamp(3) with time zone NOT NULL,
    "terminal_at" timestamp(3) with time zone,
    "policy_version" numeric NOT NULL,
    "ttl_minutes" numeric NOT NULL,
    "safety_stock" numeric NOT NULL,
    "consume_point" "enum_inventory_reservations_consume_point" NOT NULL,
    "expiry_boundary" "enum_inventory_reservations_expiry_boundary" NOT NULL,
    "payment_time_source" "enum_inventory_reservations_payment_time_source" NOT NULL,
    "late_payment_policy" "enum_inventory_reservations_late_payment_policy" NOT NULL,
    "backorder_mode" "enum_inventory_reservations_backorder_mode" NOT NULL,
    "recovery_of_id" uuid,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "inventory_reservation_entries" (
    "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
    "idempotency_key" varchar NOT NULL,
    "request_hash" varchar NOT NULL,
    "reservation_id" uuid NOT NULL,
    "operation" "enum_inventory_reservation_entries_operation" NOT NULL,
    "quantity" numeric NOT NULL,
    "payment_id" uuid,
    "provider_event_ref" varchar,
    "provider_paid_at" timestamp(3) with time zone,
    "evidence_code" "enum_inventory_reservation_entries_evidence_code",
    "actor" varchar,
    "effective_at" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload_jobs_stats" (
    "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
    "stats" jsonb,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  -- MIGRATION-SAFETY: Payload's generated table definitions above remain the
  -- schema authority. Re-entry repairs generated non-ID columns after a partial
  -- CREATE without changing any established ID shape.
  DO $$ DECLARE target text; definitions text[]; definition text; BEGIN
    FOR target, definitions IN SELECT * FROM (VALUES
      ('inventory_reservations', ARRAY[
        '"reservation_key" varchar NOT NULL','"request_hash" varchar NOT NULL',
        '"order_id" uuid NOT NULL','"sku_id" uuid NOT NULL','"location_id" uuid NOT NULL',
        '"quantity" numeric NOT NULL','"status" enum_inventory_reservations_status DEFAULT ''active'' NOT NULL',
        '"expires_at" timestamp(3) with time zone NOT NULL','"reserved_at" timestamp(3) with time zone NOT NULL',
        '"terminal_at" timestamp(3) with time zone','"policy_version" numeric NOT NULL',
        '"ttl_minutes" numeric NOT NULL','"safety_stock" numeric NOT NULL',
        '"consume_point" enum_inventory_reservations_consume_point NOT NULL',
        '"expiry_boundary" enum_inventory_reservations_expiry_boundary NOT NULL',
        '"payment_time_source" enum_inventory_reservations_payment_time_source NOT NULL',
        '"late_payment_policy" enum_inventory_reservations_late_payment_policy NOT NULL',
        '"backorder_mode" enum_inventory_reservations_backorder_mode NOT NULL',
        '"recovery_of_id" uuid','"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL',
        '"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL'
      ]),
      ('inventory_reservation_entries', ARRAY[
        '"idempotency_key" varchar NOT NULL','"request_hash" varchar NOT NULL',
        '"reservation_id" uuid NOT NULL','"operation" enum_inventory_reservation_entries_operation NOT NULL',
        '"quantity" numeric NOT NULL','"payment_id" uuid','"provider_event_ref" varchar',
        '"provider_paid_at" timestamp(3) with time zone',
        '"evidence_code" enum_inventory_reservation_entries_evidence_code','"actor" varchar',
        '"effective_at" timestamp(3) with time zone NOT NULL',
        '"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL',
        '"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL'
      ]),
      ('payload_jobs_stats', ARRAY[
        '"stats" jsonb','"updated_at" timestamp(3) with time zone',
        '"created_at" timestamp(3) with time zone'
      ])
    ) AS repairs(table_name, column_definitions) LOOP
      FOREACH definition IN ARRAY definitions LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %s', target, definition);
      END LOOP;
    END LOOP;
  END $$;

  -- WHY-OVERRIDE-PAYLOAD: migrate:create attempts to change the
  -- product_variants_options array-row ID to UUID. Payload 3.86 writes its
  -- established 24-character varchar IDs at runtime; this migration never
  -- alters that column.
  ALTER TABLE IF EXISTS "payload_jobs" ADD COLUMN IF NOT EXISTS "meta" jsonb;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_order_id_product_orders_id_fk' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_product_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."product_orders"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_sku_id_product_variants_id_fk' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_sku_id_product_variants_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_location_id_stock_locations_id_fk' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_recovery_of_id_inventory_reservations_id_fk' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_recovery_of_id_inventory_reservations_id_fk" FOREIGN KEY ("recovery_of_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservation_entries_reservation_id_inventory_reservations_id_fk' AND conrelid = 'public.inventory_reservation_entries'::regclass) THEN
      ALTER TABLE "inventory_reservation_entries" ADD CONSTRAINT "inventory_reservation_entries_reservation_id_inventory_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservation_entries_payment_id_product_payments_id_fk' AND conrelid = 'public.inventory_reservation_entries'::regclass) THEN
      ALTER TABLE "inventory_reservation_entries" ADD CONSTRAINT "inventory_reservation_entries_payment_id_product_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."product_payments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;

  -- WHY-OVERRIDE-PAYLOAD: Number fields cannot express safe-integer bounds,
  -- integral values, or the reservation policy snapshot invariants.
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_numeric_bounds_check' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_numeric_bounds_check" CHECK (
        "quantity" = trunc("quantity") AND "quantity" BETWEEN 1 AND 9007199254740991
        AND "policy_version" = trunc("policy_version") AND "policy_version" BETWEEN 1 AND 9007199254740991
        AND "ttl_minutes" = trunc("ttl_minutes") AND "ttl_minutes" BETWEEN 1 AND 9007199254740991
        AND "safety_stock" = trunc("safety_stock") AND "safety_stock" BETWEEN 0 AND 9007199254740991
      );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_identity_evidence_check' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_identity_evidence_check" CHECK (
        "reservation_key" = "order_id"::text || ':' || "sku_id"::text || ':' || "location_id"::text
        AND "expires_at" > "reserved_at"
        AND "recovery_of_id" IS DISTINCT FROM "id"
      );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_lifecycle_evidence_check' AND conrelid = 'public.inventory_reservations'::regclass) THEN
      ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_lifecycle_evidence_check" CHECK (
        ("status" = 'active' AND "terminal_at" IS NULL)
        OR ("status" <> 'active' AND "terminal_at" IS NOT NULL AND "terminal_at" >= "reserved_at")
      );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservation_entries_quantity_check' AND conrelid = 'public.inventory_reservation_entries'::regclass) THEN
      ALTER TABLE "inventory_reservation_entries" ADD CONSTRAINT "inventory_reservation_entries_quantity_check" CHECK (
        "quantity" = trunc("quantity") AND "quantity" BETWEEN 1 AND 9007199254740991
      );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservation_entries_evidence_shape_check' AND conrelid = 'public.inventory_reservation_entries'::regclass) THEN
      ALTER TABLE "inventory_reservation_entries" ADD CONSTRAINT "inventory_reservation_entries_evidence_shape_check" CHECK (
        (
          "operation" IN ('reserve', 'release', 'expire')
          AND "payment_id" IS NULL AND "provider_event_ref" IS NULL
          AND "provider_paid_at" IS NULL AND "evidence_code" IS NULL
        ) OR (
          "operation" = 'consume' AND "payment_id" IS NOT NULL
          AND "evidence_code" IS NULL
        ) OR (
          "operation" = 'late_payment_detected'
          AND "payment_id" IS NOT NULL AND "evidence_code" IS NOT NULL
          AND (
            ("evidence_code" = 'provider_timestamp_missing' AND "provider_paid_at" IS NULL)
            OR ("evidence_code" <> 'provider_timestamp_missing' AND "provider_paid_at" IS NOT NULL)
          )
        )
      );
    END IF;
  END $$;

  -- WHY-OVERRIDE-PAYLOAD: Hooks cannot protect direct SQL from mutating the
  -- append-only entry history or rewriting reservation identity/lifecycle.
  CREATE OR REPLACE FUNCTION "public"."prevent_inventory_reservation_entry_mutation"()
  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    RAISE EXCEPTION 'inventory reservation entries are append-only' USING ERRCODE = '55000';
  END $$;
  DROP TRIGGER IF EXISTS "inventory_reservation_entries_prevent_row_mutation" ON "inventory_reservation_entries";
  CREATE TRIGGER "inventory_reservation_entries_prevent_row_mutation"
    BEFORE UPDATE OR DELETE ON "inventory_reservation_entries"
    FOR EACH ROW EXECUTE FUNCTION "public"."prevent_inventory_reservation_entry_mutation"();
  DROP TRIGGER IF EXISTS "inventory_reservation_entries_prevent_truncate" ON "inventory_reservation_entries";
  CREATE TRIGGER "inventory_reservation_entries_prevent_truncate"
    BEFORE TRUNCATE ON "inventory_reservation_entries"
    FOR EACH STATEMENT EXECUTE FUNCTION "public"."prevent_inventory_reservation_entry_mutation"();

  CREATE OR REPLACE FUNCTION "public"."protect_inventory_reservation_root"()
  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
      RAISE EXCEPTION 'inventory reservation roots cannot be removed' USING ERRCODE = '55000';
    END IF;
    IF OLD.reservation_key IS DISTINCT FROM NEW.reservation_key
      OR OLD.request_hash IS DISTINCT FROM NEW.request_hash
      OR OLD.order_id IS DISTINCT FROM NEW.order_id
      OR OLD.sku_id IS DISTINCT FROM NEW.sku_id
      OR OLD.location_id IS DISTINCT FROM NEW.location_id
      OR OLD.quantity IS DISTINCT FROM NEW.quantity
      OR OLD.expires_at IS DISTINCT FROM NEW.expires_at
      OR OLD.reserved_at IS DISTINCT FROM NEW.reserved_at
      OR OLD.policy_version IS DISTINCT FROM NEW.policy_version
      OR OLD.ttl_minutes IS DISTINCT FROM NEW.ttl_minutes
      OR OLD.safety_stock IS DISTINCT FROM NEW.safety_stock
      OR OLD.consume_point IS DISTINCT FROM NEW.consume_point
      OR OLD.expiry_boundary IS DISTINCT FROM NEW.expiry_boundary
      OR OLD.payment_time_source IS DISTINCT FROM NEW.payment_time_source
      OR OLD.late_payment_policy IS DISTINCT FROM NEW.late_payment_policy
      OR OLD.backorder_mode IS DISTINCT FROM NEW.backorder_mode
      OR OLD.recovery_of_id IS DISTINCT FROM NEW.recovery_of_id
      OR OLD.created_at IS DISTINCT FROM NEW.created_at
      OR OLD.status <> 'active' OR NEW.status = 'active' THEN
      RAISE EXCEPTION 'invalid inventory reservation root mutation' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_reservations_protect_lifecycle" ON "inventory_reservations";
  CREATE TRIGGER "inventory_reservations_protect_lifecycle"
    BEFORE UPDATE OR DELETE ON "inventory_reservations"
    FOR EACH ROW EXECUTE FUNCTION "public"."protect_inventory_reservation_root"();
  DROP TRIGGER IF EXISTS "inventory_reservations_prevent_truncate" ON "inventory_reservations";
  CREATE TRIGGER "inventory_reservations_prevent_truncate"
    BEFORE TRUNCATE ON "inventory_reservations"
    FOR EACH STATEMENT EXECUTE FUNCTION "public"."protect_inventory_reservation_root"();

  -- WHY-OVERRIDE-PAYLOAD: Foreign keys and hooks cannot prove at commit that
  -- the mutable root, append-only entries, and physical movement agree. The
  -- service writes these in different orders, so enforcement must be deferred.
  CREATE OR REPLACE FUNCTION "public"."validate_inventory_reservation_agreement"()
  RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE
    reservation_id_value uuid;
    reservation_record inventory_reservations%ROWTYPE;
    reserve_matches bigint;
    terminal_matches bigint;
    movement_matches bigint;
    movement_total bigint;
  BEGIN
    IF TG_TABLE_NAME = 'inventory_reservations' THEN
      reservation_id_value := NEW.id;
    ELSIF TG_TABLE_NAME = 'inventory_reservation_entries' THEN
      reservation_id_value := NEW.reservation_id;
    ELSE
      SELECT reservation.id INTO reservation_id_value
      FROM inventory_reservations reservation
      WHERE reservation.id::text = NEW.source_ref;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'reservation movement mismatch' USING ERRCODE = '23514';
      END IF;
    END IF;

    SELECT * INTO reservation_record FROM inventory_reservations
    WHERE id = reservation_id_value;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'reservation history mismatch' USING ERRCODE = '23514';
    END IF;
    SELECT count(*) INTO reserve_matches
    FROM inventory_reservation_entries entry
    WHERE entry.reservation_id = reservation_record.id
      AND entry.operation = 'reserve'
      AND entry.quantity = reservation_record.quantity
      AND entry.request_hash = reservation_record.request_hash
      AND entry.effective_at = reservation_record.reserved_at;
    IF reserve_matches <> 1 THEN
      RAISE EXCEPTION 'reservation history mismatch' USING ERRCODE = '23514';
    END IF;

    IF reservation_record.status = 'active' THEN
      IF EXISTS (SELECT 1 FROM inventory_reservation_entries entry
        WHERE entry.reservation_id = reservation_record.id
          AND entry.operation IN ('consume', 'release', 'expire')) THEN
        RAISE EXCEPTION 'reservation history mismatch' USING ERRCODE = '23514';
      END IF;
    ELSE
      SELECT count(*) INTO terminal_matches
      FROM inventory_reservation_entries entry
      WHERE entry.reservation_id = reservation_record.id
        AND entry.operation::text = CASE reservation_record.status::text
          WHEN 'consumed' THEN 'consume'
          WHEN 'released' THEN 'release'
          WHEN 'expired' THEN 'expire'
        END
        AND entry.quantity = reservation_record.quantity
        AND entry.effective_at = reservation_record.terminal_at;
      IF terminal_matches <> 1 THEN
        RAISE EXCEPTION 'reservation history mismatch' USING ERRCODE = '23514';
      END IF;
    END IF;

    SELECT count(*), count(*) FILTER (WHERE
      movement.sku_id = reservation_record.sku_id
      AND movement.kind = 'outbound'
      AND movement.quantity = reservation_record.quantity
      AND movement.from_location_id = reservation_record.location_id
      AND movement.from_disposition = 'available'
      AND movement.to_location_id IS NULL AND movement.to_disposition IS NULL
      AND movement.effective_at = reservation_record.terminal_at
      AND movement.receipt_id IS NULL AND movement.receipt_line_id IS NULL
      AND movement.lot_id IS NULL AND movement.cycle_count_id IS NULL
      AND movement.cycle_count_line_id IS NULL
    ) INTO movement_total, movement_matches
    FROM inventory_movements movement
    WHERE movement.source_type::text = 'inventory_reservation'
      AND movement.source_ref = reservation_record.id::text;
    IF reservation_record.status = 'consumed' THEN
      IF movement_total <> 1 OR movement_matches <> 1 THEN
        RAISE EXCEPTION 'reservation movement mismatch' USING ERRCODE = '23514';
      END IF;
    ELSIF movement_total <> 0 THEN
      RAISE EXCEPTION 'reservation movement mismatch' USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
  END $$;
  DROP TRIGGER IF EXISTS "inventory_reservations_validate_agreement" ON "inventory_reservations";
  CREATE CONSTRAINT TRIGGER "inventory_reservations_validate_agreement"
    AFTER INSERT OR UPDATE ON "inventory_reservations"
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_inventory_reservation_agreement"();
  DROP TRIGGER IF EXISTS "inventory_reservation_entries_validate_agreement" ON "inventory_reservation_entries";
  CREATE CONSTRAINT TRIGGER "inventory_reservation_entries_validate_agreement"
    AFTER INSERT ON "inventory_reservation_entries"
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_inventory_reservation_agreement"();
  DROP TRIGGER IF EXISTS "inventory_movements_validate_reservation_agreement" ON "inventory_movements";
  CREATE CONSTRAINT TRIGGER "inventory_movements_validate_reservation_agreement"
    AFTER INSERT ON "inventory_movements"
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    WHEN (NEW.source_type::text = 'inventory_reservation')
    EXECUTE FUNCTION "public"."validate_inventory_reservation_agreement"();

  -- WHY-OVERRIDE-PAYLOAD: Extend PR5's complete provenance shape with the
  -- reservation outbound branch. Down restores the exact PR5 expression.
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_provenance_shape_check";
  ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_provenance_shape_check" CHECK (
    (
      "source_type"::text = 'inventory_command'
      AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
      AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
    ) OR (
      "source_type"::text = 'inventory_adjustment' AND "kind" IN ('outbound', 'transfer')
      AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
      AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
    ) OR (
      "source_type"::text = 'inventory_receipt' AND "kind" = 'inbound'
      AND "from_location_id" IS NULL AND "from_disposition" IS NULL
      AND "to_location_id" IS NOT NULL AND "to_disposition" = 'quarantine'
      AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL
      AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
    ) OR (
      "source_type"::text = 'inventory_lot_release' AND "kind" = 'transfer'
      AND "from_location_id" = "to_location_id"
      AND "from_disposition" = 'quarantine' AND "to_disposition" = 'available'
      AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL
      AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
    ) OR (
      "source_type"::text = 'inventory_cycle_count' AND "kind" IN ('inbound', 'outbound')
      AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
      AND "cycle_count_id" IS NOT NULL AND "cycle_count_line_id" IS NOT NULL
    ) OR (
      "source_type"::text = 'inventory_reservation' AND "kind" = 'outbound'
      AND "from_location_id" IS NOT NULL AND "from_disposition" = 'available'
      AND "to_location_id" IS NULL AND "to_disposition" IS NULL
      AND "source_ref" IS NOT NULL
      AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL
      AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL
    )
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservations_reservation_key_idx" ON "inventory_reservations" USING btree ("reservation_key");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_order_idx" ON "inventory_reservations" USING btree ("order_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_sku_idx" ON "inventory_reservations" USING btree ("sku_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_location_idx" ON "inventory_reservations" USING btree ("location_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_status_idx" ON "inventory_reservations" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_expires_at_idx" ON "inventory_reservations" USING btree ("expires_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_terminal_at_idx" ON "inventory_reservations" USING btree ("terminal_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_recovery_of_idx" ON "inventory_reservations" USING btree ("recovery_of_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_updated_at_idx" ON "inventory_reservations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservations_created_at_idx" ON "inventory_reservations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "sku_location_status_idx" ON "inventory_reservations" USING btree ("sku_id", "location_id", "status");
  CREATE INDEX IF NOT EXISTS "status_expires_at_idx" ON "inventory_reservations" USING btree ("status", "expires_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservations_recovery_of_once_idx" ON "inventory_reservations" USING btree ("recovery_of_id") WHERE "recovery_of_id" IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_entries_idempotency_key_idx" ON "inventory_reservation_entries" USING btree ("idempotency_key");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_reservation_idx" ON "inventory_reservation_entries" USING btree ("reservation_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_operation_idx" ON "inventory_reservation_entries" USING btree ("operation");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_payment_idx" ON "inventory_reservation_entries" USING btree ("payment_id");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_provider_event_ref_idx" ON "inventory_reservation_entries" USING btree ("provider_event_ref");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_provider_paid_at_idx" ON "inventory_reservation_entries" USING btree ("provider_paid_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_evidence_code_idx" ON "inventory_reservation_entries" USING btree ("evidence_code");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_effective_at_idx" ON "inventory_reservation_entries" USING btree ("effective_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_updated_at_idx" ON "inventory_reservation_entries" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "inventory_reservation_entries_created_at_idx" ON "inventory_reservation_entries" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reservation_operation_idx" ON "inventory_reservation_entries" USING btree ("reservation_id", "operation");
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_entries_reserve_once_idx" ON "inventory_reservation_entries" USING btree ("reservation_id") WHERE "operation" = 'reserve';
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_entries_terminal_once_idx" ON "inventory_reservation_entries" USING btree ("reservation_id") WHERE "operation" IN ('consume', 'release', 'expire');
  CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_entries_review_evidence_once_idx" ON "inventory_reservation_entries" USING btree ("reservation_id", "payment_id", "evidence_code") WHERE "operation" = 'late_payment_detected';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- WHY-OVERRIDE-PAYLOAD: The evidence scan and destructive DDL share one
  -- fixed-order write barrier, preventing evidence from racing the rollback.
  DO $$ DECLARE target text; evidence boolean := false; BEGIN
    FOREACH target IN ARRAY ARRAY[
      'inventory_reservations', 'inventory_reservation_entries',
      'inventory_movements', 'product_orders', 'payload_jobs',
      'payload_jobs_log', 'payload_jobs_stats'
    ] LOOP
      IF to_regclass('public.' || target) IS NOT NULL THEN
        EXECUTE format('LOCK TABLE public.%I IN SHARE MODE', target);
      END IF;
    END LOOP;
    IF to_regclass('public.inventory_reservation_entries') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_reservation_entries)' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.inventory_reservations') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_reservations)' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.inventory_movements') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_movements WHERE source_type::text = ''inventory_reservation'')' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.product_orders') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM product_orders WHERE status::text = ''paid_inventory_review'')' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.payload_jobs') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM payload_jobs WHERE task_slug::text = ''expireInventoryReservations'')' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.payload_jobs_log') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM payload_jobs_log WHERE task_slug::text = ''expireInventoryReservations'')' INTO evidence;
    END IF;
    IF NOT evidence AND to_regclass('public.payload_jobs_stats') IS NOT NULL THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM payload_jobs_stats)' INTO evidence;
    END IF;
    IF NOT evidence AND EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payload_jobs' AND column_name = 'meta') THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM payload_jobs WHERE meta IS NOT NULL)' INTO evidence;
    END IF;
    IF evidence THEN
      RAISE EXCEPTION 'PR6 reservation evidence exists; refusing rollback' USING ERRCODE = '55000';
    END IF;
  END $$;

  DO $$ BEGIN
    IF to_regclass('public.inventory_reservation_entries') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS "inventory_reservation_entries_validate_agreement" ON "inventory_reservation_entries";
      DROP TRIGGER IF EXISTS "inventory_reservation_entries_prevent_row_mutation" ON "inventory_reservation_entries";
      DROP TRIGGER IF EXISTS "inventory_reservation_entries_prevent_truncate" ON "inventory_reservation_entries";
    END IF;
    IF to_regclass('public.inventory_reservations') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS "inventory_reservations_validate_agreement" ON "inventory_reservations";
      DROP TRIGGER IF EXISTS "inventory_reservations_protect_lifecycle" ON "inventory_reservations";
      DROP TRIGGER IF EXISTS "inventory_reservations_prevent_truncate" ON "inventory_reservations";
    END IF;
    IF to_regclass('public.inventory_movements') IS NOT NULL THEN
      DROP TRIGGER IF EXISTS "inventory_movements_validate_reservation_agreement" ON "inventory_movements";
    END IF;
  END $$;
  DROP INDEX IF EXISTS "inventory_movements_reservation_source_ref_once_idx";
  ALTER TABLE IF EXISTS "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_provenance_shape_check";

  ALTER TABLE IF EXISTS "inventory_reservation_entries" DROP CONSTRAINT IF EXISTS "inventory_reservation_entries_payment_id_product_payments_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservation_entries" DROP CONSTRAINT IF EXISTS "inventory_reservation_entries_reservation_id_inventory_reservations_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_recovery_of_id_inventory_reservations_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_location_id_stock_locations_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_sku_id_product_variants_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_order_id_product_orders_id_fk";
  ALTER TABLE IF EXISTS "inventory_reservation_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "inventory_reservations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "inventory_reservation_entries" CASCADE;
  DROP TABLE IF EXISTS "inventory_reservations" CASCADE;
  DROP FUNCTION IF EXISTS "public"."validate_inventory_reservation_agreement"();
  DROP FUNCTION IF EXISTS "public"."prevent_inventory_reservation_entry_mutation"();
  DROP FUNCTION IF EXISTS "public"."protect_inventory_reservation_root"();
  DROP TABLE IF EXISTS "payload_jobs_stats" CASCADE;
  ALTER TABLE IF EXISTS "payload_jobs" DROP COLUMN IF EXISTS "meta";

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum value JOIN pg_type type ON type.oid = value.enumtypid
      WHERE type.typname = 'enum_product_orders_status' AND value.enumlabel = 'paid_inventory_review') THEN
      ALTER TABLE "product_orders" ALTER COLUMN "status" DROP DEFAULT;
      ALTER TABLE "product_orders" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;
      DROP TYPE "public"."enum_product_orders_status";
      CREATE TYPE "public"."enum_product_orders_status" AS ENUM('draft', 'quote_requested', 'quote_ready', 'pending_payment', 'paid', 'committed', 'confirmed', 'converted', 'failed', 'canceled', 'refunded');
      ALTER TABLE "product_orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_product_orders_status" USING "status"::"public"."enum_product_orders_status";
      ALTER TABLE "product_orders" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_product_orders_status";
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum value JOIN pg_type type ON type.oid = value.enumtypid
      WHERE type.typname = 'enum_inventory_movements_source_type' AND value.enumlabel = 'inventory_reservation') THEN
      ALTER TABLE "inventory_movements" ALTER COLUMN "source_type" SET DATA TYPE text USING "source_type"::text;
      DROP TYPE "public"."enum_inventory_movements_source_type";
      CREATE TYPE "public"."enum_inventory_movements_source_type" AS ENUM('inventory_command', 'inventory_receipt', 'inventory_lot_release', 'inventory_adjustment', 'inventory_cycle_count');
      ALTER TABLE "inventory_movements" ALTER COLUMN "source_type" SET DATA TYPE "public"."enum_inventory_movements_source_type" USING "source_type"::"public"."enum_inventory_movements_source_type";
    END IF;
  END $$;
  -- Restore the exact PR5 provenance constraint only after shrinking the enum;
  -- PostgreSQL otherwise retains an old-enum comparison while recasting.
  DO $$ BEGIN
    IF to_regclass('public.inventory_movements') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_provenance_shape_check' AND conrelid = 'public.inventory_movements'::regclass) THEN
      ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_provenance_shape_check" CHECK (
        ("source_type"::text = 'inventory_command' AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL)
        OR ("source_type"::text = 'inventory_adjustment' AND "kind" IN ('outbound', 'transfer') AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL)
        OR ("source_type"::text = 'inventory_receipt' AND "kind" = 'inbound' AND "from_location_id" IS NULL AND "from_disposition" IS NULL AND "to_location_id" IS NOT NULL AND "to_disposition" = 'quarantine' AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL)
        OR ("source_type"::text = 'inventory_lot_release' AND "kind" = 'transfer' AND "from_location_id" = "to_location_id" AND "from_disposition" = 'quarantine' AND "to_disposition" = 'available' AND "receipt_id" IS NOT NULL AND "receipt_line_id" IS NOT NULL AND "lot_id" IS NOT NULL AND "cycle_count_id" IS NULL AND "cycle_count_line_id" IS NULL)
        OR ("source_type"::text = 'inventory_cycle_count' AND "kind" IN ('inbound', 'outbound') AND "receipt_id" IS NULL AND "receipt_line_id" IS NULL AND "lot_id" IS NULL AND "cycle_count_id" IS NOT NULL AND "cycle_count_line_id" IS NOT NULL)
      );
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum value JOIN pg_type type ON type.oid = value.enumtypid
      WHERE type.typname = 'enum_payload_jobs_log_task_slug' AND value.enumlabel = 'expireInventoryReservations') THEN
      ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text USING "task_slug"::text;
      DROP TYPE "public"."enum_payload_jobs_log_task_slug";
      CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'welcomeUser', 'welcomeUsers', 'refreshSearchScores', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
      ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum value JOIN pg_type type ON type.oid = value.enumtypid
      WHERE type.typname = 'enum_payload_jobs_task_slug' AND value.enumlabel = 'expireInventoryReservations') THEN
      ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text USING "task_slug"::text;
      DROP TYPE "public"."enum_payload_jobs_task_slug";
      CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'welcomeUser', 'welcomeUsers', 'refreshSearchScores', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
      ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
    END IF;
  END $$;
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_status";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_consume_point";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_expiry_boundary";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_payment_time_source";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_late_payment_policy";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservations_backorder_mode";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservation_entries_operation";
  DROP TYPE IF EXISTS "public"."enum_inventory_reservation_entries_evidence_code";
  `);
}
