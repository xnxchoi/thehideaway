import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'correlation_id')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
          AND table_name = 'inventory_reservation_operator_events' AND column_name = 'correlation_key') THEN
        ALTER TABLE "inventory_reservation_operator_events"
          RENAME COLUMN "correlation_id" TO "correlation_key";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'causation_id')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
          AND table_name = 'inventory_reservation_operator_events' AND column_name = 'causation_key') THEN
        ALTER TABLE "inventory_reservation_operator_events"
          RENAME COLUMN "causation_id" TO "causation_key";
      END IF;
    END $$;
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_correlation_id_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_causation_id_idx";
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_correlation_key_idx"
      ON "inventory_reservation_operator_events" USING btree ("correlation_key");
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_causation_key_idx"
      ON "inventory_reservation_operator_events" USING btree ("causation_key");
    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_shape_check";
    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
      ADD CONSTRAINT "inventory_reservation_operator_events_shape_check" CHECK (
        "event_key" ~ '^[a-f0-9]{64}$'
        AND "command_key" ~ '^[A-Za-z0-9_-]{16,128}$'
        AND "correlation_key" ~ '^[A-Za-z0-9_-]{16,128}$'
        AND "causation_key" ~ '^[A-Za-z0-9_-]{16,128}$'
        AND "reason_code" ~ '^[A-Za-z0-9_.:~/-]{1,100}$'
        AND "evidence_reference" ~ '^[A-Za-z0-9_.:~/-]{1,200}$'
        AND "expected_state_hash" ~ '^[a-f0-9]{64}$'
        AND "observed_state_hash" ~ '^[a-f0-9]{64}$'
        AND "affected_count" = trunc("affected_count")
        AND "affected_count" BETWEEN 0 AND 9007199254740991
      );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ DECLARE evidence boolean := false; BEGIN
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        LOCK TABLE "inventory_reservation_operator_events" IN SHARE MODE;
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM inventory_reservation_operator_events)'
          INTO evidence;
        IF evidence THEN
          RAISE EXCEPTION 'pr6a-down-requires-empty-operator-events';
        END IF;
      END IF;
    END $$;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'correlation_key')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
          AND table_name = 'inventory_reservation_operator_events' AND column_name = 'correlation_id') THEN
        ALTER TABLE "inventory_reservation_operator_events"
          RENAME COLUMN "correlation_key" TO "correlation_id";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'causation_key')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
          AND table_name = 'inventory_reservation_operator_events' AND column_name = 'causation_id') THEN
        ALTER TABLE "inventory_reservation_operator_events"
          RENAME COLUMN "causation_key" TO "causation_id";
      END IF;
    END $$;
    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
      DROP CONSTRAINT IF EXISTS "inventory_reservation_operator_events_shape_check";
    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
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
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_correlation_key_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_causation_key_idx";
    DO $$ BEGIN
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_correlation_id_idx"
          ON "inventory_reservation_operator_events" USING btree ("correlation_id");
        CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_causation_id_idx"
          ON "inventory_reservation_operator_events" USING btree ("causation_id");
      END IF;
    END $$;
  `);
}
