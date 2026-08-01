import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_command_key_idx";
    CREATE INDEX IF NOT EXISTS "inventory_reservation_operator_events_command_key_idx"
      ON "inventory_reservation_operator_events" USING btree ("command_key");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ DECLARE operator_evidence boolean := false; BEGIN
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        EXECUTE 'LOCK TABLE inventory_reservation_operator_events IN ACCESS EXCLUSIVE MODE';
        EXECUTE 'SELECT EXISTS (
          SELECT 1 FROM inventory_reservation_operator_events
        )' INTO operator_evidence;
      END IF;
      IF operator_evidence THEN
        RAISE EXCEPTION 'PR6A operator evidence exists; refusing rollback' USING ERRCODE = '55000';
      END IF;
    END $$;
    DROP INDEX IF EXISTS "inventory_reservation_operator_events_command_key_idx";
    DO $$ BEGIN
      IF to_regclass('public.inventory_reservation_operator_events') IS NOT NULL THEN
        CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservation_operator_events_command_key_idx"
          ON "inventory_reservation_operator_events" USING btree ("command_key");
      END IF;
    END $$;
  `);
}
