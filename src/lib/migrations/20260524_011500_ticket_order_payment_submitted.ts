import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * TicketOrders — purchaser-submitted bank transfer state.
 *
 * Re-runnable per readmes/MIGRATIONS.md: every ALTER / INDEX is guarded.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "payment_submitted_at" timestamp(3) with time zone;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "ticket_orders_payment_submitted_at_idx"
      ON "ticket_orders" ("payment_submitted_at");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "ticket_orders_payment_submitted_at_idx";
  `);

  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      DROP COLUMN IF EXISTS "payment_submitted_at";
  `);
}
