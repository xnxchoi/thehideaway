import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Subscriptions — immutable money snapshots.
 *
 * A subscription keeps a Price reference for traceability, but invoices must
 * use the amount/currency selected at checkout. Catalog edits to Prices must
 * never rewrite pending or activated subscription money terms.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "amount" numeric,
      ADD COLUMN IF NOT EXISTS "currency_id" uuid;

    UPDATE "subscriptions" s
      SET "amount" = p."unit_amount"
      FROM "prices" p
      WHERE s."price_id" = p."id"
        AND s."amount" IS NULL;

    UPDATE "subscriptions" s
      SET "currency_id" = p."currency_id"
      FROM "prices" p
      WHERE s."price_id" = p."id"
        AND s."currency_id" IS NULL;

    UPDATE "subscriptions"
      SET "amount" = coalesce("amount", 0);

    DO $$
    DECLARE
      fallback_currency_id uuid;
    BEGIN
      IF EXISTS (SELECT 1 FROM "subscriptions" WHERE "currency_id" IS NULL) THEN
        SELECT "id"
        INTO fallback_currency_id
        FROM "currency"
        WHERE "name" = 'KRW'
        ORDER BY "created_at" ASC
        LIMIT 1;

        IF fallback_currency_id IS NULL THEN
          INSERT INTO "currency" (
            "name",
            "slug_key",
            "hash_id",
            "slug_lock",
            "slug",
            "kr_nm",
            "updated_at",
            "created_at"
          )
          VALUES (
            'KRW',
            'krw',
            substring(md5(random()::text), 1, 11),
            true,
            'krw',
            '원',
            now(),
            now()
          )
          ON CONFLICT DO NOTHING
          RETURNING "id" INTO fallback_currency_id;

          IF fallback_currency_id IS NULL THEN
            SELECT "id"
            INTO fallback_currency_id
            FROM "currency"
            WHERE "name" = 'KRW'
            ORDER BY "created_at" ASC
            LIMIT 1;
          END IF;
        END IF;

        IF fallback_currency_id IS NULL THEN
          RAISE EXCEPTION 'subscriptions.currency_id backfill needs a KRW currency row';
        END IF;

        UPDATE "subscriptions"
        SET "currency_id" = fallback_currency_id
        WHERE "currency_id" IS NULL;
      END IF;
    END $$;

    ALTER TABLE "subscriptions"
      ALTER COLUMN "amount" SET DEFAULT 0,
      ALTER COLUMN "amount" SET NOT NULL,
      ALTER COLUMN "currency_id" SET NOT NULL;

    DO $$ BEGIN
      ALTER TABLE "subscriptions"
        ADD CONSTRAINT "subscriptions_currency_id_currency_id_fk"
        FOREIGN KEY ("currency_id") REFERENCES "currency"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "subscriptions_currency_idx"
      ON "subscriptions" ("currency_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "subscriptions_currency_idx";
    ALTER TABLE "subscriptions"
      DROP CONSTRAINT IF EXISTS "subscriptions_currency_id_currency_id_fk";
    ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "currency_id",
      DROP COLUMN IF EXISTS "amount";
  `);
}
