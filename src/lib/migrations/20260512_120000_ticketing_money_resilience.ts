import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Sprint 1 — money resilience.
 *
 * Five coupled changes that need to land together:
 *
 * 1. **`ticket_number` sequence.** Tickets previously got their number by
 *    reading `max(ticket_number) + 1` inside the purchase route — a race
 *    where two concurrent purchases both saw the same max and the second
 *    crashed on the unique-index violation. Replace with a real Postgres
 *    sequence seeded just past the current max. `nextval` is atomic
 *    under any concurrency.
 *
 * 2. **`invoice_number` sequence.** Same problem in `issueInvoiceOnPaid`.
 *    Same fix.
 *
 * 3. **`tickets.reminder_sent_at`** — column needed by the pre-event
 *    reminder cron (Sprint 0 added the schema field but the column
 *    needed a migration). Indexed so the dedup `WHERE` predicate is
 *    index-backed.
 *
 * 4. **Partial unique pending-subscription index.** Closes the sub-second
 *    TOCTOU in /api/checkout/manual where two simultaneous requests
 *    could both miss the pre-check and create duplicate pending rows.
 *    Postgres enforces "at most one pending row per (user, plan)" at
 *    the index level — the loser of the race gets a unique-violation
 *    that the route translates to the same dedup response.
 *
 * 5. **`exchange_rate_rates.rate` text → numeric.** Money arithmetic on
 *    a varchar column is a footgun; "1,234.56", "abc", and "" all parse
 *    silently when read. Cast existing rows defensively and convert
 *    the column to `numeric(20, 8)` (enough precision for any FX pair).
 *    Adds a CHECK constraint to reject negative rates.
 *
 * The sequences are seeded with `setval(max + 1, false)` so the very
 * first `nextval` after this migration returns `max + 1` — preserving
 * monotonic continuity with any rows already in the table.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── Tickets: reminder_sent_at + sequence ──────────────────────────
    ALTER TABLE "tickets"
      ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp(3) with time zone;
    CREATE INDEX IF NOT EXISTS "tickets_reminder_sent_at_idx"
      ON "tickets" USING btree ("reminder_sent_at");

    CREATE SEQUENCE IF NOT EXISTS "tickets_number_seq" AS bigint START 1 INCREMENT 1;
    -- Advance the sequence past any existing rows so new tickets keep
    -- monotonic continuity. coalesce + setval(_, false) means the next
    -- nextval() call returns (max + 1) exactly.
    SELECT setval(
      'tickets_number_seq',
      GREATEST(
        coalesce((SELECT MAX("ticket_number") FROM "tickets"), 0) + 1,
        1
      ),
      false
    );

    -- ── Invoices: sequence ───────────────────────────────────────────
    CREATE SEQUENCE IF NOT EXISTS "invoices_number_seq" AS bigint START 1 INCREMENT 1;
    SELECT setval(
      'invoices_number_seq',
      GREATEST(
        coalesce((SELECT MAX("invoice_number") FROM "invoices"), 0) + 1,
        1
      ),
      false
    );

    -- ── Subscriptions: partial unique on pending ─────────────────────
    -- At most one "pending" subscription per (user, plan). Two
    -- concurrent /api/checkout/manual requests will race past the
    -- pre-existence check; this constraint serializes them at the
    -- DB and the second one's INSERT errors out.
    CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_pending_user_plan_uniq"
      ON "subscriptions" ("user_id", "plan_id")
      WHERE subscription_status = 'pending';

    -- ── FXRate: rate text → numeric ──────────────────────────────────
    -- Defensive cast: nullify any value that can't parse as a number
    -- (most likely a stray "" or "—" placeholder), then convert the
    -- column. CHECK constraint excludes negative rates.
    UPDATE "exchange_rate_rates"
      SET "rate" = NULL
      WHERE "rate" IS NOT NULL
        AND "rate" !~ '^-?[0-9]+(\\.[0-9]+)?$';
    ALTER TABLE "exchange_rate_rates"
      ALTER COLUMN "rate" TYPE numeric(20, 8)
      USING NULLIF("rate", '')::numeric(20, 8);
    ALTER TABLE "exchange_rate_rates"
      ADD CONSTRAINT "exchange_rate_rates_rate_nonneg_chk"
      CHECK ("rate" IS NULL OR "rate" >= 0);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "exchange_rate_rates"
      DROP CONSTRAINT IF EXISTS "exchange_rate_rates_rate_nonneg_chk";
    ALTER TABLE "exchange_rate_rates"
      ALTER COLUMN "rate" TYPE varchar USING "rate"::text;
    DROP INDEX IF EXISTS "subscriptions_pending_user_plan_uniq";
    DROP SEQUENCE IF EXISTS "invoices_number_seq";
    DROP SEQUENCE IF EXISTS "tickets_number_seq";
    DROP INDEX IF EXISTS "tickets_reminder_sent_at_idx";
    ALTER TABLE "tickets" DROP COLUMN IF EXISTS "reminder_sent_at";
  `);
}
