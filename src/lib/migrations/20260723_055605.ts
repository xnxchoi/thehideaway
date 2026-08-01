import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_inventory_reservation_operator_events_action"
        AS ENUM('release', 'expire', 'reconcile', 'run_expiry');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "inventory_reservation_operator_events" (
      "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
      "event_key" varchar NOT NULL,
      "command_key" varchar NOT NULL,
      "action" "enum_inventory_reservation_operator_events_action" NOT NULL,
      "outcome_code" varchar NOT NULL,
      "actor_id" uuid NOT NULL,
      "order_id" uuid,
      "payment_id" uuid,
      "reservation_id" uuid,
      "reason_code" varchar NOT NULL,
      "evidence_reference" varchar NOT NULL,
      "expected_state_hash" varchar NOT NULL,
      "observed_state_hash" varchar NOT NULL,
      "affected_count" numeric NOT NULL,
      "effective_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "inventory_reservation_operator_events"
      ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT uuidv7() NOT NULL,
      ADD COLUMN IF NOT EXISTS "event_key" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "command_key" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "action" "enum_inventory_reservation_operator_events_action" NOT NULL,
      ADD COLUMN IF NOT EXISTS "outcome_code" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "actor_id" uuid NOT NULL,
      ADD COLUMN IF NOT EXISTS "order_id" uuid,
      ADD COLUMN IF NOT EXISTS "payment_id" uuid,
      ADD COLUMN IF NOT EXISTS "reservation_id" uuid,
      ADD COLUMN IF NOT EXISTS "reason_code" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "evidence_reference" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "expected_state_hash" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "observed_state_hash" varchar NOT NULL,
      ADD COLUMN IF NOT EXISTS "affected_count" numeric NOT NULL,
      ADD COLUMN IF NOT EXISTS "effective_at" timestamp(3) with time zone NOT NULL,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;

    -- WHY-OVERRIDE-PAYLOAD: field validators cannot enforce these shapes for
    -- direct SQL writes or constrain numeric values to JavaScript safe integers.
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_pkey'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_pkey" PRIMARY KEY ("id");
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_actor_id_users_id_fk'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_actor_id_users_id_fk"
          FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_order_id_product_orders_id_fk'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_order_id_product_orders_id_fk"
          FOREIGN KEY ("order_id") REFERENCES "public"."product_orders"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_payment_id_product_payments_id_fk'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_payment_id_product_payments_id_fk"
          FOREIGN KEY ("payment_id") REFERENCES "public"."product_payments"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_reservation_id_inventory_reservations_id_fk'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_reservation_id_inventory_reservations_id_fk"
          FOREIGN KEY ("reservation_id") REFERENCES "public"."inventory_reservations"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservation_operator_events_shape_check'
          AND conrelid = 'public.inventory_reservation_operator_events'::regclass
      ) THEN
        ALTER TABLE "inventory_reservation_operator_events"
          ADD CONSTRAINT "inventory_reservation_operator_events_shape_check" CHECK (
            "event_key" ~ '^[a-f0-9]{64}$'
            AND "command_key" ~ '^[A-Za-z0-9_-]{16,128}$'
            AND "reason_code" ~ '^[A-Za-z0-9_.:~/-]{1,100}$'
            AND "evidence_reference" ~ '^[A-Za-z0-9_.:~/-]{1,200}$'
            AND "expected_state_hash" ~ '^[a-f0-9]{64}$'
            AND "observed_state_hash" ~ '^[a-f0-9]{64}$'
            AND "affected_count" = trunc("affected_count")
            AND "affected_count" BETWEEN 0 AND 9007199254740991
          );
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_operator_events_event_key_idx"
      ON "inventory_reservation_operator_events" USING btree ("event_key");
    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_operator_events_command_key_idx"
      ON "inventory_reservation_operator_events" USING btree ("command_key");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_outcome_code_idx"
      ON "inventory_reservation_operator_events" USING btree ("outcome_code");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_actor_idx"
      ON "inventory_reservation_operator_events" USING btree ("actor_id");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_order_idx"
      ON "inventory_reservation_operator_events" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_payment_idx"
      ON "inventory_reservation_operator_events" USING btree ("payment_id");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_reservation_idx"
      ON "inventory_reservation_operator_events" USING btree ("reservation_id");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_reason_code_idx"
      ON "inventory_reservation_operator_events" USING btree ("reason_code");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_effective_at_idx"
      ON "inventory_reservation_operator_events" USING btree ("effective_at");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_updated_at_idx"
      ON "inventory_reservation_operator_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_created_at_idx"
      ON "inventory_reservation_operator_events" USING btree ("created_at");

    -- WHY-OVERRIDE-PAYLOAD: Payload cannot express the reservation-key form
    -- that links one paid-review recovery to its original reservation.
    ALTER TABLE "inventory_reservations"
      DROP CONSTRAINT IF EXISTS "inventory_reservations_identity_evidence_check";
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservations_identity_evidence_check'
          AND conrelid = 'public.inventory_reservations'::regclass
      ) THEN
        ALTER TABLE "inventory_reservations"
          ADD CONSTRAINT "inventory_reservations_identity_evidence_check" CHECK (
            (
              (
                "recovery_of_id" IS NULL
                AND "reservation_key" = "order_id"::text || ':' || "sku_id"::text || ':' || "location_id"::text
              ) OR (
                "recovery_of_id" IS NOT NULL
                AND "reservation_key" = "order_id"::text || ':' || "sku_id"::text || ':' || "location_id"::text || ':recovery:' || "recovery_of_id"::text
              )
            )
            AND "expires_at" > "reserved_at"
            AND "recovery_of_id" IS DISTINCT FROM "id"
          );
      END IF;
    END $$;

    -- WHY-OVERRIDE-PAYLOAD: PR 6 created this equivalent partial uniqueness
    -- index manually. Payload now owns uniqueness through the generated field.
    DROP INDEX IF EXISTS "inventory_reservations_recovery_of_once_idx";
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_index i ON i.indexrelid = c.oid
        WHERE c.relname = 'inventory_reservations_recovery_of_idx'
          AND NOT i.indisunique
      ) THEN
        DROP INDEX "inventory_reservations_recovery_of_idx";
      END IF;
    END $$;
    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservations_recovery_of_idx"
      ON "inventory_reservations" USING btree ("recovery_of_id");

    -- WHY-OVERRIDE-PAYLOAD: collection hooks cannot prevent direct SQL edits.
    CREATE OR REPLACE FUNCTION prevent_inventory_reservation_operator_event_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'inventory-reservation-operator-event-immutable';
    END;
    $$;
    DROP TRIGGER IF EXISTS "inventory_reservation_operator_events_immutable" ON "inventory_reservation_operator_events";
    CREATE TRIGGER "inventory_reservation_operator_events_immutable"
      BEFORE UPDATE OR DELETE ON "inventory_reservation_operator_events"
      FOR EACH ROW EXECUTE FUNCTION prevent_inventory_reservation_operator_event_mutation();
    DROP TRIGGER IF EXISTS "inventory_reservation_operator_events_prevent_truncate" ON "inventory_reservation_operator_events";
    CREATE TRIGGER "inventory_reservation_operator_events_prevent_truncate"
      BEFORE TRUNCATE ON "inventory_reservation_operator_events"
      FOR EACH STATEMENT EXECUTE FUNCTION prevent_inventory_reservation_operator_event_mutation();
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- WHY-OVERRIDE-PAYLOAD: the evidence scans and destructive DDL share a
    -- fixed-order write barrier so inserts cannot race a successful rollback.
    DO $$ DECLARE evidence boolean := false; BEGIN
      IF to_regclass('public.inventory_reservations') IS NOT NULL THEN
        LOCK TABLE "inventory_reservations" IN SHARE MODE;
      END IF;
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        LOCK TABLE "inventory_reservation_operator_events" IN SHARE MODE;
      END IF;
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_reservation_operator_events)'
          INTO evidence;
        IF evidence THEN
          RAISE EXCEPTION 'pr6a-down-requires-empty-operator-events';
        END IF;
      END IF;
      IF to_regclass('public.inventory_reservations') IS NOT NULL THEN
        EXECUTE 'SELECT EXISTS (
          SELECT 1 FROM inventory_reservations WHERE recovery_of_id IS NOT NULL
        )' INTO evidence;
        IF evidence THEN
          RAISE EXCEPTION 'pr6a-down-requires-no-recovery-reservations';
        END IF;
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS "inventory_reservation_operator_events_immutable"
          ON "inventory_reservation_operator_events";
        DROP TRIGGER IF EXISTS "inventory_reservation_operator_events_prevent_truncate"
          ON "inventory_reservation_operator_events";
      END IF;
    END $$;
    DROP FUNCTION IF EXISTS prevent_inventory_reservation_operator_event_mutation();

    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_actor_id_users_id_fk",
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_order_id_product_orders_id_fk",
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_payment_id_product_payments_id_fk",
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_reservation_id_inventory_reservations_id_fk",
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_shape_check";

    DROP INDEX IF EXISTS "inventory_reservation_operator_events_event_key_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_command_key_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_outcome_code_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_actor_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_order_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_payment_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_reservation_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_reason_code_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_effective_at_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_updated_at_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_created_at_idx";
    DROP TABLE IF EXISTS "inventory_reservation_operator_events" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_inventory_reservation_operator_events_action";

    DROP INDEX IF EXISTS "inventory_reservations_recovery_of_idx";
    CREATE INDEX IF NOT EXISTS "inventory_reservations_recovery_of_idx"
      ON "inventory_reservations" USING btree ("recovery_of_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservations_recovery_of_once_idx"
      ON "inventory_reservations" USING btree ("recovery_of_id")
      WHERE "recovery_of_id" IS NOT NULL;
    ALTER TABLE "inventory_reservations"
      DROP CONSTRAINT IF EXISTS "inventory_reservations_identity_evidence_check";
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_reservations_identity_evidence_check'
          AND conrelid = 'public.inventory_reservations'::regclass
      ) THEN
        ALTER TABLE "inventory_reservations"
          ADD CONSTRAINT "inventory_reservations_identity_evidence_check" CHECK (
            "reservation_key" = "order_id"::text || ':' || "sku_id"::text || ':' || "location_id"::text
            AND "expires_at" > "reserved_at"
            AND "recovery_of_id" IS DISTINCT FROM "id"
          );
      END IF;
    END $$;
  `);
}
