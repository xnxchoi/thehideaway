import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Drop Toss integration from the events table and replace it with a
 * free-form payment_instructions textarea. The Tickets system has been
 * pivoted to manual payment confirmation — see
 * src/payload/collections/(consumption)/Events/index.ts.
 *
 * Safe to run on any environment that has the previous toss_payment_id
 * column. The down migration restores the column shape (uuid) created by
 * the original 20260430_071651 migration.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "toss_payment_id";
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_instructions" varchar;
  `);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "payment_instructions";
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "toss_payment_id" uuid;
  `);
}
