import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Subscription one-time card payments (PortOne).
 *
 * Adds the columns the plans card-checkout flow needs to reconcile a
 * PortOne payment against a pending subscription idempotently:
 *
 *   - `payment_ref` (unique) — the PortOne `paymentId` captured at
 *     checkout start. Both the browser-return verify route and the
 *     webhook look the row up by this ref; the unique constraint makes a
 *     duplicate paymentId a no-op (one subscription, one invoice).
 *   - `portone_transaction_ref` — the settled PortOne transaction id,
 *     stamped on verification for traceability.
 *   - `request_method` gains `'card'` so the checkout method selector can
 *     record a card request alongside `bank_transfer` / `cash`.
 *
 * The `enum_subscriptions_provider` type already carries `'portone'`
 * (seed migration 20260426_115336), and `enum_plans_payment_methods`
 * already carries `'card'`, so no plan-side enum change is required —
 * only the collection config gate is widened in code.
 *
 * Idempotent per readmes/MIGRATIONS.md: every statement is guarded.
 *
 * Postgres caveat: `ALTER TYPE ... ADD VALUE` cannot run inside a DO
 * block, and on Postgres < 12 cannot run inside a transaction either.
 * Deployment is Postgres 16 (see 20260515_120000_role_resident_cofounder
 * for the same pattern), so `ADD VALUE IF NOT EXISTS` runs at top level.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "payment_ref" varchar,
      ADD COLUMN IF NOT EXISTS "portone_transaction_ref" varchar;

    ALTER TYPE "enum_subscriptions_request_method" ADD VALUE IF NOT EXISTS 'card';

    CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_payment_ref_uniq"
      ON "subscriptions" ("payment_ref")
      WHERE "payment_ref" IS NOT NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "subscriptions_payment_ref_uniq";
    ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "portone_transaction_ref",
      DROP COLUMN IF EXISTS "payment_ref";
  `);
}
