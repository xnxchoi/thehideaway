import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Sprint 2 follow-up — flip invoices.status DB default to 'draft'.
 *
 * The Stripe-style FSM was introduced in 20260514_100000_commerce_shape_v2
 * (adding 'draft' and 'open' to enum_invoices_status). Postgres rejects
 * referencing a newly-added enum value in the *same* transaction as the
 * ADD VALUE, so the SET DEFAULT 'draft' step had to move to its own
 * migration (i.e. its own transaction) to compile.
 *
 * Effect: new hand-authored Invoices in /vault default to status='draft'.
 * The issuance hook (issueInvoiceOnPaid) writes 'paid' explicitly, so
 * the bank-confirmed flow is unaffected.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'draft';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'paid';
  `);
}
