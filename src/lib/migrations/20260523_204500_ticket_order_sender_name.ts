import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * TicketOrders — store the bank sender/depositor name captured before payment.
 *
 * Re-runnable per readmes/MIGRATIONS.md: every ALTER is guarded.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "sender_name" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      DROP COLUMN IF EXISTS "sender_name";
  `);
}
