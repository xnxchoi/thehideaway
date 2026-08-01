import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_inventory_reservation_operator_events_source"
        AS ENUM('manual_operator');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "inventory_reservation_operator_events"
      ADD COLUMN IF NOT EXISTS "source" "enum_inventory_reservation_operator_events_source";
    -- WHY-OVERRIDE-PAYLOAD: Payload interpreted text fields ending in _id as
    -- UUIDs. The following generated rename migration moves these varchars to
    -- their final schema-owned *_key names. These guards also keep this
    -- migration safe when re-entered after that rename.
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name IN ('correlation_id', 'correlation_key')) THEN
        ALTER TABLE "inventory_reservation_operator_events" ADD COLUMN "correlation_id" varchar;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name IN ('causation_id', 'causation_key')) THEN
        ALTER TABLE "inventory_reservation_operator_events" ADD COLUMN "causation_id" varchar;
      END IF;
    END $$;
    UPDATE "inventory_reservation_operator_events"
      SET "source" = 'manual_operator' WHERE "source" IS NULL;
    ALTER TABLE "inventory_reservation_operator_events"
      ALTER COLUMN "source" SET NOT NULL;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'correlation_id') THEN
        UPDATE "inventory_reservation_operator_events"
          SET "correlation_id" = "command_key" WHERE "correlation_id" IS NULL;
        ALTER TABLE "inventory_reservation_operator_events"
          ALTER COLUMN "correlation_id" SET NOT NULL;
        CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_correlation_id_idx"
          ON "inventory_reservation_operator_events" USING btree ("correlation_id");
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'inventory_reservation_operator_events' AND column_name = 'causation_id') THEN
        UPDATE "inventory_reservation_operator_events"
          SET "causation_id" = "command_key" WHERE "causation_id" IS NULL;
        ALTER TABLE "inventory_reservation_operator_events"
          ALTER COLUMN "causation_id" SET NOT NULL;
        CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_causation_id_idx"
          ON "inventory_reservation_operator_events" USING btree ("causation_id");
      END IF;
    END $$;
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
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_correlation_id_idx";
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_causation_id_idx";
    ALTER TABLE IF EXISTS "inventory_reservation_operator_events"
      DROP COLUMN IF EXISTS "source",
      DROP COLUMN IF EXISTS "correlation_id",
      DROP COLUMN IF EXISTS "causation_id";
    DROP TYPE IF EXISTS "public"."enum_inventory_reservation_operator_events_source";
  `);
}
