import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * TicketOrders — immutable money snapshots.
 *
 * Ticket refunds and customer comms must not re-read mutable event prices.
 * Store the purchase-time unit amount, quantity, total amount, and currency
 * directly on the parent order.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_ticket_orders_currency" AS ENUM ('KRW');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "quantity" numeric,
      ADD COLUMN IF NOT EXISTS "unit_amount" numeric,
      ADD COLUMN IF NOT EXISTS "total_amount" numeric,
      ADD COLUMN IF NOT EXISTS "currency" "enum_ticket_orders_currency";

    WITH ticket_order_snapshots AS (
      SELECT
        o."id",
        greatest(1, count(t."order_id")::numeric) AS "quantity",
        coalesce(e."ticket_price", 0) AS "unit_amount"
      FROM "ticket_orders" o
      JOIN "events" e ON e."id" = o."event_id"
      LEFT JOIN "tickets" t ON t."order_id" = o."id"
      WHERE (
        o."quantity" IS NULL
        OR o."unit_amount" IS NULL
        OR o."total_amount" IS NULL
        OR o."currency" IS NULL
      )
      GROUP BY o."id", e."ticket_price"
    )
    UPDATE "ticket_orders" o
      SET
        "quantity" = s."quantity",
        "unit_amount" = s."unit_amount",
        "total_amount" = s."unit_amount" * s."quantity",
        "currency" = 'KRW'
      FROM ticket_order_snapshots s
      WHERE o."id" = s."id";

    UPDATE "ticket_orders"
      SET
        "quantity" = coalesce("quantity", 1),
        "unit_amount" = coalesce("unit_amount", 0),
        "total_amount" = coalesce("total_amount", 0),
        "currency" = coalesce("currency", 'KRW');

    ALTER TABLE "ticket_orders"
      ALTER COLUMN "quantity" SET DEFAULT 1,
      ALTER COLUMN "quantity" SET NOT NULL,
      ALTER COLUMN "unit_amount" SET DEFAULT 0,
      ALTER COLUMN "unit_amount" SET NOT NULL,
      ALTER COLUMN "total_amount" SET DEFAULT 0,
      ALTER COLUMN "total_amount" SET NOT NULL,
      ALTER COLUMN "currency" SET DEFAULT 'KRW',
      ALTER COLUMN "currency" SET NOT NULL;

  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      DROP COLUMN IF EXISTS "currency",
      DROP COLUMN IF EXISTS "total_amount",
      DROP COLUMN IF EXISTS "unit_amount",
      DROP COLUMN IF EXISTS "quantity";
    DROP TYPE IF EXISTS "enum_ticket_orders_currency";
  `);
}
