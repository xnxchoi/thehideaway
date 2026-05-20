import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * TicketOrders parent collection + Tickets gift / order columns.
 *
 *   ticket_orders        — parent grouping for the 4-step Day n Night
 *                          purchase flow. One row per purchaser-event
 *                          transaction. Owns the 48h password timestamps.
 *   tickets.order_id     — FK back to ticket_orders (nullable; legacy
 *                          tickets created outside the flow stay null).
 *   tickets.gift_initial_name + gift_name_locked — recipient name with
 *                          admin-lockable safety.
 *
 * Re-runnable per readmes/MIGRATIONS.md:
 *   - CREATE TABLE / INDEX wrapped with IF NOT EXISTS
 *   - ADD COLUMN wrapped with IF NOT EXISTS
 *   - ADD CONSTRAINT FK wrapped in DO $$ block that checks pg_constraint
 *
 * Mirrors Payload's idiomatic UUID v7 PK + snake_case column names. The
 * timestamps are TIMESTAMP(3) WITH TIME ZONE to match other tables.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Parent table
    CREATE TABLE IF NOT EXISTS "ticket_orders" (
      "id"                    uuid PRIMARY KEY DEFAULT uuidv7(),
      "purchaser_id"          uuid NOT NULL,
      "event_id"              uuid NOT NULL,
      "purchaser_name"        varchar,
      "paid"                  boolean NOT NULL DEFAULT false,
      "paid_at"               timestamp(3) with time zone,
      "password"              varchar,
      "password_issued_at"    timestamp(3) with time zone,
      "password_expires_at"   timestamp(3) with time zone,
      "created_at"            timestamp(3) with time zone NOT NULL DEFAULT now(),
      "updated_at"            timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS "ticket_orders_purchaser_idx"
      ON "ticket_orders" ("purchaser_id");
    CREATE INDEX IF NOT EXISTS "ticket_orders_event_idx"
      ON "ticket_orders" ("event_id");
    CREATE INDEX IF NOT EXISTS "ticket_orders_paid_idx"
      ON "ticket_orders" ("paid");
    CREATE INDEX IF NOT EXISTS "ticket_orders_password_expires_at_idx"
      ON "ticket_orders" ("password_expires_at");
    CREATE INDEX IF NOT EXISTS "ticket_orders_updated_at_idx"
      ON "ticket_orders" ("updated_at");
    CREATE INDEX IF NOT EXISTS "ticket_orders_created_at_idx"
      ON "ticket_orders" ("created_at");

    -- FKs on ticket_orders (guarded — Postgres has no IF NOT EXISTS for constraints)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ticket_orders_purchaser_id_users_id_fk'
      ) THEN
        ALTER TABLE "ticket_orders"
          ADD CONSTRAINT "ticket_orders_purchaser_id_users_id_fk"
          FOREIGN KEY ("purchaser_id") REFERENCES "users"("id")
          ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ticket_orders_event_id_events_id_fk'
      ) THEN
        ALTER TABLE "ticket_orders"
          ADD CONSTRAINT "ticket_orders_event_id_events_id_fk"
          FOREIGN KEY ("event_id") REFERENCES "events"("id")
          ON DELETE SET NULL;
      END IF;
    END $$;

    -- Tickets: new columns + FK to ticket_orders
    ALTER TABLE "tickets"
      ADD COLUMN IF NOT EXISTS "gift_initial_name" varchar;
    ALTER TABLE "tickets"
      ADD COLUMN IF NOT EXISTS "gift_name_locked" boolean NOT NULL DEFAULT false;
    ALTER TABLE "tickets"
      ADD COLUMN IF NOT EXISTS "order_id" uuid;

    CREATE INDEX IF NOT EXISTS "tickets_order_idx"
      ON "tickets" ("order_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tickets_order_id_ticket_orders_id_fk'
      ) THEN
        ALTER TABLE "tickets"
          ADD CONSTRAINT "tickets_order_id_ticket_orders_id_fk"
          FOREIGN KEY ("order_id") REFERENCES "ticket_orders"("id")
          ON DELETE SET NULL;
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop FK first, then the column on the child, then the parent table.
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tickets_order_id_ticket_orders_id_fk'
      ) THEN
        ALTER TABLE "tickets" DROP CONSTRAINT "tickets_order_id_ticket_orders_id_fk";
      END IF;
    END $$;

    DROP INDEX IF EXISTS "tickets_order_idx";

    ALTER TABLE "tickets" DROP COLUMN IF EXISTS "order_id";
    ALTER TABLE "tickets" DROP COLUMN IF EXISTS "gift_name_locked";
    ALTER TABLE "tickets" DROP COLUMN IF EXISTS "gift_initial_name";

    DROP INDEX IF EXISTS "ticket_orders_purchaser_idx";
    DROP INDEX IF EXISTS "ticket_orders_event_idx";
    DROP INDEX IF EXISTS "ticket_orders_paid_idx";
    DROP INDEX IF EXISTS "ticket_orders_password_expires_at_idx";
    DROP INDEX IF EXISTS "ticket_orders_updated_at_idx";
    DROP INDEX IF EXISTS "ticket_orders_created_at_idx";

    DROP TABLE IF EXISTS "ticket_orders";
  `);
}
