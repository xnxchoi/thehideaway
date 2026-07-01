import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

/**
 * Public invoice number floor.
 *
 * Invoice numbers already come from the atomic `invoices_number_seq`; this
 * migration applies the public-facing offset requested for launch so early
 * invoices do not start at 0000001. This is equivalent to `a * x + b` with
 * `a = 1` and `b = 1023`, so the first issued public number is 1024.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS "invoices_number_seq" AS bigint START 1024 INCREMENT 1;
    SELECT setval(
      'invoices_number_seq',
      GREATEST(
        coalesce((SELECT MAX("invoice_number") FROM "invoices"), 0) + 1,
        1024
      )::bigint,
      false
    );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS "invoices_number_seq" AS bigint START 1 INCREMENT 1;
    SELECT setval(
      'invoices_number_seq',
      GREATEST(
        coalesce((SELECT MAX("invoice_number") FROM "invoices"), 0) + 1,
        1
      )::bigint,
      false
    );
  `);
}
