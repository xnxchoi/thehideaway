import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Sprint 2 — commerce shape v2 (Product ↔ Price split).
 *
 * The pre-Sprint-2 shape had every price collapsed into a single `Prices`
 * doc with a `currencies[]` array and no anchor currency. That made the
 * "what does this plan cost?" question structurally unanswerable — the
 * row order in `prices_currencies` decided which currency "won," and any
 * admin edit to that array silently rewrote already-paid invoices.
 *
 * This migration reshapes the catalog along Stripe / Polar lines:
 *
 * - **Plan** becomes the offer (name, tier, validity, features). The
 *   `Plan.price (hasMany → prices)` field is removed; the relationship
 *   inverts so Price points at Plan.
 * - **Price** is rebuilt as a real, scalar-fielded collection:
 *   `nickname`, `plan_id`, `currency_id`, `unit_amount`, `type`,
 *   optional `recurring_*` cadence columns, and `active`. One Plan can
 *   have N Prices (different currencies, future recurring cadences).
 * - **Subscription** gains `price_id` (required, admin-locked) so the
 *   *transacted* price is pinned at checkout; subsequent catalog edits
 *   cannot rewrite history.
 * - **Invoice** flips `currency` from a hard-coded enum (`krw|usd|eur`)
 *   to a relationship to the `currency` collection. Adds `fx_rate_used`
 *   (forward-looking, null at launch) and a nullable `price` ref so
 *   we can trace invoices back to their Price snapshot. The status enum
 *   expands `paid|pending|void` → `draft|open|paid|void` (Stripe FSM).
 * - **`invoices_payment_method.currency`** likewise flips from enum to
 *   relationship.
 * - **FXRate.rate** field-config drift (`text` in Payload, already
 *   `numeric(20,8)` in DB per Sprint 1) is fixed in the collection
 *   config; no DB change needed here.
 *
 * Order of operations matters: drop the hasMany rows in `plans_rels`
 * before truncating Prices, and drop FKs / enum types in the correct
 * sequence per the migration doctrine (`readmes/MIGRATIONS.md`).
 *
 * Backward compatibility is not a factor (DB is wipeable). Re-seed via
 * `pnpm tsx src/scripts/seedMembership.ts` after applying.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── Phase 1: Drop Plan→Prices hasMany relationship rows ──────────
    -- The Plan.price field is being removed. Clear the join-table rows
    -- so the column on plans_rels (if/when re-orphaned) can be cleaned
    -- by a future Payload generate cycle without dangling refs.
    DELETE FROM "plans_rels" WHERE "path" = 'price';

    -- ── Phase 2: Drop the old Prices array shape ─────────────────────
    -- prices_currencies was the array child of the old currencies[]
    -- field. CASCADE drops its FKs to currency and prices.
    DROP TABLE IF EXISTS "prices_currencies" CASCADE;

    -- Empty the prices table so we can add NOT NULL columns. No other
    -- table references prices at this point (the plans_rels rows above
    -- were just deleted, and Subscription.price_id doesn't exist yet).
    DELETE FROM "prices";

    -- ── Phase 3: Reshape Prices with new scalar columns ──────────────
    DO $$ BEGIN
      CREATE TYPE "enum_prices_type" AS ENUM ('one_time', 'recurring');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_prices_recurring_interval"
        AS ENUM ('day', 'week', 'month', 'year');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "nickname" varchar NOT NULL;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "plan_id" uuid NOT NULL;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "currency_id" uuid NOT NULL;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "unit_amount" numeric NOT NULL;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "type"
      "enum_prices_type" DEFAULT 'one_time' NOT NULL;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "recurring_interval"
      "enum_prices_recurring_interval" DEFAULT 'month';
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "recurring_interval_count"
      numeric DEFAULT 1;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "recurring_trial_period_days"
      numeric DEFAULT 0;
    ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "active"
      boolean DEFAULT true NOT NULL;

    -- FKs (named to mirror Payload's <table>_<col>_<target>_id_fk convention).
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prices_plan_id_plans_id_fk'
      ) THEN
        ALTER TABLE "prices"
          ADD CONSTRAINT "prices_plan_id_plans_id_fk"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'prices_currency_id_currency_id_fk'
      ) THEN
        ALTER TABLE "prices"
          ADD CONSTRAINT "prices_currency_id_currency_id_fk"
          FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "prices_plan_idx"
      ON "prices" USING btree ("plan_id");
    CREATE INDEX IF NOT EXISTS "prices_currency_idx"
      ON "prices" USING btree ("currency_id");
    CREATE INDEX IF NOT EXISTS "prices_active_idx"
      ON "prices" USING btree ("active");

    -- ── Phase 4: Subscription.price_id ───────────────────────────────
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "price_id" uuid NOT NULL;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscriptions_price_id_prices_id_fk'
      ) THEN
        ALTER TABLE "subscriptions"
          ADD CONSTRAINT "subscriptions_price_id_prices_id_fk"
          FOREIGN KEY ("price_id") REFERENCES "prices"("id")
          ON DELETE no action ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "subscriptions_price_idx"
      ON "subscriptions" USING btree ("price_id");

    -- ── Phase 5: Invoices currency relationship + fx_rate_used + price ref
    ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "currency_id" uuid;
    ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "fx_rate_used" numeric(20, 8);
    ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "price_id" uuid;

    -- Drop the old enum column. The constraint name follows the column;
    -- DROP COLUMN cascades drop of the enum-typed column itself.
    ALTER TABLE "invoices" DROP COLUMN IF EXISTS "currency";

    -- Now the enum type has no users and can go.
    DROP TYPE IF EXISTS "enum_invoices_currency";

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'invoices_currency_id_currency_id_fk'
      ) THEN
        ALTER TABLE "invoices"
          ADD CONSTRAINT "invoices_currency_id_currency_id_fk"
          FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'invoices_price_id_prices_id_fk'
      ) THEN
        ALTER TABLE "invoices"
          ADD CONSTRAINT "invoices_price_id_prices_id_fk"
          FOREIGN KEY ("price_id") REFERENCES "prices"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "invoices_currency_idx"
      ON "invoices" USING btree ("currency_id");

    -- ── Phase 6: Invoice status FSM expansion ────────────────────────
    -- Add 'draft' and 'open' to the existing status enum. Postgres 12+
    -- supports IF NOT EXISTS on ALTER TYPE ADD VALUE.
    ALTER TYPE "enum_invoices_status" ADD VALUE IF NOT EXISTS 'draft' BEFORE 'paid';
    ALTER TYPE "enum_invoices_status" ADD VALUE IF NOT EXISTS 'open' BEFORE 'paid';

    -- Flip default. New manual entries start as 'draft'. The hook still
    -- writes 'paid' explicitly on bank-confirmed flow.
    ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'draft';

    -- ── Phase 7: invoices_payment_method.currency_id ─────────────────
    ALTER TABLE "invoices_payment_method"
      ADD COLUMN IF NOT EXISTS "currency_id" uuid;
    ALTER TABLE "invoices_payment_method" DROP COLUMN IF EXISTS "currency";
    DROP TYPE IF EXISTS "enum_invoices_payment_method_currency";

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'invoices_payment_method_currency_id_currency_id_fk'
      ) THEN
        ALTER TABLE "invoices_payment_method"
          ADD CONSTRAINT "invoices_payment_method_currency_id_currency_id_fk"
          FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Reverse, best-effort. Multi-currency price rows and fx_rate_used
    -- values are not preserved.

    -- invoices_payment_method.currency_id → enum
    ALTER TABLE "invoices_payment_method"
      DROP CONSTRAINT IF EXISTS "invoices_payment_method_currency_id_currency_id_fk";
    ALTER TABLE "invoices_payment_method" DROP COLUMN IF EXISTS "currency_id";
    DO $$ BEGIN
      CREATE TYPE "enum_invoices_payment_method_currency"
        AS ENUM ('krw', 'usd', 'eur');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "invoices_payment_method"
      ADD COLUMN IF NOT EXISTS "currency"
      "enum_invoices_payment_method_currency" DEFAULT 'krw' NOT NULL;

    -- invoices.status default + enum (we cannot DROP VALUE from an enum
    -- in vanilla Postgres without recreating the type; leave the
    -- 'draft' and 'open' values present and just restore the default).
    ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'paid';

    -- invoices currency_id / fx_rate_used / price_id → enum
    DROP INDEX IF EXISTS "invoices_currency_idx";
    ALTER TABLE "invoices"
      DROP CONSTRAINT IF EXISTS "invoices_currency_id_currency_id_fk";
    ALTER TABLE "invoices"
      DROP CONSTRAINT IF EXISTS "invoices_price_id_prices_id_fk";
    ALTER TABLE "invoices" DROP COLUMN IF EXISTS "currency_id";
    ALTER TABLE "invoices" DROP COLUMN IF EXISTS "fx_rate_used";
    ALTER TABLE "invoices" DROP COLUMN IF EXISTS "price_id";
    DO $$ BEGIN
      CREATE TYPE "enum_invoices_currency" AS ENUM ('krw', 'usd', 'eur');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "currency"
      "enum_invoices_currency" DEFAULT 'krw' NOT NULL;

    -- Subscription.price_id
    DROP INDEX IF EXISTS "subscriptions_price_idx";
    ALTER TABLE "subscriptions"
      DROP CONSTRAINT IF EXISTS "subscriptions_price_id_prices_id_fk";
    ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "price_id";

    -- Prices: drop scalar columns + restore the empty array child shell.
    DROP INDEX IF EXISTS "prices_plan_idx";
    DROP INDEX IF EXISTS "prices_currency_idx";
    DROP INDEX IF EXISTS "prices_active_idx";
    ALTER TABLE "prices"
      DROP CONSTRAINT IF EXISTS "prices_plan_id_plans_id_fk";
    ALTER TABLE "prices"
      DROP CONSTRAINT IF EXISTS "prices_currency_id_currency_id_fk";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "nickname";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "plan_id";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "currency_id";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "unit_amount";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "type";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "recurring_interval";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "recurring_interval_count";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "recurring_trial_period_days";
    ALTER TABLE "prices" DROP COLUMN IF EXISTS "active";
    DROP TYPE IF EXISTS "enum_prices_type";
    DROP TYPE IF EXISTS "enum_prices_recurring_interval";

    CREATE TABLE IF NOT EXISTS "prices_currencies" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "amount" numeric NOT NULL,
      "currency_id" uuid NOT NULL
    );
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'prices_currencies_currency_id_currency_id_fk'
      ) THEN
        ALTER TABLE "prices_currencies"
          ADD CONSTRAINT "prices_currencies_currency_id_currency_id_fk"
          FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'prices_currencies_parent_id_fk'
      ) THEN
        ALTER TABLE "prices_currencies"
          ADD CONSTRAINT "prices_currencies_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "prices"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS "prices_currencies_order_idx"
      ON "prices_currencies" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "prices_currencies_parent_id_idx"
      ON "prices_currencies" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "prices_currencies_currency_idx"
      ON "prices_currencies" USING btree ("currency_id");
  `);
}
