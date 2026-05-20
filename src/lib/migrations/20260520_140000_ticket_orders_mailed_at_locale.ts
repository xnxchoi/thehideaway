import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * TicketOrders — add `mailed_at` (password-mail idempotency stamp) and
 * `locale` (per-order email locale, source-of-truth for the password mail
 * content language).
 *
 *   mailed_at — TIMESTAMP, nullable. Set when the order-password mail
 *               has been delivered to the purchaser. The
 *               `issueOrderPaidPassword` afterChange hook checks this to
 *               decide whether to (re)send mail; a null value means
 *               "send now". Cleared whenever the password itself is
 *               regenerated so admin re-issue triggers a new mail.
 *
 *   locale    — varchar, default 'ko'. The 4-step purchase flow (P4C-1)
 *               snapshots the purchaser's session locale at order
 *               creation. The password mail templating reads this to
 *               render EN or KO copy. Admin-editable as a fallback.
 *
 * Re-runnable per readmes/MIGRATIONS.md:
 *   - ADD COLUMN wrapped with IF NOT EXISTS
 *   - DROP COLUMN wrapped with IF EXISTS
 *
 * Mirrors Payload's TIMESTAMP(3) WITH TIME ZONE and snake_case shape
 * established by 20260519_180000_ticket_orders.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "mailed_at" timestamp(3) with time zone;

    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "locale" varchar NOT NULL DEFAULT 'ko';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "ticket_orders" DROP COLUMN IF EXISTS "locale";
    ALTER TABLE "ticket_orders" DROP COLUMN IF EXISTS "mailed_at";
  `);
}
